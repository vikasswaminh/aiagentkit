"""Quickstart — demonstrates the full Agent Platform governance pipeline.

Run the control plane first:
    python -m platform.main_control

Then run this script:
    python examples/quickstart.py
"""

import sys
sys.path.insert(0, '.')
sys.path.insert(0, './platform')

from platform.control_plane.orgs import OrgService
from platform.control_plane.agents import AgentService
from platform.control_plane.policy import PolicyService
from platform.control_plane.billing import BillingService
from platform.execution.runtime import ExecutionRuntime
from platform.execution.llm import MockLLM
from platform.execution.tools import ToolRegistry, MockTool
from platform.shared.models import (
    ExecutionRequest,
    PolicyEffect,
    ToolPermission,
    UsageQuery,
)
from platform.shared.logging import configure_logging

configure_logging()


def main() -> None:
    # Initialize services
    orgs = OrgService()
    agents = AgentService()
    policies = PolicyService()
    billing = BillingService()

    # 1. Create an organization
    org = orgs.create("Acme Corp")
    print(f"[1] Created org: {org.org_id}")

    # 2. Register an agent with delegation to a human user
    agent = agents.register(
        org_id=org.org_id,
        name="research-bot",
        role="executor",
        delegated_user_id="user-jane-doe",
    )
    print(f"[2] Registered agent: {agent.agent_id} (delegated to user-jane-doe)")

    # 3. Set org-level policy (baseline)
    policies.set_policy(
        org_id=org.org_id,
        tools=[
            ToolPermission(tool_name="*", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="shell", effect=PolicyEffect.DENY),
        ],
        token_limit=200_000,
    )
    print("[3] Set org policy: allow all tools, deny shell, 200k token limit")

    # 4. Set agent-level policy (override)
    policies.set_policy(
        org_id=org.org_id,
        agent_id=agent.agent_id,
        tools=[
            ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW),
            ToolPermission(tool_name="calculator", effect=PolicyEffect.ALLOW),
        ],
        token_limit=50_000,
    )
    print("[4] Set agent policy: allow search + calculator, 50k token limit")

    # 5. Set budgets
    billing.set_budget(org.org_id, token_limit=1_000_000)
    billing.set_budget(org.org_id, agent.agent_id, token_limit=100_000)
    print("[5] Set budgets: org=1M tokens, agent=100k tokens")

    # 6. Policy evaluation
    allowed = policies.evaluate(org.org_id, agent.agent_id, "search")
    denied = policies.evaluate(org.org_id, agent.agent_id, "shell")
    print(f"[6] Policy check: search={allowed.allowed}, shell={denied.allowed}")

    # 7. Budget check
    ok, remaining, reason = billing.check_budget(org.org_id, agent.agent_id, 5_000)
    print(f"[7] Budget check: allowed={ok}, remaining={remaining}")

    # 8. Execute a task
    tools = ToolRegistry()
    tools.register(MockTool(name="search", response="Found 10 papers on AI agent security"))
    tools.register(MockTool(name="calculator", response="42"))

    runtime = ExecutionRuntime(agents, policies, billing, MockLLM(), tools)
    response = runtime.execute(
        ExecutionRequest(
            agent_id=agent.agent_id,
            org_id=org.org_id,
            task="Find recent papers on AI agent security",
        )
    )
    print(f"[8] Execution: success={response.success}, tokens={response.tokens_used}")
    print(f"    Result: {response.result}")

    # 9. Check usage after execution
    usage = billing.get_usage(UsageQuery(org_id=org.org_id, agent_id=agent.agent_id))
    print(f"[9] Usage: {usage.total_tokens} tokens consumed")

    budget = billing.get_budget(org.org_id, agent.agent_id)
    print(f"    Budget remaining: {budget.tokens_remaining} tokens")


if __name__ == "__main__":
    main()
