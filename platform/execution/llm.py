"""LLM interface — pluggable adapter design."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class LLMRequest:
    prompt: str
    system_prompt: str = ""
    max_tokens: int = 4096
    temperature: float = 0.7
    context: dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolCall:
    tool_name: str
    parameters: dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMResponse:
    content: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    tokens_used: int = 0
    finish_reason: str = "stop"
    raw_response: dict[str, Any] = field(default_factory=dict)


class BaseLLM(ABC):
    """Abstract LLM interface. Implement for any provider."""

    @abstractmethod
    def complete(self, request: LLMRequest) -> LLMResponse:
        """Send a completion request to the LLM."""
        ...

    @abstractmethod
    def name(self) -> str:
        """Return the name/identifier of this LLM provider."""
        ...


class MockLLM(BaseLLM):
    """Mock LLM for testing and development."""

    def __init__(self, default_response: str = "Mock response", tokens: int = 50) -> None:
        self._default_response = default_response
        self._tokens = tokens
        self._call_count = 0

    def complete(self, request: LLMRequest) -> LLMResponse:
        self._call_count += 1

        # Simulate tool call if prompt contains "use tool"
        if "use tool" in request.prompt.lower():
            parts = request.prompt.lower().split("use tool")
            tool_name = parts[1].strip().split()[0] if len(parts) > 1 else "mock_tool"
            return LLMResponse(
                content="",
                tool_calls=[ToolCall(tool_name=tool_name, parameters={})],
                tokens_used=self._tokens,
                finish_reason="tool_use",
            )

        return LLMResponse(
            content=self._default_response,
            tokens_used=self._tokens,
            finish_reason="stop",
        )

    def name(self) -> str:
        return "mock"

    @property
    def call_count(self) -> int:
        return self._call_count
