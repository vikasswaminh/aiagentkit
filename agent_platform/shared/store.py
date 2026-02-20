"""In-memory store with interface-based design for future backend swapping."""

from __future__ import annotations

import threading
from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class Store(ABC, Generic[T]):
    """Abstract store interface. Swap implementation for Postgres, Redis, etc."""

    @abstractmethod
    def put(self, key: str, value: T) -> None: ...

    @abstractmethod
    def get(self, key: str) -> T | None: ...

    @abstractmethod
    def list(self, prefix: str | None = None) -> list[T]: ...

    @abstractmethod
    def delete(self, key: str) -> bool: ...

    @abstractmethod
    def exists(self, key: str) -> bool: ...


class InMemoryStore(Store[T]):
    """Thread-safe in-memory store implementation."""

    def __init__(self) -> None:
        self._data: dict[str, T] = {}
        self._lock = threading.RLock()

    def put(self, key: str, value: T) -> None:
        with self._lock:
            self._data[key] = value

    def get(self, key: str) -> T | None:
        with self._lock:
            return self._data.get(key)

    def list(self, prefix: str | None = None) -> list[T]:
        with self._lock:
            if prefix is None:
                return list(self._data.values())
            return [v for k, v in self._data.items() if k.startswith(prefix)]

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._data:
                del self._data[key]
                return True
            return False

    def exists(self, key: str) -> bool:
        with self._lock:
            return key in self._data

    def clear(self) -> None:
        with self._lock:
            self._data.clear()

    @property
    def count(self) -> int:
        with self._lock:
            return len(self._data)
