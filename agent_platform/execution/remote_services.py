"""Remote service adapters — worker connects to control plane via gRPC.

These adapters implement the same interface as local services but delegate
all operations to the control plane over gRPC. This ensures workers are
truly stateless and share state with the control plane.
"""

from __future__ import annotations

from typing import Any

import grpc

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc
from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import (
    AgentIdentity,
    AgentRole,
    Budget,
    Policy,
    PolicyDecision,
    PolicyEffect,
    ToolPermission,
    UsageQuery,
    UsageSummary,
)

log = get_logger()


class RemoteAgentService:
    """Agent service backed by gRPC control plane."""

    def __init__(self, stub: pb2_grpc.ControlPlaneStub) -> None:
        self._stub = stub

    def get(self, org_id: str, agent_id: str) -> AgentIdentity | None:
        try:
            resp = self._stub.GetAgent(
                pb2.GetAgentRequest(org_id=org_id, agent_id=agent_id)
            )
            return AgentIdentity(
                agent_id=resp.agent_id,
                org_id=resp.org_id,
                name=resp.name,
                role=AgentRole(resp.role) if resp.role else AgentRole.EXECUTOR,
                delegated_user_id=resp.delegated_user_id or None,
                active=resp.active,
            )
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.NOT_FOUND:
                return None
            raise


class RemotePolicyService:
    """Policy service backed by gRPC control plane."""

    def __init__(self, stub: pb2_grpc.ControlPlaneStub) -> None:
        self._stub = stub

    def get_effective_policy(self, org_id: str, agent_id: str) -> Policy | None:
        try:
            resp = self._stub.GetPolicy(
                pb2.GetPolicyRequest(org_id=org_id, agent_id=agent_id)
            )
            tools = [
                ToolPermission(
                    tool_name=t.tool_name,
                    effect=PolicyEffect(t.effect) if t.effect else PolicyEffect.ALLOW,
                )
                for t in resp.tools
            ]
            return Policy(
                policy_id=resp.policy_id,
                org_id=resp.org_id,
                agent_id=resp.agent_id or None,
                tools=tools,
                token_limit=resp.token_limit,
                execution_timeout_seconds=resp.execution_timeout_seconds,
            )
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.NOT_FOUND:
                return None
            raise

    def evaluate(
        self,
        org_id: str,
        agent_id: str,
        tool_name: str,
        estimated_tokens: int = 0,
        context: dict[str, Any] | None = None,
    ) -> PolicyDecision:
        resp = self._stub.EvaluatePolicy(
            pb2.EvaluatePolicyRequest(
                org_id=org_id,
                agent_id=agent_id,
                tool_name=tool_name,
                estimated_tokens=estimated_tokens,
            )
        )
        return PolicyDecision(
            allowed=resp.allowed,
            reason=resp.reason,
            matched_policy_id=resp.matched_policy_id or None,
        )


class RemoteBillingService:
    """Billing service backed by gRPC control plane."""

    def __init__(self, stub: pb2_grpc.ControlPlaneStub) -> None:
        self._stub = stub

    def check_budget(
        self, org_id: str, agent_id: str, estimated_tokens: int = 0
    ) -> tuple[bool, int, str]:
        resp = self._stub.CheckBudget(
            pb2.CheckBudgetRequest(
                org_id=org_id,
                agent_id=agent_id,
                estimated_tokens=estimated_tokens,
            )
        )
        return resp.allowed, resp.tokens_remaining, resp.reason

    def report_usage(
        self,
        org_id: str,
        agent_id: str,
        execution_id: str,
        tokens_used: int,
        tool_invocations: int = 0,
        execution_duration_ms: int = 0,
        tool_name: str | None = None,
    ) -> int:
        resp = self._stub.ReportUsage(
            pb2.ReportUsageRequest(
                org_id=org_id,
                agent_id=agent_id,
                execution_id=execution_id,
                tokens_used=tokens_used,
                tool_invocations=tool_invocations,
                execution_duration_ms=execution_duration_ms,
                tool_name=tool_name or "",
            )
        )
        return resp.tokens_remaining

    def get_budget(self, org_id: str, agent_id: str | None = None) -> Budget | None:
        try:
            resp = self._stub.GetBudget(
                pb2.GetBudgetRequest(
                    org_id=org_id, agent_id=agent_id or ""
                )
            )
            return Budget(
                budget_id=resp.budget_id,
                org_id=resp.org_id,
                agent_id=resp.agent_id or None,
                token_limit=resp.token_limit,
                tokens_used=resp.tokens_used,
            )
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.NOT_FOUND:
                return None
            raise

    def get_usage(self, query: UsageQuery) -> UsageSummary:
        resp = self._stub.GetUsage(
            pb2.GetUsageRequest(
                org_id=query.org_id or "",
                agent_id=query.agent_id or "",
            )
        )
        return UsageSummary(
            org_id=resp.org_id,
            agent_id=resp.agent_id or None,
            total_tokens=resp.total_tokens,
            total_tool_invocations=resp.total_tool_invocations,
            total_execution_duration_ms=resp.total_execution_duration_ms,
            report_count=resp.report_count,
        )
