"""Unified client for the Agent Platform control plane."""

from __future__ import annotations

from typing import Any

import grpc

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc
from agent_platform_sdk.orgs import OrgClient
from agent_platform_sdk.agents import AgentClient
from agent_platform_sdk.policy import PolicyClient
from agent_platform_sdk.budget import BudgetClient


class AgentPlatformClient:
    """Unified client for all control plane operations.

    Usage:
        client = AgentPlatformClient("localhost:50051")
        org = client.orgs.create("my-company")
        agent = client.agents.register(org.org_id, "assistant", role="executor")
        client.policy.set(org.org_id, agent.agent_id, allowed_tools=["search"])
        client.budget.set(org.org_id, agent.agent_id, token_limit=100000)
    """

    def __init__(self, address: str = "localhost:50051") -> None:
        self._channel = grpc.insecure_channel(address)
        self._stub = pb2_grpc.ControlPlaneStub(self._channel)
        self.orgs = OrgClient(self._stub)
        self.agents = AgentClient(self._stub)
        self.policy = PolicyClient(self._stub)
        self.budget = BudgetClient(self._stub)

    def close(self) -> None:
        self._channel.close()

    def __enter__(self) -> AgentPlatformClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
