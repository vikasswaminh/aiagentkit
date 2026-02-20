"""Execution worker entrypoint.

Connects to the control plane via gRPC for all state operations.
The worker is stateless — all agent, policy, and budget data lives
in the control plane.
"""

import os
import sys

import grpc

from agent_platform.execution.llm import MockLLM
from agent_platform.execution.remote_services import (
    RemoteAgentService,
    RemoteBillingService,
    RemotePolicyService,
)
from agent_platform.execution.tools import MockTool, ToolRegistry
from agent_platform.execution.worker import create_execution_server
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc
from agent_platform.shared.logging import configure_logging, get_logger

log = get_logger()


def main() -> None:
    configure_logging()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 50052
    control_plane_addr = os.environ.get("CONTROL_PLANE_ADDRESS", "localhost:50051")

    # Connect to control plane via gRPC
    channel = grpc.insecure_channel(control_plane_addr)
    stub = pb2_grpc.ControlPlaneStub(channel)
    log.info("worker_connecting", control_plane=control_plane_addr)

    # Remote services backed by control plane
    agent_service = RemoteAgentService(stub)
    policy_service = RemotePolicyService(stub)
    billing_service = RemoteBillingService(stub)

    # Tool registry (local to this worker)
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
    log.info("worker_started", port=port, control_plane=control_plane_addr)

    try:
        server.wait_for_termination()
    finally:
        channel.close()


if __name__ == "__main__":
    main()
