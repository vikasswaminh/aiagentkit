"""Tool system — registry, base class, and policy-gated execution."""

from __future__ import annotations

import ipaddress
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urlparse

from agent_platform.shared.exceptions import SSRFBlockedError, ToolNotFoundError
from agent_platform.shared.logging import get_logger

log = get_logger()


@dataclass
class ToolSchema:
    name: str
    description: str
    parameters: dict[str, Any] = field(default_factory=dict)


class BaseTool(ABC):
    """Abstract base class for all tools."""

    @abstractmethod
    def execute(self, **kwargs: Any) -> Any:
        """Execute the tool with given parameters."""
        ...

    @abstractmethod
    def schema(self) -> ToolSchema:
        """Return the tool's schema (name, description, parameters)."""
        ...


class ToolRegistry:
    """Registry for tool discovery and execution."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        schema = tool.schema()
        self._tools[schema.name] = tool
        log.info("tool_registered", tool_name=schema.name)

    def get(self, name: str) -> BaseTool | None:
        return self._tools.get(name)

    def list(self) -> list[ToolSchema]:
        return [t.schema() for t in self._tools.values()]

    def execute(self, name: str, **kwargs: Any) -> Any:
        tool = self._tools.get(name)
        if tool is None:
            raise ToolNotFoundError(f"tool '{name}' not registered")
        return tool.execute(**kwargs)

    @property
    def count(self) -> int:
        return len(self._tools)


# --- SSRF protection ---

_BLOCKED_HOSTS = {"metadata.google.internal", "169.254.169.254"}


def _is_ssrf_safe(url: str) -> bool:
    """Validate URL is not targeting internal/private networks."""
    parsed = urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        return False
    if hostname in _BLOCKED_HOSTS:
        return False
    try:
        addr = ipaddress.ip_address(hostname)
        if addr.is_private or addr.is_loopback or addr.is_link_local:
            return False
    except ValueError:
        # hostname is a DNS name, not an IP literal — allow
        pass
    return True


# --- Built-in Tools ---


class HTTPTool(BaseTool):
    """HTTP request tool with SSRF protection."""

    def execute(self, url: str = "", method: str = "GET", **kwargs: Any) -> Any:
        if not url:
            raise ToolNotFoundError("url parameter is required")
        if not _is_ssrf_safe(url):
            raise SSRFBlockedError(f"URL blocked by SSRF protection: {url}")

        import httpx

        with httpx.Client(timeout=30.0, follow_redirects=False) as client:
            resp = client.request(method, url, **kwargs)
            return {
                "status_code": resp.status_code,
                "body": resp.text[:10000],
                "headers": dict(resp.headers),
            }

    def schema(self) -> ToolSchema:
        return ToolSchema(
            name="http",
            description="Make HTTP requests",
            parameters={
                "url": {"type": "string", "required": True},
                "method": {"type": "string", "default": "GET"},
            },
        )


class MockTool(BaseTool):
    """Mock tool for testing."""

    def __init__(self, name: str = "mock", response: Any = "mock result") -> None:
        self._name = name
        self._response = response

    def execute(self, **kwargs: Any) -> Any:
        return self._response

    def schema(self) -> ToolSchema:
        return ToolSchema(
            name=self._name,
            description=f"Mock tool: {self._name}",
        )
