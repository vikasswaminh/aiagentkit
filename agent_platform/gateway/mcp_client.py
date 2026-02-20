"""MCP Client — connects to MCP tool servers, discovers tools, forwards calls.

This module provides the transport layer between the MCPAuthorizationProxy
and actual MCP-compliant tool servers. The proxy handles auth/policy/budget;
this module handles the MCP protocol wire format.

Supports stdio and SSE transport modes per MCP specification.
"""

from __future__ import annotations

import json
import subprocess
import threading
from dataclasses import dataclass, field
from typing import Any, Callable

from agent_platform.shared.logging import get_logger

log = get_logger()


@dataclass
class MCPToolSchema:
    """Schema for a tool discovered from an MCP server."""
    name: str
    description: str = ""
    input_schema: dict[str, Any] = field(default_factory=dict)
    server_name: str = ""


@dataclass
class MCPServerConfig:
    """Configuration for connecting to an MCP server."""
    name: str
    command: list[str]  # e.g., ["python", "-m", "my_mcp_server"]
    env: dict[str, str] = field(default_factory=dict)
    transport: str = "stdio"  # "stdio" or "sse"
    url: str = ""  # for SSE transport


class MCPServerConnection:
    """Connection to a single MCP server over stdio.

    Implements the MCP client protocol:
    1. Initialize connection (send initialize request)
    2. Discover tools (send tools/list request)
    3. Forward tool calls (send tools/call requests)
    4. Clean shutdown
    """

    def __init__(self, config: MCPServerConfig) -> None:
        self._config = config
        self._process: subprocess.Popen | None = None
        self._tools: dict[str, MCPToolSchema] = {}
        self._request_id = 0
        self._lock = threading.Lock()

    def connect(self) -> None:
        """Start the MCP server process and initialize the connection."""
        if self._config.transport == "stdio":
            self._process = subprocess.Popen(
                self._config.command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**dict(__import__("os").environ), **self._config.env},
            )
            self._initialize()
            self._discover_tools()
            log.info(
                "mcp_server_connected",
                server=self._config.name,
                tools=len(self._tools),
            )
        else:
            raise NotImplementedError(f"Transport {self._config.transport} not yet supported")

    def _next_id(self) -> int:
        with self._lock:
            self._request_id += 1
            return self._request_id

    def _send_request(self, method: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        """Send a JSON-RPC request to the MCP server and read the response."""
        if self._process is None or self._process.stdin is None or self._process.stdout is None:
            raise RuntimeError("MCP server not connected")

        request = {
            "jsonrpc": "2.0",
            "id": self._next_id(),
            "method": method,
        }
        if params:
            request["params"] = params

        request_bytes = json.dumps(request).encode("utf-8") + b"\n"
        self._process.stdin.write(request_bytes)
        self._process.stdin.flush()

        # Read response line
        response_line = self._process.stdout.readline()
        if not response_line:
            raise RuntimeError("MCP server closed connection")

        return json.loads(response_line)

    def _initialize(self) -> None:
        """Send MCP initialize request."""
        response = self._send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "agent-platform-gateway",
                "version": "0.1.0",
            },
        })
        if "error" in response:
            raise RuntimeError(f"MCP init failed: {response['error']}")
        # Send initialized notification
        self._send_request("notifications/initialized")

    def _discover_tools(self) -> None:
        """Discover available tools from the MCP server."""
        response = self._send_request("tools/list")
        result = response.get("result", {})
        tools = result.get("tools", [])
        for tool in tools:
            schema = MCPToolSchema(
                name=tool["name"],
                description=tool.get("description", ""),
                input_schema=tool.get("inputSchema", {}),
                server_name=self._config.name,
            )
            self._tools[tool["name"]] = schema

    def call_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """Forward a tool call to the MCP server."""
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' not available on server '{self._config.name}'")

        response = self._send_request("tools/call", {
            "name": name,
            "arguments": arguments,
        })

        if "error" in response:
            raise RuntimeError(f"MCP tool call failed: {response['error']}")

        result = response.get("result", {})
        # MCP returns content array
        content = result.get("content", [])
        if content and isinstance(content, list):
            texts = [c.get("text", "") for c in content if c.get("type") == "text"]
            return "\n".join(texts) if texts else content
        return result

    @property
    def tools(self) -> dict[str, MCPToolSchema]:
        return dict(self._tools)

    def disconnect(self) -> None:
        """Shut down the MCP server process."""
        if self._process:
            try:
                self._process.stdin.close()
                self._process.terminate()
                self._process.wait(timeout=5)
            except Exception:
                self._process.kill()
            finally:
                self._process = None
            log.info("mcp_server_disconnected", server=self._config.name)


class MCPClientManager:
    """Manages multiple MCP server connections.

    Discovers tools from all connected servers and provides a unified
    tool_handler callable that routes calls to the correct server.
    """

    def __init__(self) -> None:
        self._connections: dict[str, MCPServerConnection] = {}
        self._tool_to_server: dict[str, str] = {}

    def add_server(self, config: MCPServerConfig) -> None:
        """Connect to an MCP server and discover its tools."""
        conn = MCPServerConnection(config)
        conn.connect()
        self._connections[config.name] = conn
        for tool_name in conn.tools:
            self._tool_to_server[tool_name] = config.name

    def get_all_tools(self) -> list[MCPToolSchema]:
        """Get all tools from all connected servers."""
        tools = []
        for conn in self._connections.values():
            tools.extend(conn.tools.values())
        return tools

    def call_tool(self, name: str, **arguments: Any) -> Any:
        """Route a tool call to the correct MCP server."""
        server_name = self._tool_to_server.get(name)
        if server_name is None:
            raise ValueError(f"Tool '{name}' not found on any connected MCP server")
        return self._connections[server_name].call_tool(name, arguments)

    def get_tool_handler(self, name: str) -> Callable[..., Any]:
        """Get a callable handler for a specific tool (for proxy registration)."""
        def handler(**kwargs: Any) -> Any:
            return self.call_tool(name, **kwargs)
        return handler

    def disconnect_all(self) -> None:
        """Disconnect from all MCP servers."""
        for conn in self._connections.values():
            conn.disconnect()
        self._connections.clear()
        self._tool_to_server.clear()
