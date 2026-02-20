"""gRPC control plane server — wires org, agent, policy, billing services."""

from __future__ import annotations

import os
from concurrent import futures
from datetime import datetime
from typing import Any

import grpc
from google.protobuf import struct_pb2, timestamp_pb2

from agent_platform.control_plane.agents import AgentService
from agent_platform.control_plane.billing import BillingService
from agent_platform.control_plane.orgs import OrgService
from agent_platform.control_plane.policy import PolicyService
from agent_platform.gateway.audit import AuditLog
from agent_platform.shared.logging import configure_logging, get_logger
from agent_platform.shared.models import (
    AgentRole,
    PolicyEffect,
    ToolPermission,
    UsageQuery,
)

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc

log = get_logger()


def _dt_to_timestamp(dt: datetime) -> timestamp_pb2.Timestamp:
    ts = timestamp_pb2.Timestamp()
    ts.FromDatetime(dt)
    return ts


def _dict_to_struct(d: dict[str, Any]) -> struct_pb2.Struct:
    s = struct_pb2.Struct()
    s.update(d)
    return s


class APIKeyInterceptor(grpc.ServerInterceptor):
    """Validates AP_API_KEY on every request when configured."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key

    def intercept_service(self, continuation, handler_call_details):
        metadata = dict(handler_call_details.invocation_metadata or [])
        provided = metadata.get("x-api-key", "")
        if provided != self._api_key:
            def _abort(request, context):
                context.abort(grpc.StatusCode.UNAUTHENTICATED, "invalid API key")
                return None
            return grpc.unary_unary_rpc_method_handler(_abort)
        return continuation(handler_call_details)


class ControlPlaneServicer(pb2_grpc.ControlPlaneServicer):
    """gRPC servicer implementing all control plane RPCs."""

    def __init__(
        self,
        org_service: OrgService,
        agent_service: AgentService,
        policy_service: PolicyService,
        billing_service: BillingService,
        audit_log: AuditLog | None = None,
    ) -> None:
        self._orgs = org_service
        self._agents = agent_service
        self._policies = policy_service
        self._billing = billing_service
        self._audit = audit_log or AuditLog()

    # --- Organization ---

    def CreateOrganization(self, request, context):
        metadata = dict(request.metadata) if request.metadata else {}
        org = self._orgs.create(name=request.name, metadata=metadata)
        return pb2.OrganizationProto(
            org_id=org.org_id,
            name=org.name,
            created_at=_dt_to_timestamp(org.created_at),
            metadata=_dict_to_struct(org.metadata),
        )

    def GetOrganization(self, request, context):
        org = self._orgs.get(request.org_id)
        if org is None:
            context.abort(grpc.StatusCode.NOT_FOUND, f"org {request.org_id} not found")
            return pb2.OrganizationProto()
        return pb2.OrganizationProto(
            org_id=org.org_id,
            name=org.name,
            created_at=_dt_to_timestamp(org.created_at),
            metadata=_dict_to_struct(org.metadata),
        )

    def ListOrganizations(self, request, context):
        orgs = self._orgs.list()
        return pb2.ListOrgsResponse(
            organizations=[
                pb2.OrganizationProto(
                    org_id=o.org_id,
                    name=o.name,
                    created_at=_dt_to_timestamp(o.created_at),
                    metadata=_dict_to_struct(o.metadata),
                )
                for o in orgs
            ]
        )

    def DeleteOrganization(self, request, context):
        success = self._orgs.delete(request.org_id)
        return pb2.DeleteOrgResponse(success=success)

    # --- Agent ---

    def RegisterAgent(self, request, context):
        if not self._orgs.exists(request.org_id):
            context.abort(
                grpc.StatusCode.NOT_FOUND, f"org {request.org_id} not found"
            )
            return pb2.AgentIdentityProto()
        claims = dict(request.token_claims) if request.token_claims else {}
        agent = self._agents.register(
            org_id=request.org_id,
            name=request.name,
            role=request.role or "executor",
            delegated_user_id=request.delegated_user_id or None,
            token_claims=claims,
        )
        return pb2.AgentIdentityProto(
            agent_id=agent.agent_id,
            org_id=agent.org_id,
            name=agent.name,
            role=agent.role.value,
            delegated_user_id=agent.delegated_user_id or "",
            token_claims=_dict_to_struct(agent.token_claims),
            created_at=_dt_to_timestamp(agent.created_at),
            active=agent.active,
        )

    def GetAgent(self, request, context):
        agent = self._agents.get(request.org_id, request.agent_id)
        if agent is None:
            context.abort(
                grpc.StatusCode.NOT_FOUND,
                f"agent {request.agent_id} not found in org {request.org_id}",
            )
            return pb2.AgentIdentityProto()
        return pb2.AgentIdentityProto(
            agent_id=agent.agent_id,
            org_id=agent.org_id,
            name=agent.name,
            role=agent.role.value,
            delegated_user_id=agent.delegated_user_id or "",
            token_claims=_dict_to_struct(agent.token_claims),
            created_at=_dt_to_timestamp(agent.created_at),
            active=agent.active,
        )

    def ListAgents(self, request, context):
        agents = self._agents.list(request.org_id)
        return pb2.ListAgentsResponse(
            agents=[
                pb2.AgentIdentityProto(
                    agent_id=a.agent_id,
                    org_id=a.org_id,
                    name=a.name,
                    role=a.role.value,
                    delegated_user_id=a.delegated_user_id or "",
                    created_at=_dt_to_timestamp(a.created_at),
                    active=a.active,
                )
                for a in agents
            ]
        )

    def DeactivateAgent(self, request, context):
        success = self._agents.deactivate(request.org_id, request.agent_id)
        return pb2.DeactivateAgentResponse(success=success)

    # --- Policy ---

    def SetPolicy(self, request, context):
        tools = [
            ToolPermission(
                tool_name=t.tool_name,
                effect=PolicyEffect(t.effect) if t.effect else PolicyEffect.ALLOW,
            )
            for t in request.tools
        ]
        policy = self._policies.set_policy(
            org_id=request.org_id,
            agent_id=request.agent_id or None,
            tools=tools,
            token_limit=request.token_limit or 100_000,
            execution_timeout_seconds=request.execution_timeout_seconds or 300,
        )
        return pb2.PolicyProto(
            policy_id=policy.policy_id,
            org_id=policy.org_id,
            agent_id=policy.agent_id or "",
            tools=[
                pb2.ToolPermissionProto(
                    tool_name=t.tool_name, effect=t.effect.value
                )
                for t in policy.tools
            ],
            token_limit=policy.token_limit,
            execution_timeout_seconds=policy.execution_timeout_seconds,
            created_at=_dt_to_timestamp(policy.created_at),
            updated_at=_dt_to_timestamp(policy.updated_at),
        )

    def GetPolicy(self, request, context):
        policy = self._policies.get_effective_policy(
            request.org_id, request.agent_id
        ) if request.agent_id else self._policies.get_policy(request.org_id)
        if policy is None:
            context.abort(grpc.StatusCode.NOT_FOUND, "policy not found")
            return pb2.PolicyProto()
        return pb2.PolicyProto(
            policy_id=policy.policy_id,
            org_id=policy.org_id,
            agent_id=policy.agent_id or "",
            tools=[
                pb2.ToolPermissionProto(
                    tool_name=t.tool_name, effect=t.effect.value
                )
                for t in policy.tools
            ],
            token_limit=policy.token_limit,
            execution_timeout_seconds=policy.execution_timeout_seconds,
        )

    def EvaluatePolicy(self, request, context):
        decision = self._policies.evaluate(
            org_id=request.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            estimated_tokens=request.estimated_tokens,
        )
        return pb2.PolicyDecisionProto(
            allowed=decision.allowed,
            reason=decision.reason,
            matched_policy_id=decision.matched_policy_id or "",
            evaluated_at=_dt_to_timestamp(decision.evaluated_at),
        )

    # --- Budget ---

    def SetBudget(self, request, context):
        budget = self._billing.set_budget(
            org_id=request.org_id,
            agent_id=request.agent_id or None,
            token_limit=request.token_limit or 1_000_000,
            reset_period_days=request.reset_period_days or 30,
        )
        return pb2.BudgetProto(
            budget_id=budget.budget_id,
            org_id=budget.org_id,
            agent_id=budget.agent_id or "",
            token_limit=budget.token_limit,
            tokens_used=budget.tokens_used,
            tokens_remaining=budget.tokens_remaining,
            tool_invocations=budget.tool_invocations,
            reset_period_days=budget.reset_period_days,
            created_at=_dt_to_timestamp(budget.created_at),
            last_reset_at=_dt_to_timestamp(budget.last_reset_at),
        )

    def GetBudget(self, request, context):
        budget = self._billing.get_budget(
            request.org_id, request.agent_id or None
        )
        if budget is None:
            context.abort(grpc.StatusCode.NOT_FOUND, "budget not found")
            return pb2.BudgetProto()
        return pb2.BudgetProto(
            budget_id=budget.budget_id,
            org_id=budget.org_id,
            agent_id=budget.agent_id or "",
            token_limit=budget.token_limit,
            tokens_used=budget.tokens_used,
            tokens_remaining=budget.tokens_remaining,
            tool_invocations=budget.tool_invocations,
            reset_period_days=budget.reset_period_days,
        )

    def CheckBudget(self, request, context):
        allowed, remaining, reason = self._billing.check_budget(
            org_id=request.org_id,
            agent_id=request.agent_id,
            estimated_tokens=request.estimated_tokens,
        )
        return pb2.CheckBudgetResponse(
            allowed=allowed,
            tokens_remaining=remaining,
            reason=reason,
        )

    # --- Usage ---

    def ReportUsage(self, request, context):
        remaining = self._billing.report_usage(
            org_id=request.org_id,
            agent_id=request.agent_id,
            execution_id=request.execution_id,
            tokens_used=request.tokens_used,
            tool_invocations=request.tool_invocations,
            execution_duration_ms=request.execution_duration_ms,
            tool_name=request.tool_name or None,
        )
        return pb2.ReportUsageResponse(success=True, tokens_remaining=remaining)

    def GetUsage(self, request, context):
        query = UsageQuery(
            org_id=request.org_id or None,
            agent_id=request.agent_id or None,
        )
        summary = self._billing.get_usage(query)
        return pb2.UsageSummaryProto(
            org_id=summary.org_id,
            agent_id=summary.agent_id or "",
            total_tokens=summary.total_tokens,
            total_tool_invocations=summary.total_tool_invocations,
            total_execution_duration_ms=summary.total_execution_duration_ms,
            report_count=summary.report_count,
        )

    # --- Audit ---

    def GetAuditLog(self, request, context):
        entries = self._audit.query(
            org_id=request.org_id or None,
            agent_id=request.agent_id or None,
            limit=request.limit or 100,
        )
        return pb2.GetAuditLogResponse(
            entries=[
                pb2.AuditEntryProto(
                    entry_id=e.entry_id,
                    org_id=e.org_id,
                    agent_id=e.agent_id,
                    delegated_user_id=e.delegated_user_id or "",
                    execution_id=e.execution_id,
                    action=e.action,
                    tool_name=e.tool_name or "",
                    result=e.result,
                    reason=e.reason or "",
                    latency_ms=e.latency_ms,
                    tokens_used=e.tokens_used,
                    timestamp=_dt_to_timestamp(e.timestamp),
                )
                for e in entries
            ]
        )


def create_control_plane_server(
    port: int = 50051,
    max_workers: int = 10,
) -> grpc.Server:
    """Create and configure the control plane gRPC server."""
    org_service = OrgService()
    agent_service = AgentService()
    policy_service = PolicyService()
    billing_service = BillingService()
    audit_log = AuditLog()

    servicer = ControlPlaneServicer(
        org_service=org_service,
        agent_service=agent_service,
        policy_service=policy_service,
        billing_service=billing_service,
        audit_log=audit_log,
    )

    interceptors: list[grpc.ServerInterceptor] = []
    api_key = os.environ.get("AP_API_KEY", "")
    if api_key:
        interceptors.append(APIKeyInterceptor(api_key))
        log.info("api_key_auth_enabled")

    server = grpc.server(
        futures.ThreadPoolExecutor(max_workers=max_workers),
        interceptors=interceptors,
    )
    pb2_grpc.add_ControlPlaneServicer_to_server(servicer, server)
    server.add_insecure_port(f"[::]:{port}")

    log.info("control_plane_server_created", port=port, max_workers=max_workers)
    return server


def serve(port: int = 50051) -> None:
    """Start the control plane gRPC server."""
    configure_logging()
    server = create_control_plane_server(port=port)
    server.start()
    log.info("control_plane_server_started", port=port)
    server.wait_for_termination()
