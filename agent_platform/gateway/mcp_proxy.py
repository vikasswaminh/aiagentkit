"""MCP Authorization Proxy — intercepts tool calls, enforces policy + budget."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import AuditEntry, PolicyDecision, _new_id
from agent_platform.shared.validation import ValidationError

log = get_logger()


@dataclass
class ToolCallRequest:
    agent_id: str
    org_id: str
    delegated_user_id: str | None
    execution_id: str
    tool_name: str
    parameters: dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolCallResult:
    success: bool
    result: Any = None
    error: str | None = None
    tokens_used: int = 0
    latency_ms: int = 0
    audit_entry: AuditEntry | None = None


class MCPAuthorizationProxy:
    """Sits between agents and MCP tool servers. Enforces policy + budget on every call."""

    def __init__(
        self,
        policy_checker: Callable[[str, str, str, int], PolicyDecision],
        budget_checker: Callable[[str, str, int], tuple[bool, int, str]],
        usage_reporter: Callable[..., int],
        audit_logger: Callable[[AuditEntry], None] | None = None,
        default_estimated_tokens: int = 1000,
        tool_timeout_seconds: int = 300,
    ) -> None:
        self._check_policy = policy_checker
        self._check_budget = budget_checker
        self._report_usage = usage_reporter
        self._log_audit = audit_logger or self._default_audit
        self._tool_registry: dict[str, Callable] = {}
        self._tool_schemas: dict[str, dict[str, Any]] = {}
        self._default_estimated_tokens = default_estimated_tokens
        self._tool_timeout = tool_timeout_seconds

    def register_tool(self, name: str, handler: Callable, schema: dict[str, Any] | None = None) -> None:
        """Register an MCP tool handler."""
        self._tool_registry[name] = handler
        if schema:
            self._tool_schemas[name] = schema
        log.info("tool_registered", tool_name=name)

    def execute(self, request: ToolCallRequest) -> ToolCallResult:
        """Execute a tool call with full policy + budget enforcement."""
        start = time.monotonic()

        # 1. Policy check
        estimated = self._default_estimated_tokens
        policy_decision = self._check_policy(
            request.org_id, request.agent_id, request.tool_name, estimated
        )
        if not policy_decision.allowed:
            audit = self._create_audit(request, "denied", policy_decision.reason, 0, 0)
            self._log_audit(audit)
            return ToolCallResult(
                success=False,
                error=f"policy denied: {policy_decision.reason}",
                audit_entry=audit,
            )

        # 2. Budget pre-flight
        budget_ok, remaining, budget_reason = self._check_budget(
            request.org_id, request.agent_id, estimated
        )
        if not budget_ok:
            audit = self._create_audit(request, "denied", budget_reason, 0, 0)
            self._log_audit(audit)
            return ToolCallResult(
                success=False,
                error=f"budget denied: {budget_reason}",
                audit_entry=audit,
            )

        # 3. Execute tool
        handler = self._tool_registry.get(request.tool_name)
        if handler is None:
            audit = self._create_audit(
                request, "failed", f"tool '{request.tool_name}' not found", 0, 0
            )
            self._log_audit(audit)
            return ToolCallResult(
                success=False,
                error=f"tool '{request.tool_name}' not registered",
                audit_entry=audit,
            )

        # Validate parameters against schema if available
        schema = self._tool_schemas.get(request.tool_name)
        if schema:
            allowed_params = set(schema.keys())
            unknown_params = set(request.parameters.keys()) - allowed_params
            if unknown_params:
                audit = self._create_audit(
                    request, "denied", f"unknown parameters: {unknown_params}", 0, 0
                )
                self._log_audit(audit)
                return ToolCallResult(
                    success=False,
                    error=f"unknown parameters: {unknown_params}",
                    audit_entry=audit,
                )

        try:
            result = handler(**request.parameters)
            latency = int((time.monotonic() - start) * 1000)

            # 4. Report usage
            self._report_usage(
                org_id=request.org_id,
                agent_id=request.agent_id,
                execution_id=request.execution_id,
                tokens_used=0,
                tool_invocations=1,
                execution_duration_ms=latency,
                tool_name=request.tool_name,
            )

            audit = self._create_audit(request, "executed", None, latency, 0)
            self._log_audit(audit)

            return ToolCallResult(
                success=True,
                result=result,
                latency_ms=latency,
                audit_entry=audit,
            )

        except Exception as e:
            latency = int((time.monotonic() - start) * 1000)
            audit = self._create_audit(request, "failed", str(e), latency, 0)
            self._log_audit(audit)
            return ToolCallResult(
                success=False,
                error=str(e),
                latency_ms=latency,
                audit_entry=audit,
            )

    def _create_audit(
        self,
        request: ToolCallRequest,
        result: str,
        reason: str | None,
        latency_ms: int,
        tokens_used: int,
    ) -> AuditEntry:
        return AuditEntry(
            org_id=request.org_id,
            agent_id=request.agent_id,
            delegated_user_id=request.delegated_user_id,
            execution_id=request.execution_id,
            action="tool_call",
            tool_name=request.tool_name,
            parameters=request.parameters,
            result=result,
            reason=reason,
            latency_ms=latency_ms,
            tokens_used=tokens_used,
        )

    def _default_audit(self, entry: AuditEntry) -> None:
        log.info(
            "audit_entry",
            entry_id=entry.entry_id,
            org_id=entry.org_id,
            agent_id=entry.agent_id,
            action=entry.action,
            tool_name=entry.tool_name,
            result=entry.result,
            reason=entry.reason,
            latency_ms=entry.latency_ms,
        )
