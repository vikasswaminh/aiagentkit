"""Tests for ExecutionRuntime — end-to-end governance pipeline."""

from agent_platform.execution.runtime import ExecutionRuntime
from agent_platform.execution.llm import MockLLM
from agent_platform.execution.tools import MockTool, ToolRegistry
from agent_platform.shared.models import ExecutionRequest, PolicyEffect, ToolPermission


class TestExecutionRuntime:
    def _make_runtime(self, org_service, agent_service, policy_service, billing_service):
        tools = ToolRegistry()
        tools.register(MockTool(name="search", response="found results"))
        return ExecutionRuntime(
            agent_service=agent_service,
            policy_service=policy_service,
            billing_service=billing_service,
            llm=MockLLM(default_response="LLM says hello"),
            tool_registry=tools,
        )

    def test_successful_execution(
        self, org_service, agent_service, policy_service, billing_service, org, agent
    ):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
            token_limit=100_000,
        )
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
        runtime = self._make_runtime(
            org_service, agent_service, policy_service, billing_service
        )
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="Find papers",
            )
        )
        assert response.success is True
        assert response.result == "LLM says hello"
        assert response.tokens_used > 0

    def test_inactive_agent_rejected(
        self, org_service, agent_service, policy_service, billing_service, org, agent
    ):
        agent_service.deactivate(org.org_id, agent.agent_id)
        runtime = self._make_runtime(
            org_service, agent_service, policy_service, billing_service
        )
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="Should fail",
            )
        )
        assert response.success is False
        assert "inactive" in response.error

    def test_no_policy_rejected(
        self, org_service, agent_service, policy_service, billing_service, org, agent
    ):
        runtime = self._make_runtime(
            org_service, agent_service, policy_service, billing_service
        )
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="Should fail",
            )
        )
        assert response.success is False
        assert "no policy" in response.error

    def test_budget_exhausted_rejected(
        self, org_service, agent_service, policy_service, billing_service, org, agent
    ):
        policy_service.set_policy(
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=[ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW)],
            token_limit=100_000,
        )
        billing_service.set_budget(org.org_id, agent.agent_id, token_limit=0)
        runtime = self._make_runtime(
            org_service, agent_service, policy_service, billing_service
        )
        response = runtime.execute(
            ExecutionRequest(
                agent_id=agent.agent_id,
                org_id=org.org_id,
                task="Should fail",
            )
        )
        assert response.success is False
        assert "budget" in response.error

    def test_nonexistent_agent_rejected(
        self, org_service, agent_service, policy_service, billing_service, org
    ):
        runtime = self._make_runtime(
            org_service, agent_service, policy_service, billing_service
        )
        response = runtime.execute(
            ExecutionRequest(
                agent_id="nonexistent",
                org_id=org.org_id,
                task="Should fail",
            )
        )
        assert response.success is False
        assert "not found" in response.error
