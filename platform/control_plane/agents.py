"""Agent identity management service."""

from __future__ import annotations

from typing import Any

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import AgentIdentity, AgentRole
from agent_platform.shared.store import InMemoryStore, Store

log = get_logger()


def _agent_key(org_id: str, agent_id: str) -> str:
    return f"{org_id}:{agent_id}"


class AgentService:
    """Agent registration, identity issuance, and lifecycle management."""

    def __init__(self, store: Store[AgentIdentity] | None = None) -> None:
        self._store: Store[AgentIdentity] = store or InMemoryStore()

    def register(
        self,
        org_id: str,
        name: str,
        role: str | AgentRole = AgentRole.EXECUTOR,
        delegated_user_id: str | None = None,
        token_claims: dict[str, Any] | None = None,
    ) -> AgentIdentity:
        if isinstance(role, str):
            role = AgentRole(role)

        agent = AgentIdentity(
            org_id=org_id,
            name=name,
            role=role,
            delegated_user_id=delegated_user_id,
            token_claims=token_claims or {},
        )
        key = _agent_key(org_id, agent.agent_id)
        self._store.put(key, agent)
        log.info(
            "agent_registered",
            agent_id=agent.agent_id,
            org_id=org_id,
            name=name,
            role=role.value,
        )
        return agent

    def get(self, org_id: str, agent_id: str) -> AgentIdentity | None:
        return self._store.get(_agent_key(org_id, agent_id))

    def get_by_id(self, agent_id: str) -> AgentIdentity | None:
        """Look up agent by agent_id alone (scans all orgs)."""
        for agent in self._store.list():
            if agent.agent_id == agent_id:
                return agent
        return None

    def list(self, org_id: str) -> list[AgentIdentity]:
        return self._store.list(prefix=f"{org_id}:")

    def deactivate(self, org_id: str, agent_id: str) -> bool:
        agent = self.get(org_id, agent_id)
        if agent is None:
            return False
        agent.active = False
        self._store.put(_agent_key(org_id, agent_id), agent)
        log.info("agent_deactivated", agent_id=agent_id, org_id=org_id)
        return True

    def is_active(self, org_id: str, agent_id: str) -> bool:
        agent = self.get(org_id, agent_id)
        return agent is not None and agent.active
