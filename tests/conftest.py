"""Shared fixtures for agent platform tests."""

import pytest

from agent_platform.control_plane.agents import AgentService
from agent_platform.control_plane.billing import BillingService
from agent_platform.control_plane.orgs import OrgService
from agent_platform.control_plane.policy import PolicyService
from agent_platform.execution.llm import MockLLM
from agent_platform.execution.tools import MockTool, ToolRegistry
from agent_platform.gateway.audit import AuditLog
from agent_platform.shared.models import PolicyEffect, ToolPermission


@pytest.fixture
def org_service():
    return OrgService()


@pytest.fixture
def agent_service():
    return AgentService()


@pytest.fixture
def policy_service():
    return PolicyService()


@pytest.fixture
def billing_service():
    return BillingService()


@pytest.fixture
def audit_log():
    return AuditLog()


@pytest.fixture
def mock_llm():
    return MockLLM()


@pytest.fixture
def tool_registry():
    reg = ToolRegistry()
    reg.register(MockTool(name="search", response="search results"))
    reg.register(MockTool(name="calculator", response="42"))
    return reg


@pytest.fixture
def org(org_service):
    return org_service.create("Test Corp")


@pytest.fixture
def agent(agent_service, org):
    return agent_service.register(
        org_id=org.org_id,
        name="test-agent",
        role="executor",
        delegated_user_id="user-alice",
    )


@pytest.fixture
def org_policy(policy_service, org):
    return policy_service.set_policy(
        org_id=org.org_id,
        tools=[
            ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="shell", effect=PolicyEffect.DENY),
        ],
        token_limit=200_000,
    )


@pytest.fixture
def agent_policy(policy_service, org, agent):
    return policy_service.set_policy(
        org_id=org.org_id,
        agent_id=agent.agent_id,
        tools=[
            ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="calculator", effect=PolicyEffect.ALLOW),
        ],
        token_limit=50_000,
    )
