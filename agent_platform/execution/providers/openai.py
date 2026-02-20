"""OpenAI LLM provider — function calling support."""

from __future__ import annotations

import json
import os
from typing import Any

from agent_platform.execution.llm import BaseLLM, LLMRequest, LLMResponse, ToolCall
from agent_platform.shared.logging import get_logger

log = get_logger()


class OpenAILLM(BaseLLM):
    """OpenAI integration via the OpenAI SDK.

    Requires: pip install openai
    Set OPENAI_API_KEY environment variable.

    Supports function calling: pass tool schemas via request.context["tools"]
    and the model will return ToolCall objects when it decides to use a tool.
    """

    def __init__(
        self,
        model: str = "gpt-4o",
        api_key: str | None = None,
        max_tokens: int = 4096,
    ) -> None:
        try:
            from openai import OpenAI
        except ImportError:
            raise ImportError("OpenAI provider requires: pip install openai")

        self._model = model
        self._max_tokens = max_tokens
        self._client = OpenAI(
            api_key=api_key or os.environ.get("OPENAI_API_KEY")
        )

    def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request to OpenAI."""
        messages: list[dict[str, Any]] = []

        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})

        messages.append({"role": "user", "content": request.prompt})

        kwargs: dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "max_tokens": request.max_tokens or self._max_tokens,
        }

        if request.temperature is not None:
            kwargs["temperature"] = request.temperature

        # Add tools if provided in context
        tools = request.context.get("tools")
        if tools:
            kwargs["tools"] = self._format_tools(tools)

        response = self._client.chat.completions.create(**kwargs)

        choice = response.choices[0]
        content = choice.message.content or ""
        tool_calls = []

        if choice.message.tool_calls:
            for tc in choice.message.tool_calls:
                try:
                    params = json.loads(tc.function.arguments) if tc.function.arguments else {}
                except json.JSONDecodeError:
                    params = {}
                tool_calls.append(
                    ToolCall(
                        tool_name=tc.function.name,
                        parameters=params,
                    )
                )

        tokens_used = response.usage.total_tokens if response.usage else 0

        log.info(
            "openai_completion",
            model=self._model,
            tokens_used=tokens_used,
            tool_calls=len(tool_calls),
            finish_reason=choice.finish_reason,
        )

        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            tokens_used=tokens_used,
            finish_reason=choice.finish_reason or "stop",
            raw_response={"id": response.id, "model": response.model},
        )

    def _format_tools(self, tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
        """Format tool schemas for OpenAI's function calling format."""
        formatted = []
        for tool in tools:
            formatted.append({
                "type": "function",
                "function": {
                    "name": tool.get("name", ""),
                    "description": tool.get("description", ""),
                    "parameters": tool.get("parameters", {
                        "type": "object",
                        "properties": {},
                    }),
                },
            })
        return formatted

    def name(self) -> str:
        return f"openai:{self._model}"
