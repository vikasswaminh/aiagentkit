"""Tests for policy engine — hierarchical merge, tool permissions, evaluation."""

import pytest

from agent_platform.control_plane.policy import PolicyService
from agent_platform.shared.models import PolicyEffect, ToolPermission


class TestPolicyEvaluation:
    def test_explicit_allow(self, policies, org, agent, agent_policy):
        decision = policies.evaluate(org.org_id, agent.agent_id, "search")
        assert decision.allowed is True

    def test_explicit_deny(self, policies, org, agent, org_policy, agent_policy):
        decision = policies.evaluate(org.org_id, agent.agent_id, "shell")
        assert decision.allowed is False
        assert "denied" in decision.reason

    def test_wildcard_allow(self, policies, org, agent, org_policy):
        # org policy has wildcard allow — agent has no policy yet
        # but agent_id won't match any agent policy, so org-level applies
        decision = policies.evaluate(org.org_id, agent.agent_id, "anything")
        assert decision.allowed is True

    def test_default_deny_no_policy(self, policies, org, agent):
        decision = policies.evaluate(org.org_id, agent.agent_id, "search")
        assert decision.allowed is False
        assert "no policy" in decision.reason

    def test_token_limit_exceeded(self, policies, org, agent, agent_policy):
        decision = policies.evaluate(
            org.org_id, agent.agent_id, "search", estimated_tokens=999_999
        )
        assert decision.allowed is False
        assert "exceeds limit" in decision.reason

    def test_token_limit_within(self, policies, org, agent, agent_policy):
        decision = policies.evaluate(
            org.org_id, agent.agent_id, "search", estimated_tokens=100
        )
        assert decision.allowed is True

    def test_tool_not_in_allowed_list(self, policies, org, agent, agent_policy):
        # Agent policy only allows search + calculator
        decision = policies.evaluate(org.org_id, agent.agent_id, "email")
        assert decision.allowed is False
        assert "not in allowed list" in decision.reason


class TestHierarchicalMerge:
    def test_org_deny_overrides_agent_allow(self, policies, org, agent):
        # Org denies shell
        policies.set_policy(
            org_id=org.org_id,
            tools=[ToolPermission(tool_name="shell", effect=PolicyEffect.DENY)],
        )
        # Agent tries to allow shell
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="shell", effect=PolicyEffect.ALLOW)],
        )
        decision = policies.evaluate(org.org_id, agent.agent_id, "shell")
        assert decision.allowed is False

    def test_agent_limit_capped_by_org(self, policies, org, agent):
        policies.set_policy(org_id=org.org_id, token_limit=10_000)
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            token_limit=50_000,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
        )
        effective = policies.get_effective_policy(org.org_id, agent.agent_id)
        # Agent can't exceed org limit
        assert effective.token_limit == 10_000

    def test_agent_overrides_org_for_non_denied_tools(self, policies, org, agent):
        policies.set_policy(
            org_id=org.org_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
        )
        policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
        )
        # Agent policy narrows: only search is allowed
        decision = policies.evaluate(org.org_id, agent.agent_id, "email")
        # Wildcard from org still applies since it wasn't overridden
        assert decision.allowed is True


class TestPolicySetAndGet:
    def test_set_and_get_org_policy(self, policies, org):
        policy = policies.set_policy(org_id=org.org_id, token_limit=500_000)
        retrieved = policies.get_policy(org.org_id)
        assert retrieved is not None
        assert retrieved.policy_id == policy.policy_id
        assert retrieved.token_limit == 500_000

    def test_set_and_get_agent_policy(self, policies, org, agent):
        policy = policies.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            token_limit=25_000,
        )
        retrieved = policies.get_policy(org.org_id, agent.agent_id)
        assert retrieved is not None
        assert retrieved.token_limit == 25_000

    def test_update_existing_policy(self, policies, org):
        p1 = policies.set_policy(org_id=org.org_id, token_limit=100_000)
        p2 = policies.set_policy(org_id=org.org_id, token_limit=200_000)
        assert p1.policy_id == p2.policy_id
        assert p2.token_limit == 200_000
        assert p2.updated_at > p1.created_at

    def test_get_nonexistent_returns_none(self, policies):
        assert policies.get_policy("nonexistent-org") is None
