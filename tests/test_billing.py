"""Tests for BillingService — budgets, usage, deductions."""

import pytest

from agent_platform.control_plane.billing import BillingService
from agent_platform.shared.models import UsageQuery


class TestBillingService:
    def test_set_budget(self, billing_service, org, agent):
        budget = billing_service.set_budget(
            org.org_id, agent.agent_id, token_limit=100_000
        )
        assert budget.token_limit == 100_000
        assert budget.tokens_used == 0
        assert budget.tokens_remaining == 100_000

    def test_get_budget(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=50_000)
        budget = billing_service.get_budget(org.org_id, agent.agent_id)
        assert budget is not None
        assert budget.token_limit == 50_000

    def test_budget_check_allowed(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        allowed, remaining, reason = billing_service.check_budget(
            org.org_id, agent.agent_id, 5_000
        )
        assert allowed is True
        assert remaining == 100_000

    def test_budget_check_denied(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=1_000)
        allowed, remaining, reason = billing_service.check_budget(
            org.org_id, agent.agent_id, 5_000
        )
        assert allowed is False
        assert "exhausted" in reason

    def test_report_usage_deducts(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        remaining = billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=10_000
        )
        assert remaining == 90_000
        budget = billing_service.get_budget(org.org_id, agent.agent_id)
        assert budget.tokens_used == 10_000

    def test_report_usage_deducts_from_org(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, token_limit=500_000)
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=10_000
        )
        org_budget = billing_service.get_budget(org.org_id)
        assert org_budget.tokens_used == 10_000

    def test_org_budget_blocks_agent(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, token_limit=1_000)
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        allowed, remaining, reason = billing_service.check_budget(
            org.org_id, agent.agent_id, 5_000
        )
        assert allowed is False
        assert "org budget" in reason

    def test_negative_tokens_rejected(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        with pytest.raises(ValueError, match="must not be negative"):
            billing_service.report_usage(
                org.org_id, agent.agent_id, "exec-1", tokens_used=-100
            )

    def test_get_usage(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=5_000
        )
        billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-2", tokens_used=3_000
        )
        summary = billing_service.get_usage(
            UsageQuery(org_id=org.org_id, agent_id=agent.agent_id)
        )
        assert summary.total_tokens == 8_000
        assert summary.report_count == 2

    def test_budget_exhaustion(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=10_000)
        billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=10_000
        )
        budget = billing_service.get_budget(org.org_id, agent.agent_id)
        assert budget.is_exhausted is True
        assert budget.tokens_remaining == 0

    def test_update_budget_preserves_usage(self, billing_service, org, agent):
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        billing_service.report_usage(
            org.org_id, agent.agent_id, "exec-1", tokens_used=5_000
        )
        updated = billing_service.set_budget(
            org.org_id, agent.agent_id, token_limit=200_000
        )
        assert updated.tokens_used == 5_000
        assert updated.token_limit == 200_000

    def test_no_budget_allows(self, billing_service, org, agent):
        allowed, remaining, reason = billing_service.check_budget(
            org.org_id, agent.agent_id, 5_000
        )
        assert allowed is True
