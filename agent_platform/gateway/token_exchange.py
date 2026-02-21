"""Token exchange — narrow broad agent tokens to task-scoped tool tokens (RFC 8693).

Tokens are signed JWTs (RS256 by default, HS256 fallback). Each token contains
cryptographic claims binding it to a specific agent, tool, and time window.
"""

from __future__ import annotations

import os
import secrets
import threading
import time
from dataclasses import dataclass, field
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from agent_platform.shared.exceptions import (
    TokenCapacityError,
    TokenExpiredError,
    TokenNotFoundError,
)
from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import _new_id

log = get_logger()


def _generate_rsa_keypair() -> tuple[bytes, bytes]:
    """Generate an RSA-2048 keypair for JWT signing."""
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


@dataclass
class ScopedToken:
    token_id: str = field(default_factory=_new_id)
    parent_token_id: str = ""
    agent_id: str = ""
    org_id: str = ""
    tool_name: str = ""
    scopes: list[str] = field(default_factory=list)
    issued_at: float = field(default_factory=time.time)
    expires_at: float = 0.0
    claims: dict[str, Any] = field(default_factory=dict)
    jwt_token: str = ""  # The signed JWT string

    @property
    def is_expired(self) -> bool:
        return time.time() > self.expires_at if self.expires_at > 0 else False


class TokenExchangeService:
    """Exchange broad agent tokens for narrow, task-scoped signed JWTs.

    Implements RFC 8693 (OAuth Token Exchange) pattern with cryptographic
    signing via RS256 (or HS256 if configured with a symmetric secret).
    """

    _MAX_ACTIVE_TOKENS = 10_000

    def __init__(
        self,
        default_ttl_seconds: int = 300,
        signing_key: bytes | None = None,
        verification_key: bytes | None = None,
        algorithm: str = "RS256",
        issuer: str = "agent-platform",
    ) -> None:
        self._default_ttl = default_ttl_seconds
        self._algorithm = algorithm
        self._issuer = issuer
        self._active_tokens: dict[str, ScopedToken] = {}
        self._lock = threading.RLock()

        # Key management
        if signing_key and verification_key:
            self._signing_key = signing_key
            self._verification_key = verification_key
        elif algorithm == "HS256":
            # Symmetric key from env or generate
            secret = os.environ.get("AP_TOKEN_SECRET", "")
            if not secret:
                secret = secrets.token_urlsafe(32)
                log.warning("token_secret_generated", msg="AP_TOKEN_SECRET not set, using ephemeral key")
            self._signing_key = secret.encode()
            self._verification_key = self._signing_key
        else:
            # Generate RSA keypair
            self._signing_key, self._verification_key = _generate_rsa_keypair()
            log.info("rsa_keypair_generated", algorithm=algorithm)

    def exchange(
        self,
        parent_token_id: str,
        agent_id: str,
        org_id: str,
        tool_name: str,
        scopes: list[str] | None = None,
        ttl_seconds: int | None = None,
    ) -> ScopedToken:
        """Exchange a broad token for a narrow, tool-scoped signed JWT."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        now = time.time()
        token_id = _new_id()
        token_scopes = scopes or [f"tool:{tool_name}:execute"]

        # Build JWT payload (RFC 8693 compliant claims)
        jwt_payload = {
            "jti": token_id,
            "iss": self._issuer,
            "sub": agent_id,
            "aud": f"tool:{tool_name}",
            "iat": int(now),
            "exp": int(now + ttl),
            "org_id": org_id,
            "tool_name": tool_name,
            "scopes": token_scopes,
            "act": {"sub": parent_token_id},  # RFC 8693: actor claim
            "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
            "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
            "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
        }

        # Sign the JWT
        jwt_token = jwt.encode(jwt_payload, self._signing_key, algorithm=self._algorithm)

        token = ScopedToken(
            token_id=token_id,
            parent_token_id=parent_token_id,
            agent_id=agent_id,
            org_id=org_id,
            tool_name=tool_name,
            scopes=token_scopes,
            issued_at=now,
            expires_at=now + ttl,
            claims=jwt_payload,
            jwt_token=jwt_token,
        )

        with self._lock:
            if len(self._active_tokens) >= self._MAX_ACTIVE_TOKENS:
                cleaned = self.cleanup_expired()
                if len(self._active_tokens) >= self._MAX_ACTIVE_TOKENS:
                    raise TokenCapacityError(
                        f"token store at capacity ({self._MAX_ACTIVE_TOKENS}), "
                        f"cleaned {cleaned} expired tokens but still full"
                    )
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
        """Validate a scoped token by ID and verify JWT signature.

        Returns None if invalid, expired, or signature verification fails.
        """
        with self._lock:
            token = self._active_tokens.get(token_id)
            if token is None:
                return None
            if token.is_expired:
                del self._active_tokens[token_id]
                return None

        # Verify JWT signature
        try:
            jwt.decode(
                token.jwt_token,
                self._verification_key,
                algorithms=[self._algorithm],
                issuer=self._issuer,
                audience=f"tool:{token.tool_name}",
            )
        except jwt.InvalidTokenError:
            log.warning("jwt_verification_failed", token_id=token_id)
            with self._lock:
                self._active_tokens.pop(token_id, None)
            return None

        return token

    def validate_jwt(self, jwt_token: str, audience: str | None = None) -> dict[str, Any] | None:
        """Validate a raw JWT string without requiring token ID lookup.

        Returns decoded claims if valid, None if invalid/expired.
        If audience is not provided, audience verification is skipped.
        """
        try:
            decode_options = {}
            kwargs: dict[str, Any] = {
                "algorithms": [self._algorithm],
                "issuer": self._issuer,
            }
            if audience:
                kwargs["audience"] = audience
            else:
                decode_options["verify_aud"] = False
            claims = jwt.decode(
                jwt_token,
                self._verification_key,
                options=decode_options,
                **kwargs,
            )
            return claims
        except jwt.InvalidTokenError:
            return None

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

    @property
    def public_key_pem(self) -> bytes:
        """Return the public verification key (for external JWT validation)."""
        return self._verification_key
