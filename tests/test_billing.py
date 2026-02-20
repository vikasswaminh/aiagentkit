"""Tests for budget management and billing engine."""

import pytest
import threading

from agent_platform.control_plane.billing import BillingService
from agent_platform.shared.models import UsageQuery


class TestBudgetSetAndGet:
    def test_set_and_get_budget(self, billing, org, agent):
        budget = billing.set_budget(org.org_id, agent.agent_id, token_limit=50_000)
        assert budget.token_limit == 50_000
        assert budget.tokens_used == 0
        assert budget.tokens_remaining == 50_000

        retrieved = billing.get_budget(org.org_id, agent.agent_id)
        assert retrieved is not None
        assert retrieved.budget_id == budget.budget_id

    def test_set_org_budget(self, billing, org):
        budget = billing.set_budget(org.org_id, token_limit=1_000_000)
        assert budget.token_limit == 1_000_000
        assert budget.agent_id is None

    def test_update_preserves_usage(self, billing, org, agent):
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        billing.report_usage(org.org_id, agent.agent_id, "exec-1", tokens_used=5000)
        updated = billing.set_budget(org.org_id, agent.agent_id, token_limit=200_000)
        assert updated.tokens_used == 5000
        assert updated.tokens_remaining == 195_000


class TestBudgetCheck:
    def test_within_budget(self, billing, org, agent):
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        ok, remaining, reason = billing.check_budget(org.org_id, agent.agent_id, 5000)
        assert ok is True
        assert remaining == 100_000
        assert reason == "budget_ok"

    def test_exceeds_agent_budget(self, billing, org, agent):
        billing.set_budget(org.org_id, agent.agent_id, token_limit=1000)
        ok, remaining, reason = billing.check_budget(org.org_id, agent.agent_id, 5000)
        assert ok is False
        assert "agent budget exhausted" in reason

    def test_exceeds_org_budget(self, billing, org, agent):
        billing.set_budget(org.org_id, token_limit=1000)
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        ok, remaining, reason = billing.check_budget(org.org_id, agent.agent_id, 5000)
        assert ok is False
        assert "org budget exhausted" in reason

    def test_no_budget_set_returns_ok(self, billing):
        ok, remaining, reason = billing.check_budget("org-x", "agent-x", 5000)
        assert ok is True
        assert remaining == 0

    def test_no_overflow_error(self, billing):
        """Regression: float('inf') used to cause OverflowError on int()."""
        ok, remaining, reason = billing.check_budget("org-x", "agent-x", 100)
        assert isinstance(remaining, int)


class TestUsageReporting:
    def test_deducts_from_agent_budget(self, billing, org, agent):
        billing.set_budget(org.org_id, agent.agent_id, token_limit=10_000)
        remaining = billing.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=3000
        )
        assert remaining == 7000

    def test_deducts_from_org_budget(self, billing, org, agent):
        billing.set_budget(org.org_id, token_limit=100_000)
        billing.set_budget(org.org_id, agent.agent_id, token_limit=50_000)
        remaining = billing.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=5000
        )
        # Returns min(agent_remaining=45000, org_remaining=95000) = 45000
        assert remaining == 45_000

    def test_returns_min_of_agent_and_org(self, billing, org, agent):
        billing.set_budget(org.org_id, token_limit=10_000)
        billing.set_budget(org.org_id, agent.agent_id, token_limit=50_000)
        remaining = billing.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=5000
        )
        # org_remaining=5000 < agent_remaining=45000
        assert remaining == 5000

    def test_concurrent_deductions(self, billing, org, agent):
        """Thread safety: concurrent deductions should not lose tokens."""
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)

        def deduct():
            for _ in range(100):
                billing.report_usage(
                    org.org_id, agent.agent_id, "exec", tokens_used=1
                )

        threads = [threading.Thread(target=deduct) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        budget = billing.get_budget(org.org_id, agent.agent_id)
        assert budget.tokens_used == 1000
        assert budget.tokens_remaining == 99_000


class TestUsageQuery:
    def test_query_by_org_and_agent(self, billing, org, agent):
        billing.report_usage(org.org_id, agent.agent_id, "e1", tokens_used=100)
        billing.report_usage(org.org_id, agent.agent_id, "e2", tokens_used=200)

        usage = billing.get_usage(
            UsageQuery(org_id=org.org_id, agent_id=agent.agent_id)
        )
        assert usage.total_tokens == 300
        assert usage.report_count == 2

    def test_query_filters_by_org(self, billing, org, agent):
        billing.report_usage(org.org_id, agent.agent_id, "e1", tokens_used=100)
        billing.report_usage("other-org", "other-agent", "e2", tokens_used=999)

        usage = billing.get_usage(UsageQuery(org_id=org.org_id))
        assert usage.total_tokens == 100
