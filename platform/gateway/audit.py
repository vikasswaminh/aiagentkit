"""Append-only audit log for all gateway operations."""

from __future__ import annotations

import threading
from typing import Any

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import AuditEntry

log = get_logger()


class AuditLog:
    """Append-only audit log with query support.

    In production, this would write to an immutable store (e.g., append-only
    Postgres table, S3 + Athena, or a dedicated audit service).
    """

    def __init__(self) -> None:
        self._entries: list[AuditEntry] = []
        self._lock = threading.RLock()

    def append(self, entry: AuditEntry) -> None:
        """Append an audit entry. Immutable — entries cannot be modified or deleted."""
        with self._lock:
            self._entries.append(entry)
        log.info(
            "audit_logged",
            entry_id=entry.entry_id,
            org_id=entry.org_id,
            agent_id=entry.agent_id,
            action=entry.action,
            result=entry.result,
        )

    def query(
        self,
        org_id: str | None = None,
        agent_id: str | None = None,
        execution_id: str | None = None,
        action: str | None = None,
        limit: int = 100,
    ) -> list[AuditEntry]:
        """Query audit entries with optional filters."""
        with self._lock:
            results = []
            for entry in reversed(self._entries):  # newest first
                if org_id and entry.org_id != org_id:
                    continue
                if agent_id and entry.agent_id != agent_id:
                    continue
                if execution_id and entry.execution_id != execution_id:
                    continue
                if action and entry.action != action:
                    continue
                results.append(entry)
                if len(results) >= limit:
                    break
            return results

    def get_delegation_chain(self, execution_id: str) -> list[AuditEntry]:
        """Get full delegation chain for an execution (user → agent → tools)."""
        with self._lock:
            return [
                e for e in self._entries if e.execution_id == execution_id
            ]

    @property
    def count(self) -> int:
        with self._lock:
            return len(self._entries)
