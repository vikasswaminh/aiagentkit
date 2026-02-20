"""Tests for AgentService."""

from agent_platform.control_plane.agents import AgentService
from agent_platform.shared.models import AgentRole


class TestAgentService:
    def test_register_agent(self, agent_service, org):
        agent = agent_service.register(org.org_id, "bot-1", role="executor")
        assert agent.name == "bot-1"
        assert agent.role == AgentRole.EXECUTOR
        assert agent.active is True

    def test_register_with_delegation(self, agent_service, org):
        agent = agent_service.register(
            org.org_id, "bot-2", delegated_user_id="user-bob"
        )
        assert agent.delegated_user_id == "user-bob"

    def test_get_agent(self, agent_service, org):
        agent = agent_service.register(org.org_id, "bot-3")
        fetched = agent_service.get(org.org_id, agent.agent_id)
        assert fetched is not None
        assert fetched.agent_id == agent.agent_id

    def test_get_nonexistent(self, agent_service, org):
        assert agent_service.get(org.org_id, "nope") is None

    def test_get_by_id(self, agent_service, org):
        agent = agent_service.register(org.org_id, "findme")
        found = agent_service.get_by_id(agent.agent_id)
        assert found is not None
        assert found.name == "findme"

    def test_list_agents(self, agent_service, org):
        agent_service.register(org.org_id, "a")
        agent_service.register(org.org_id, "b")
        agents = agent_service.list(org.org_id)
        assert len(agents) == 2

    def test_deactivate_agent(self, agent_service, org):
        agent = agent_service.register(org.org_id, "temp")
        assert agent_service.deactivate(org.org_id, agent.agent_id) is True
        assert agent_service.is_active(org.org_id, agent.agent_id) is False

    def test_deactivate_nonexistent(self, agent_service, org):
        assert agent_service.deactivate(org.org_id, "nope") is False

    def test_role_enum_from_string(self, agent_service, org):
        agent = agent_service.register(org.org_id, "admin-bot", role="admin")
        assert agent.role == AgentRole.ADMIN

    def test_cross_org_isolation(self, org_service, agent_service):
        org_a = org_service.create("Org A")
        org_b = org_service.create("Org B")
        agent = agent_service.register(org_a.org_id, "secret-bot")
        assert agent_service.get(org_b.org_id, agent.agent_id) is None
