"""Execution orchestrator — validate → policy → budget → LLM → tool → report."""

from __future__ import annotations

import time
from typing import Any

from agent_platform.execution.llm import BaseLLM, LLMRequest
from agent_platform.execution.memory import BaseMemory, InMemoryStorage
from agent_platform.execution.tools import ToolRegistry
from agent_platform.gateway.audit import AuditLog
from agent_platform.gateway.mcp_proxy import MCPAuthorizationProxy, ToolCallRequest
from agent_platform.shared.logging import bind_context, clear_context, get_logger
from agent_platform.shared.models import (
    AuditEntry,
    ExecutionRequest,
    ExecutionResponse,
    _new_id,
)

log = get_logger()


class ExecutionRuntime:
    """Stateless execution orchestrator.

    Flow: validate agent → check policy → check budget → call LLM →
          if tool_call, validate permission → execute tool → return result →
          report usage.
    """

    def __init__(
        self,
        agent_service: Any,
        policy_service: Any,
        billing_service: Any,
        llm: BaseLLM,
        tool_registry: ToolRegistry,
        memory: BaseMemory | None = None,
        audit_log: AuditLog | None = None,
    ) -> None:
        self._agents = agent_service
        self._policies = policy_service
        self._billing = billing_service
        self._llm = llm
        self._tools = tool_registry
        self._memory = memory or InMemoryStorage()
        self._audit = audit_log or AuditLog()

        # Wire up MCP proxy with control plane services
        self._proxy = MCPAuthorizationProxy(
            policy_checker=self._policies.evaluate,
            budget_checker=self._billing.check_budget,
            usage_reporter=self._billing.report_usage,
            audit_logger=self._audit.append,
        )
        # Register all tools from registry into proxy
        for schema in self._tools.list():
            tool = self._tools.get(schema.name)
            if tool:
                self._proxy.register_tool(schema.name, tool.execute)

    def execute(self, request: ExecutionRequest) -> ExecutionResponse:
        """Execute a task through the full governance pipeline."""
        start = time.monotonic()
        execution_id = request.execution_id or _new_id()
        bind_context(
            org_id=request.org_id,
            agent_id=request.agent_id,
            execution_id=execution_id,
        )

        try:
            return self._execute_inner(request, execution_id, start)
        except Exception as e:
            duration = int((time.monotonic() - start) * 1000)
            log.error("execution_failed", error=str(e))
            return ExecutionResponse(
                execution_id=execution_id,
                agent_id=request.agent_id,
                org_id=request.org_id,
                success=False,
                error=str(e),
                duration_ms=duration,
            )
        finally:
            clear_context()

    def _execute_inner(
        self,
        request: ExecutionRequest,
        execution_id: str,
        start: float,
    ) -> ExecutionResponse:
        # 1. Validate agent
        agent = self._agents.get(request.org_id, request.agent_id)
        if agent is None:
            agent = self._agents.get_by_id(request.agent_id)
        if agent is None or not agent.active:
            return ExecutionResponse(
                execution_id=execution_id,
                agent_id=request.agent_id,
                org_id=request.org_id,
                success=False,
                error="agent not found or inactive",
            )

        # 2. Check policy exists
        policy = self._policies.get_effective_policy(request.org_id, request.agent_id)
        if policy is None:
            return ExecutionResponse(
                execution_id=execution_id,
                agent_id=request.agent_id,
                org_id=request.org_id,
                success=False,
                error="no policy configured",
            )

        # 3. Budget pre-flight
        budget_ok, remaining, reason = self._billing.check_budget(
            request.org_id, request.agent_id, policy.token_limit
        )
        if not budget_ok:
            return ExecutionResponse(
                execution_id=execution_id,
                agent_id=request.agent_id,
                org_id=request.org_id,
                success=False,
                error=f"budget check failed: {reason}",
            )

        # 4. Call LLM
        llm_request = LLMRequest(
            prompt=request.task,
            context=request.context,
        )
        llm_response = self._llm.complete(llm_request)
        total_tokens = llm_response.tokens_used
        tool_call_results: list[dict[str, Any]] = []

        # 5. Handle tool calls
        for tc in llm_response.tool_calls:
            tool_req = ToolCallRequest(
                agent_id=request.agent_id,
                org_id=request.org_id,
                delegated_user_id=agent.delegated_user_id,
                execution_id=execution_id,
                tool_name=tc.tool_name,
                parameters=tc.parameters,
            )
            tool_result = self._proxy.execute(tool_req)
            tool_call_results.append({
                "tool_name": tc.tool_name,
                "parameters": tc.parameters,
                "result": str(tool_result.result) if tool_result.success else None,
                "error": tool_result.error,
                "success": tool_result.success,
                "latency_ms": tool_result.latency_ms,
            })

        duration = int((time.monotonic() - start) * 1000)

        # 6. Report usage
        self._billing.report_usage(
            org_id=request.org_id,
            agent_id=request.agent_id,
            execution_id=execution_id,
            tokens_used=total_tokens,
            tool_invocations=len(tool_call_results),
            execution_duration_ms=duration,
        )

        # 7. Log execution audit
        self._audit.append(AuditEntry(
            org_id=request.org_id,
            agent_id=request.agent_id,
            delegated_user_id=agent.delegated_user_id,
            execution_id=execution_id,
            action="execution_complete",
            result="success",
            latency_ms=duration,
            tokens_used=total_tokens,
        ))

        log.info(
            "execution_complete",
            tokens_used=total_tokens,
            tool_calls=len(tool_call_results),
            duration_ms=duration,
        )

        return ExecutionResponse(
            execution_id=execution_id,
            agent_id=request.agent_id,
            org_id=request.org_id,
            result=llm_response.content,
            tokens_used=total_tokens,
            tool_calls=tool_call_results,
            duration_ms=duration,
            success=True,
        )
