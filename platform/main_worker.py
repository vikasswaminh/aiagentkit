"""Execution worker entrypoint."""

import sys

from agent_platform.control_plane.agents import AgentService
from agent_platform.control_plane.billing import BillingService
from agent_platform.control_plane.policy import PolicyService
from agent_platform.execution.llm import MockLLM
from agent_platform.execution.tools import MockTool, ToolRegistry
from agent_platform.execution.worker import create_execution_server
from agent_platform.shared.logging import configure_logging, get_logger

log = get_logger()


def main() -> None:
    configure_logging()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 50052

    # Shared services (in production these would connect to control plane via gRPC)
    agent_service = AgentService()
    policy_service = PolicyService()
    billing_service = BillingService()

    # Tool registry
    tools = ToolRegistry()
    tools.register(MockTool(name="search", response="search results"))
    tools.register(MockTool(name="calculator", response="42"))

    server = create_execution_server(
        agent_service=agent_service,
        policy_service=policy_service,
        billing_service=billing_service,
        llm=MockLLM(),
        tool_registry=tools,
        port=port,
    )
    server.start()
    log.info("worker_started", port=port)
    server.wait_for_termination()


if __name__ == "__main__":
    main()
