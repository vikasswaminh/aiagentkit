"""Budget and usage management client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from agent_platform.proto import agent_platform_pb2 as pb2


@dataclass
class BudgetInfo:
    budget_id: str
    token_limit: int
    tokens_used: int
    tokens_remaining: int
    tool_invocations: int


@dataclass
class BudgetCheck:
    allowed: bool
    tokens_remaining: int
    reason: str


@dataclass
class UsageSummary:
    total_tokens: int
    total_tool_invocations: int
    total_duration_ms: int
    report_count: int


class BudgetClient:
    """Client for budget and usage operations."""

    def __init__(self, stub: Any) -> None:
        self._stub = stub

    def set(
        self,
        org_id: str,
        agent_id: str | None = None,
        token_limit: int = 1_000_000,
        reset_period_days: int = 30,
    ) -> BudgetInfo:
        resp = self._stub.SetBudget(
            pb2.SetBudgetRequest(
                org_id=org_id,
                agent_id=agent_id or "",
                token_limit=token_limit,
                reset_period_days=reset_period_days,
            )
        )
        return BudgetInfo(
            budget_id=resp.budget_id,
            token_limit=resp.token_limit,
            tokens_used=resp.tokens_used,
            tokens_remaining=resp.tokens_remaining,
            tool_invocations=resp.tool_invocations,
        )

    def get(self, org_id: str, agent_id: str | None = None) -> BudgetInfo:
        resp = self._stub.GetBudget(
            pb2.GetBudgetRequest(org_id=org_id, agent_id=agent_id or "")
        )
        return BudgetInfo(
            budget_id=resp.budget_id,
            token_limit=resp.token_limit,
            tokens_used=resp.tokens_used,
            tokens_remaining=resp.tokens_remaining,
            tool_invocations=resp.tool_invocations,
        )

    def check(
        self, org_id: str, agent_id: str, estimated_tokens: int
    ) -> BudgetCheck:
        resp = self._stub.CheckBudget(
            pb2.CheckBudgetRequest(
                org_id=org_id,
                agent_id=agent_id,
                estimated_tokens=estimated_tokens,
            )
        )
        return BudgetCheck(
            allowed=resp.allowed,
            tokens_remaining=resp.tokens_remaining,
            reason=resp.reason,
        )

    def report_usage(
        self,
        org_id: str,
        agent_id: str,
        execution_id: str,
        tokens_used: int,
        tool_invocations: int = 0,
        duration_ms: int = 0,
    ) -> int:
        """Report usage. Returns tokens remaining."""
        resp = self._stub.ReportUsage(
            pb2.ReportUsageRequest(
                org_id=org_id,
                agent_id=agent_id,
                execution_id=execution_id,
                tokens_used=tokens_used,
                tool_invocations=tool_invocations,
                execution_duration_ms=duration_ms,
            )
        )
        return resp.tokens_remaining

    def get_usage(self, org_id: str, agent_id: str | None = None) -> UsageSummary:
        resp = self._stub.GetUsage(
            pb2.GetUsageRequest(org_id=org_id, agent_id=agent_id or "")
        )
        return UsageSummary(
            total_tokens=resp.total_tokens,
            total_tool_invocations=resp.total_tool_invocations,
            total_duration_ms=resp.total_execution_duration_ms,
            report_count=resp.report_count,
        )
