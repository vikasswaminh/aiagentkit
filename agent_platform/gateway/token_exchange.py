"""Token exchange — narrow broad agent tokens to task-scoped tool tokens (RFC 8693)."""

from __future__ import annotations

import threading
import time
from dataclasses import dataclass, field
from typing import Any

from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import _new_id

log = get_logger()


@dataclass
class ScopedToken:
    token_id: str = field(default_factory=_new_id)
    parent_token_id: str = ""
    agent_id: str = ""
    org_id: str = ""
    tool_name: str = ""
    scopes: list[str] = field(default_factory=list)
    issued_at: float = field(default_factory=time.time)
    expires_at: float = 0.0  # unix timestamp
    claims: dict[str, Any] = field(default_factory=dict)

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at if self.expires_at > 0 else False


class TokenExchangeService:
    """Exchange broad agent tokens for narrow, task-scoped tokens per tool.

    Implements the conceptual pattern of RFC 8693 (OAuth Token Exchange).
    In production, this would integrate with Auth0's token exchange endpoint.
    """

    _MAX_ACTIVE_TOKENS = 10_000

    def __init__(self, default_ttl_seconds: int = 300) -> None:
        self._default_ttl = default_ttl_seconds
        self._active_tokens: dict[str, ScopedToken] = {}
        self._lock = threading.RLock()

    def exchange(
        self,
        parent_token_id: str,
        agent_id: str,
        org_id: str,
        tool_name: str,
        scopes: list[str] | None = None,
        ttl_seconds: int | None = None,
    ) -> ScopedToken:
        """Exchange a broad token for a narrow, tool-scoped token."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        now = time.time()

        token = ScopedToken(
            parent_token_id=parent_token_id,
            agent_id=agent_id,
            org_id=org_id,
            tool_name=tool_name,
            scopes=scopes or [f"tool:{tool_name}:execute"],
            issued_at=now,
            expires_at=now + ttl,
            claims={
                "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
                "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
                "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
            },
        )

        with self._lock:
            # Evict expired tokens if approaching capacity
            if len(self._active_tokens) >= self._MAX_ACTIVE_TOKENS:
                self.cleanup_expired()
            self._active_tokens[token.token_id] = token

        log.info(
            "token_exchanged",
            token_id=token.token_id,
            parent_token_id=parent_token_id,
            agent_id=agent_id,
            tool_name=tool_name,
            ttl_seconds=ttl,
        )
        return token

    def validate(self, token_id: str) -> ScopedToken | None:
        """Validate a scoped token. Returns None if invalid or expired."""
        with self._lock:
            token = self._active_tokens.get(token_id)
            if token is None:
                return None
            if token.is_expired:
                del self._active_tokens[token_id]
                return None
            return token

    def revoke(self, token_id: str) -> bool:
        """Revoke a scoped token."""
        with self._lock:
            if token_id in self._active_tokens:
                del self._active_tokens[token_id]
                log.info("token_revoked", token_id=token_id)
                return True
            return False

    def revoke_all_for_agent(self, agent_id: str) -> int:
        """Revoke all tokens for an agent. Returns count revoked."""
        with self._lock:
            to_revoke = [
                tid for tid, t in self._active_tokens.items() if t.agent_id == agent_id
            ]
            for tid in to_revoke:
                del self._active_tokens[tid]
        if to_revoke:
            log.info("tokens_revoked_for_agent", agent_id=agent_id, count=len(to_revoke))
        return len(to_revoke)

    def cleanup_expired(self) -> int:
        """Remove expired tokens. Returns count cleaned."""
        now = time.time()
        with self._lock:
            expired = [
                tid
                for tid, t in self._active_tokens.items()
                if t.expires_at > 0 and now > t.expires_at
            ]
            for tid in expired:
                del self._active_tokens[tid]
        return len(expired)
