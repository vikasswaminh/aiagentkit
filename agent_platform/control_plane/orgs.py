"""Organization management service."""

from __future__ import annotations

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import Organization
from agent_platform.shared.store import InMemoryStore, Store
from agent_platform.shared.validation import validate_name, ValidationError

log = get_logger()


class OrgService:
    """CRUD operations for organizations."""

    def __init__(self, store: Store[Organization] | None = None) -> None:
        self._store: Store[Organization] = store or InMemoryStore()

    def create(self, name: str, metadata: dict | None = None) -> Organization:
        name = validate_name(name, field="org_name")
        org = Organization(name=name, metadata=metadata or {})
        self._store.put(org.org_id, org)
        log.info("org_created", org_id=org.org_id, name=name)
        return org

    def get(self, org_id: str) -> Organization | None:
        return self._store.get(org_id)

    def list(self) -> list[Organization]:
        return self._store.list()

    def delete(self, org_id: str) -> bool:
        deleted = self._store.delete(org_id)
        if deleted:
            log.info("org_deleted", org_id=org_id)
        return deleted

    def exists(self, org_id: str) -> bool:
        return self._store.exists(org_id)
