"""Agent-scoped memory interface and in-memory implementation."""

from __future__ import annotations

import threading
from abc import ABC, abstractmethod
from typing import Any


class BaseMemory(ABC):
    """Abstract memory interface — agent-scoped storage."""

    @abstractmethod
    def store(self, agent_id: str, key: str, value: Any) -> None: ...

    @abstractmethod
    def retrieve(self, agent_id: str, key: str) -> Any | None: ...

    @abstractmethod
    def list_keys(self, agent_id: str) -> list[str]: ...

    @abstractmethod
    def clear(self, agent_id: str) -> None: ...


class InMemoryStorage(BaseMemory):
    """Thread-safe in-memory agent-scoped storage."""

    def __init__(self) -> None:
        self._data: dict[str, dict[str, Any]] = {}
        self._lock = threading.RLock()

    def store(self, agent_id: str, key: str, value: Any) -> None:
        with self._lock:
            if agent_id not in self._data:
                self._data[agent_id] = {}
            self._data[agent_id][key] = value

    def retrieve(self, agent_id: str, key: str) -> Any | None:
        with self._lock:
            return self._data.get(agent_id, {}).get(key)

    def list_keys(self, agent_id: str) -> list[str]:
        with self._lock:
            return list(self._data.get(agent_id, {}).keys())

    def clear(self, agent_id: str) -> None:
        with self._lock:
            self._data.pop(agent_id, None)
