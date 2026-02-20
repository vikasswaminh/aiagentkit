"""Claude LLM provider — Anthropic SDK integration with tool_use support."""

from __future__ import annotations

import os
from typing import Any

from agent_platform.execution.llm import BaseLLM, LLMRequest, LLMResponse, ToolCall
from agent_platform.shared.logging import get_logger

log = get_logger()


class ClaudeLLM(BaseLLM):
    """Claude integration via the Anthropic SDK.

    Requires: pip install anthropic
    Set ANTHROPIC_API_KEY environment variable.

    Supports tool_use: pass tool schemas via request.context["tools"] and
    Claude will return ToolCall objects when it decides to use a tool.
    """

    def __init__(
        self,
        model: str = "claude-sonnet-4-20250514",
        api_key: str | None = None,
        max_tokens: int = 4096,
    ) -> None:
        try:
            import anthropic
        except ImportError:
            raise ImportError("Claude provider requires: pip install anthropic")

        self._model = model
        self._max_tokens = max_tokens
        self._client = anthropic.Anthropic(
            api_key=api_key or os.environ.get("ANTHROPIC_API_KEY")
        )

    def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request to Claude."""
        kwargs: dict[str, Any] = {
            "model": self._model,
            "max_tokens": request.max_tokens or self._max_tokens,
            "messages": [{"role": "user", "content": request.prompt}],
        }

        if request.system_prompt:
            kwargs["system"] = request.system_prompt

        if request.temperature is not None:
            kwargs["temperature"] = request.temperature

        # Add tools if provided in context
        tools = request.context.get("tools")
        if tools:
            kwargs["tools"] = self._format_tools(tools)

        response = self._client.messages.create(**kwargs)

        # Parse response
        content = ""
        tool_calls = []
        for block in response.content:
            if block.type == "text":
                content += block.text
            elif block.type == "tool_use":
                tool_calls.append(
                    ToolCall(
                        tool_name=block.name,
                        parameters=block.input or {},
                    )
                )

        tokens_used = (
            response.usage.input_tokens + response.usage.output_tokens
        )

        log.info(
            "claude_completion",
            model=self._model,
            tokens_used=tokens_used,
            tool_calls=len(tool_calls),
            finish_reason=response.stop_reason,
        )

        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            tokens_used=tokens_used,
            finish_reason=response.stop_reason or "end_turn",
            raw_response={"id": response.id, "model": response.model},
        )

    def _format_tools(self, tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Format tool schemas for Claude's tool_use format."""
        formatted = []
        for tool in tools:
            formatted.append({
                "name": tool.get("name", ""),
                "description": tool.get("description", ""),
                "input_schema": tool.get("parameters", {
                    "type": "object",
                    "properties": {},
                }),
            })
        return formatted

    def name(self) -> str:
        return f"claude:{self._model}"
