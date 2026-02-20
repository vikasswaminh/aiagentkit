"""Budget and billing engine — per-agent and per-org token governance."""

from __future__ import annotations

import threading
from datetime import datetime, timezone

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import Budget, UsageQuery, UsageReport, UsageSummary
from agent_platform.shared.store import InMemoryStore, Store

log = get_logger()


def _budget_key(org_id: str, agent_id: str | None = None) -> str:
    if agent_id:
        return f"{org_id}:agent:{agent_id}"
    return f"{org_id}:org"


class BillingService:
    """Budget management, pre-flight checks, post-flight deductions, usage tracking."""

    def __init__(
        self,
        budget_store: Store[Budget] | None = None,
        usage_store: Store[UsageReport] | None = None,
    ) -> None:
        self._budgets: Store[Budget] = budget_store or InMemoryStore()
        self._usage: Store[UsageReport] = usage_store or InMemoryStore()
        self._lock = threading.RLock()

    # --- Budget CRUD ---

    def set_budget(
        self,
        org_id: str,
        agent_id: str | None = None,
        token_limit: int = 1_000_000,
        reset_period_days: int = 30,
    ) -> Budget:
        key = _budget_key(org_id, agent_id)
        with self._lock:
            existing = self._budgets.get(key)
            budget = Budget(
                budget_id=existing.budget_id if existing else Budget().budget_id,
                org_id=org_id,
                agent_id=agent_id,
                token_limit=token_limit,
                tokens_used=existing.tokens_used if existing else 0,
                tool_invocations=existing.tool_invocations if existing else 0,
                reset_period_days=reset_period_days,
            )
            self._budgets.put(key, budget)

        log.info(
            "budget_set",
            org_id=org_id,
            agent_id=agent_id,
            token_limit=token_limit,
        )
        return budget

    def get_budget(self, org_id: str, agent_id: str | None = None) -> Budget | None:
        return self._budgets.get(_budget_key(org_id, agent_id))

    # --- Pre-flight Check ---

    def check_budget(
        self,
        org_id: str,
        agent_id: str,
        estimated_tokens: int,
    ) -> tuple[bool, int, str]:
        """Check if agent has budget for estimated tokens.

        Returns (allowed, tokens_remaining, reason).
        """
        with self._lock:
            # Check agent budget
            agent_budget = self._budgets.get(_budget_key(org_id, agent_id))
            if agent_budget:
                if agent_budget.tokens_remaining < estimated_tokens:
                    return (
                        False,
                        agent_budget.tokens_remaining,
                        f"agent budget exhausted: {agent_budget.tokens_remaining} remaining, {estimated_tokens} requested",
                    )

            # Check org budget
            org_budget = self._budgets.get(_budget_key(org_id))
            if org_budget:
                if org_budget.tokens_remaining < estimated_tokens:
                    return (
                        False,
                        org_budget.tokens_remaining,
                        f"org budget exhausted: {org_budget.tokens_remaining} remaining, {estimated_tokens} requested",
                    )

            remaining = min(
                agent_budget.tokens_remaining if agent_budget else float("inf"),
                org_budget.tokens_remaining if org_budget else float("inf"),
            )
            return (True, int(remaining), "budget_ok")

    # --- Post-flight Deduction ---

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
        """Record usage and deduct from budgets. Returns tokens remaining."""
        report = UsageReport(
            org_id=org_id,
            agent_id=agent_id,
            execution_id=execution_id,
            tokens_used=tokens_used,
            tool_invocations=tool_invocations,
            execution_duration_ms=execution_duration_ms,
            tool_name=tool_name,
        )
        self._usage.put(report.report_id, report)

        with self._lock:
            # Deduct from agent budget
            agent_budget = self._budgets.get(_budget_key(org_id, agent_id))
            if agent_budget:
                agent_budget.tokens_used += tokens_used
                agent_budget.tool_invocations += tool_invocations
                self._budgets.put(_budget_key(org_id, agent_id), agent_budget)

            # Deduct from org budget
            org_budget = self._budgets.get(_budget_key(org_id))
            if org_budget:
                org_budget.tokens_used += tokens_used
                org_budget.tool_invocations += tool_invocations
                self._budgets.put(_budget_key(org_id), org_budget)

            remaining = agent_budget.tokens_remaining if agent_budget else 0

        log.info(
            "usage_reported",
            org_id=org_id,
            agent_id=agent_id,
            execution_id=execution_id,
            tokens_used=tokens_used,
            tokens_remaining=remaining,
        )
        return remaining

    # --- Usage Query ---

    def get_usage(self, query: UsageQuery) -> UsageSummary:
        """Aggregate usage by org/agent/time range."""
        reports = self._usage.list()
        filtered = []

        for r in reports:
            if query.org_id and r.org_id != query.org_id:
                continue
            if query.agent_id and r.agent_id != query.agent_id:
                continue
            if query.start_time and r.timestamp < query.start_time:
                continue
            if query.end_time and r.timestamp > query.end_time:
                continue
            filtered.append(r)

        return UsageSummary(
            org_id=query.org_id or "",
            agent_id=query.agent_id,
            total_tokens=sum(r.tokens_used for r in filtered),
            total_tool_invocations=sum(r.tool_invocations for r in filtered),
            total_execution_duration_ms=sum(r.execution_duration_ms for r in filtered),
            report_count=len(filtered),
        )
