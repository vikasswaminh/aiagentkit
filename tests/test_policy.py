"""Tests for PolicyService — hierarchical merge, deny overrides, wildcards."""

from agent_platform.control_plane.policy import OPAAdapter, PolicyService
from agent_platform.shared.models import Policy, PolicyEffect, ToolPermission


class TestPolicyService:
    def test_set_and_get_policy(self, policy_service, org):
        policy = policy_service.set_policy(
            org_id=org.org_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
        )
        fetched = policy_service.get_policy(org.org_id)
        assert fetched is not None
        assert fetched.policy_id == policy.policy_id

    def test_explicit_allow(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "search")
        assert decision.allowed is True

    def test_explicit_deny(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="shell", effect=PolicyEffect.DENY)],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "shell")
        assert decision.allowed is False

    def test_default_deny(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "unknown")
        assert decision.allowed is False

    def test_wildcard_allow(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "anything")
        assert decision.allowed is True

    def test_deny_overrides_wildcard(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[
                ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW),
                ToolPermission(tool_name="shell", effect=PolicyEffect.DENY),
            ],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "shell")
        assert decision.allowed is False

    def test_hierarchical_merge_org_deny_wins(
        self, policy_service, org, agent
    ):
        # Org denies shell
        policy_service.set_policy(
            org_id=org.org_id,
            tools=[ToolPermission(tool_name="shell", effect=PolicyEffect.DENY)],
        )
        # Agent tries to allow shell
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="shell", effect=PolicyEffect.ALLOW)],
        )
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "shell")
        assert decision.allowed is False

    def test_hierarchical_merge_token_limit(
        self, policy_service, org, agent
    ):
        policy_service.set_policy(org_id=org.org_id, token_limit=200_000)
        policy_service.set_policy(
            org_id=org.org_id, agent_id=agent.agent_id, token_limit=50_000
        )
        policy = policy_service.get_effective_policy(org.org_id, agent.agent_id)
        assert policy is not None
        assert policy.token_limit == 50_000  # min(200k, 50k)

    def test_agent_cannot_exceed_org_limit(
        self, policy_service, org, agent
    ):
        policy_service.set_policy(org_id=org.org_id, token_limit=10_000)
        policy_service.set_policy(
            org_id=org.org_id, agent_id=agent.agent_id, token_limit=100_000
        )
        policy = policy_service.get_effective_policy(org.org_id, agent.agent_id)
        assert policy is not None
        assert policy.token_limit == 10_000  # min(10k, 100k)

    def test_token_limit_exceeded(self, policy_service, org, agent):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
            token_limit=1000,
        )
        decision = policy_service.evaluate(
            org.org_id, agent.agent_id, "search", estimated_tokens=5000
        )
        assert decision.allowed is False
        assert "exceeds limit" in decision.reason

    def test_no_policy_returns_deny(self, policy_service, org, agent):
        decision = policy_service.evaluate(org.org_id, agent.agent_id, "search")
        assert decision.allowed is False

    def test_update_preserves_id(self, policy_service, org):
        p1 = policy_service.set_policy(org_id=org.org_id, token_limit=100)
        p2 = policy_service.set_policy(org_id=org.org_id, token_limit=200)
        assert p1.policy_id == p2.policy_id


class TestOPAAdapter:
    def test_rego_generation_allowed_tools(self):
        adapter = OPAAdapter()
        policy = Policy(
            org_id="test-org",
            tools=[
                ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW),
                ToolPermission(tool_name="calc", effect=PolicyEffect.ALLOW),
            ],
            token_limit=10000,
        )
        rego = adapter.policy_to_rego(policy)
        assert '"search"' in rego
        assert '"calc"' in rego
        assert "allowed_tools" in rego
        # Verify it's JSON format, not Python repr
        assert '["search", "calc"]' in rego or '["calc", "search"]' in rego

    def test_rego_generation_denied_tools(self):
        adapter = OPAAdapter()
        policy = Policy(
            org_id="test-org",
            tools=[
                ToolPermission(tool_name="shell", effect=PolicyEffect.DENY),
            ],
        )
        rego = adapter.policy_to_rego(policy)
        assert '"shell"' in rego
        assert "denied_tools" in rego
        assert "deny if" in rego

    def test_rego_wildcard(self):
        adapter = OPAAdapter()
        policy = Policy(
            org_id="test-org",
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
        )
        rego = adapter.policy_to_rego(policy)
        assert "not deny" in rego
