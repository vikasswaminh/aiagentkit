"""PostgreSQL-backed store implementing the Store[T] interface.

Requires: pip install psycopg[binary] psycopg_pool

Uses a single JSONB 'data' column per table so all model types
work through the same Store interface without schema changes.
"""

from __future__ import annotations

import json
import os
import threading
from dataclasses import asdict, fields
from datetime import datetime, timezone
from typing import Any, Callable, Generic, TypeVar

from agent_platform.shared.store import Store

T = TypeVar("T")


def _serialize(obj: Any) -> str:
    """Serialize a dataclass to JSON, handling datetime and enum."""
    def default(o: Any) -> Any:
        if isinstance(o, datetime):
            return o.isoformat()
        if hasattr(o, "value"):  # Enum
            return o.value
        raise TypeError(f"Object of type {type(o)} is not JSON serializable")

    return json.dumps(asdict(obj), default=default)


class PostgresStore(Store[T]):
    """PostgreSQL-backed store using JSONB.

    Each store instance manages one table. Table is auto-created on init.
    Thread-safe via connection pooling.

    Usage:
        store = PostgresStore("orgs", Organization, deserializer=Organization.from_dict)
    """

    def __init__(
        self,
        table_name: str,
        model_class: type[T],
        deserializer: Callable[[dict[str, Any]], T] | None = None,
        dsn: str | None = None,
    ) -> None:
        try:
            import psycopg
            from psycopg_pool import ConnectionPool
        except ImportError:
            raise ImportError(
                "PostgreSQL support requires psycopg: pip install psycopg[binary] psycopg_pool"
            )

        self._table = table_name
        self._model_class = model_class
        self._deserialize = deserializer or self._default_deserialize
        self._dsn = dsn or os.environ.get(
            "DATABASE_URL", "postgresql://agent_platform:agent_platform@localhost:5432/agent_platform"
        )
        self._pool = ConnectionPool(self._dsn, min_size=2, max_size=10)
        self._ensure_table()

    def _ensure_table(self) -> None:
        with self._pool.connection() as conn:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {self._table} (
                    key TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """)
            conn.commit()

    def _default_deserialize(self, data: dict[str, Any]) -> T:
        """Default deserializer: pass dict as kwargs to model constructor."""
        # Handle datetime strings
        field_names = {f.name for f in fields(self._model_class)}
        filtered = {k: v for k, v in data.items() if k in field_names}
        for k, v in filtered.items():
            if isinstance(v, str) and "T" in v and (v.endswith("Z") or "+" in v):
                try:
                    filtered[k] = datetime.fromisoformat(v.replace("Z", "+00:00"))
                except ValueError:
                    pass
        return self._model_class(**filtered)

    def put(self, key: str, value: T) -> None:
        data = _serialize(value)
        with self._pool.connection() as conn:
            conn.execute(
                f"""
                INSERT INTO {self._table} (key, data, updated_at)
                VALUES (%s, %s::jsonb, NOW())
                ON CONFLICT (key) DO UPDATE SET data = %s::jsonb, updated_at = NOW()
                """,
                (key, data, data),
            )
            conn.commit()

    def get(self, key: str) -> T | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                f"SELECT data FROM {self._table} WHERE key = %s", (key,)
            ).fetchone()
            if row is None:
                return None
            return self._deserialize(row[0])

    def list(self, prefix: str | None = None) -> list[T]:
        with self._pool.connection() as conn:
            if prefix:
                rows = conn.execute(
                    f"SELECT data FROM {self._table} WHERE key LIKE %s ORDER BY created_at",
                    (prefix + "%",),
                ).fetchall()
            else:
                rows = conn.execute(
                    f"SELECT data FROM {self._table} ORDER BY created_at"
                ).fetchall()
            return [self._deserialize(row[0]) for row in rows]

    def delete(self, key: str) -> bool:
        with self._pool.connection() as conn:
            result = conn.execute(
                f"DELETE FROM {self._table} WHERE key = %s", (key,)
            )
            conn.commit()
            return result.rowcount > 0

    def exists(self, key: str) -> bool:
        with self._pool.connection() as conn:
            row = conn.execute(
                f"SELECT 1 FROM {self._table} WHERE key = %s", (key,)
            ).fetchone()
            return row is not None

    def close(self) -> None:
        self._pool.close()
