"""Shared fixtures for all tests."""

import pytest

from agent_platform.control_plane.orgs import OrgService
from agent_platform.control_plane.agents import AgentService
from agent_platform.control_plane.policy import PolicyService
from agent_platform.control_plane.billing import BillingService
from agent_platform.execution.llm import MockLLM
from agent_platform.execution.tools import ToolRegistry, MockTool
from agent_platform.execution.runtime import ExecutionRuntime
from agent_platform.gateway.audit import AuditLog
from agent_platform.gateway.token_exchange import TokenExchangeService
from agent_platform.gateway.mcp_proxy import MCPAuthorizationProxy
from agent_platform.shared.models import PolicyEffect, ToolPermission


@pytest.fixture
def orgs():
    return OrgService()


@pytest.fixture
def agents():
    return AgentService()


@pytest.fixture
def policies():
    return PolicyService()


@pytest.fixture
def billing():
    return BillingService()


@pytest.fixture
def audit_log():
    return AuditLog()


@pytest.fixture
def token_exchange():
    return TokenExchangeService(default_ttl_seconds=60)


@pytest.fixture
def mock_llm():
    return MockLLM()


@pytest.fixture
def tool_registry():
    reg = ToolRegistry()
    reg.register(MockTool(name="search", response="Found 10 results"))
    reg.register(MockTool(name="calculator", response="42"))
    return reg


@pytest.fixture
def org(orgs):
    return orgs.create("Test Corp")


@pytest.fixture
def agent(agents, org):
    return agents.register(
        org_id=org.org_id,
        name="test-bot",
        role="executor",
        delegated_user_id="user-jane",
    )


@pytest.fixture
def org_policy(policies, org):
    return policies.set_policy(
        org_id=org.org_id,
        tools=[
            ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="shell", effect=PolicyEffect.DENY),
        ],
        token_limit=200_000,
    )


@pytest.fixture
def agent_policy(policies, org, agent):
    return policies.set_policy(
        org_id=org.org_id,
        agent_id=agent.agent_id,
        tools=[
            ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="calculator", effect=PolicyEffect.ALLOW),
        ],
        token_limit=50_000,
    )


@pytest.fixture
def runtime(agents, policies, billing, mock_llm, tool_registry, audit_log):
    return ExecutionRuntime(
        agent_service=agents,
        policy_service=policies,
        billing_service=billing,
        llm=mock_llm,
        tool_registry=tool_registry,
        audit_log=audit_log,
    )
