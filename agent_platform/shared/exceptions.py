"""Custom exception hierarchy for the agent platform.

All platform-specific exceptions inherit from AgentPlatformError, allowing
callers to catch broad or specific failure modes and implement appropriate
retry/fallback logic.
"""

from __future__ import annotations


class AgentPlatformError(Exception):
    """Base exception for all agent platform errors."""


# --- Identity / Lookup errors ---


class NotFoundError(AgentPlatformError):
    """Requested resource does not exist."""


class AgentNotFoundError(NotFoundError):
    """Agent not found or inactive."""


class OrgNotFoundError(NotFoundError):
    """Organization not found."""


class PolicyNotFoundError(NotFoundError):
    """No policy configured for the given org/agent."""


# --- Policy errors ---


class PolicyViolationError(AgentPlatformError):
    """Action denied by policy evaluation."""

    def __init__(self, reason: str, policy_id: str | None = None) -> None:
        self.reason = reason
        self.policy_id = policy_id
        super().__init__(reason)


# --- Budget errors ---


class BudgetExhaustedError(AgentPlatformError):
    """Token budget exceeded for agent or org."""

    def __init__(self, reason: str, tokens_remaining: int = 0) -> None:
        self.reason = reason
        self.tokens_remaining = tokens_remaining
        super().__init__(reason)


class InvalidUsageError(AgentPlatformError):
    """Invalid usage report (e.g., negative tokens)."""


# --- Token errors ---


class TokenError(AgentPlatformError):
    """Base for token-related failures."""


class TokenExpiredError(TokenError):
    """Scoped token has expired."""


class TokenNotFoundError(TokenError):
    """Token ID not found (revoked or never issued)."""


class TokenCapacityError(TokenError):
    """Token store is at capacity and cleanup did not free space."""


# --- Tool errors ---


class ToolNotFoundError(AgentPlatformError):
    """Requested tool is not registered."""


class ToolExecutionError(AgentPlatformError):
    """Tool execution failed."""


class ToolParameterError(AgentPlatformError):
    """Tool call parameters failed validation."""


class SSRFBlockedError(AgentPlatformError):
    """URL blocked by SSRF protection."""


# --- Store errors ---


class StoreError(AgentPlatformError):
    """Base for persistence layer failures."""


class StoreWriteError(StoreError):
    """Failed to write to store."""


class StoreReadError(StoreError):
    """Failed to read from store."""


# --- External service errors ---


class ServiceUnavailableError(AgentPlatformError):
    """External service (OPA, LLM, MCP server) is unreachable."""

    def __init__(self, service: str, reason: str = "") -> None:
        self.service = service
        self.reason = reason
        super().__init__(f"{service} unavailable: {reason}" if reason else f"{service} unavailable")


class ConfigurationError(AgentPlatformError):
    """Invalid or missing configuration."""
