"""Agent identity management client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from agent_platform.proto import agent_platform_pb2 as pb2


@dataclass
class Agent:
    agent_id: str
    org_id: str
    name: str
    role: str
    active: bool
    delegated_user_id: str | None = None


class AgentClient:
    """Client for agent registration and lifecycle."""

    def __init__(self, stub: Any) -> None:
        self._stub = stub

    def register(
        self,
        org_id: str,
        name: str,
        role: str = "executor",
        delegated_user_id: str | None = None,
    ) -> Agent:
        resp = self._stub.RegisterAgent(
            pb2.RegisterAgentRequest(
                org_id=org_id,
                name=name,
                role=role,
                delegated_user_id=delegated_user_id or "",
            )
        )
        return Agent(
            agent_id=resp.agent_id,
            org_id=resp.org_id,
            name=resp.name,
            role=resp.role,
            active=resp.active,
            delegated_user_id=resp.delegated_user_id or None,
        )

    def get(self, org_id: str, agent_id: str) -> Agent:
        resp = self._stub.GetAgent(
            pb2.GetAgentRequest(org_id=org_id, agent_id=agent_id)
        )
        return Agent(
            agent_id=resp.agent_id,
            org_id=resp.org_id,
            name=resp.name,
            role=resp.role,
            active=resp.active,
            delegated_user_id=resp.delegated_user_id or None,
        )

    def list(self, org_id: str) -> list[Agent]:
        resp = self._stub.ListAgents(pb2.ListAgentsRequest(org_id=org_id))
        return [
            Agent(
                agent_id=a.agent_id,
                org_id=a.org_id,
                name=a.name,
                role=a.role,
                active=a.active,
            )
            for a in resp.agents
        ]

    def deactivate(self, org_id: str, agent_id: str) -> bool:
        resp = self._stub.DeactivateAgent(
            pb2.DeactivateAgentRequest(org_id=org_id, agent_id=agent_id)
        )
        return resp.success
