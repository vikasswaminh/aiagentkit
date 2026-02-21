"""Remote service stubs — connect worker to control plane via gRPC.

These classes implement the same interface as the local services but forward
calls to the control plane gRPC server. This allows the execution worker to
be deployed as a separate process/container while sharing state with the
control plane.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

import grpc

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc
from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import (
    AgentIdentity,
    AgentRole,
    Budget,
    Organization,
    Policy,
    PolicyDecision,
    PolicyEffect,
    ToolPermission,
    UsageQuery,
    UsageSummary,
)

log = get_logger()


class RemoteAgentService:
    """Agent service that delegates to control plane via gRPC."""

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

    def get_by_id(self, agent_id: str) -> AgentIdentity | None:
        # Remote service doesn't support scan — return None
        return None


class RemotePolicyService:
    """Policy service that delegates to control plane via gRPC."""

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
    """Billing service that delegates to control plane via gRPC."""

    def __init__(self, stub: pb2_grpc.ControlPlaneStub) -> None:
        self._stub = stub

    def check_budget(
        self, org_id: str, agent_id: str, estimated_tokens: int
    ) -> tuple[bool, int, str]:
        resp = self._stub.CheckBudget(
            pb2.CheckBudgetRequest(
                org_id=org_id,
                agent_id=agent_id,
                estimated_tokens=estimated_tokens,
            )
        )
        return (resp.allowed, resp.tokens_remaining, resp.reason)

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
                pb2.GetBudgetRequest(org_id=org_id, agent_id=agent_id or "")
            )
            return Budget(
                budget_id=resp.budget_id,
                org_id=resp.org_id,
                agent_id=resp.agent_id or None,
                token_limit=resp.token_limit,
                tokens_used=resp.tokens_used,
                tool_invocations=resp.tool_invocations,
                reset_period_days=resp.reset_period_days,
            )
        except grpc.RpcError as e:
            if e.code() == grpc.StatusCode.NOT_FOUND:
                return None
            raise


def connect_to_control_plane(
    address: str = "localhost:50051",
    api_key: str | None = None,
) -> tuple[RemoteAgentService, RemotePolicyService, RemoteBillingService]:
    """Create remote service stubs connected to the control plane.

    Returns (agent_service, policy_service, billing_service) tuple.
    """
    channel = grpc.insecure_channel(
        address,
        options=[
            ("grpc.keepalive_time_ms", 30_000),
            ("grpc.keepalive_timeout_ms", 10_000),
        ],
    )
    stub = pb2_grpc.ControlPlaneStub(channel)

    log.info("connected_to_control_plane", address=address)
    return (
        RemoteAgentService(stub),
        RemotePolicyService(stub),
        RemoteBillingService(stub),
    )
