"""Tests for execution runtime — end-to-end governance pipeline."""

import pytest

from agent_platform.shared.models import ExecutionRequest, PolicyEffect, ToolPermission


class TestExecutionPipeline:
    def test_successful_execution(
        self, runtime, orgs, agents, policies, billing, org, agent
    ):
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
            token_limit=100_000,
        )
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)

        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="Find AI papers",
            )
        )
        assert response.success is True
        assert response.tokens_used > 0

    def test_agent_not_found(self, runtime, org):
        response = runtime.execute(
            ExecutionRequest(
                agent_id="nonexistent",
                org_id=org.org_id,
                task="test",
            )
        )
        assert response.success is False
        assert "not found" in response.error

    def test_no_policy_configured(self, runtime, org, agent):
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="test",
            )
        )
        assert response.success is False
        assert "no policy" in response.error

    def test_budget_exhausted(self, runtime, org, agent, policies, billing):
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
            token_limit=100_000,
        )
        billing.set_budget(org.org_id, agent.agent_id, token_limit=1)

        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="test",
            )
        )
        assert response.success is False
        assert "budget" in response.error

    def test_cross_org_isolation(self, runtime, orgs, agents, policies, billing):
        org_a = orgs.create("Org-A")
        org_b = orgs.create("Org-B")
        agent_a = agents.register(org_a.org_id, "bot-a")

        # Set policy and budget for org_a
        policies.set_policy(
            org_id=org_a.org_id,
            agent_id=agent_a.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
        )
        billing.set_budget(org_a.org_id, agent_a.agent_id, token_limit=100_000)

        # Try to execute agent_a under org_b — should fail
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent_a.agent_id,
                org_id=org_b.org_id,
                task="test",
            )
        )
        assert response.success is False
        assert "not found" in response.error

    def test_inactive_agent_rejected(
        self, runtime, orgs, agents, policies, billing, org, agent
    ):
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
        )
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        agents.deactivate(org.org_id, agent.agent_id)

        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="test",
            )
        )
        assert response.success is False
        assert "not found or inactive" in response.error

    def test_usage_tracked_after_execution(
        self, runtime, orgs, agents, policies, billing, org, agent
    ):
        from agent_platform.shared.models import UsageQuery

        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
            token_limit=100_000,
        )
        billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)

        runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id, org_id=org.org_id, task="test"
            )
        )

        usage = billing.get_usage(
            UsageQuery(org_id=org.org_id, agent_id=agent.agent_id)
        )
        assert usage.total_tokens > 0
        assert usage.report_count == 1
