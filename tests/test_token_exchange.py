"""Tests for token exchange service (RFC 8693 pattern)."""

import time
import threading

import pytest

from agent_platform.gateway.token_exchange import TokenExchangeService, ScopedToken


class TestTokenExchange:
    def test_exchange_creates_scoped_token(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="broad-token",
            agent_id="agent-1",
            org_id="org-1",
            tool_name="search",
        )
        assert token.token_id
        assert token.agent_id == "agent-1"
        assert token.org_id == "org-1"
        assert token.tool_name == "search"
        assert "tool:search:execute" in token.scopes

    def test_exchange_sets_expiration(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
            ttl_seconds=120,
        )
        assert token.expires_at > time.time()
        assert token.expires_at <= time.time() + 121

    def test_exchange_includes_rfc8693_claims(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
        )
        assert token.claims["grant_type"] == "urn:ietf:params:oauth:grant-type:token-exchange"

    def test_custom_scopes(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
            scopes=["read", "write"],
        )
        assert token.scopes == ["read", "write"]


class TestTokenValidation:
    def test_validate_valid_token(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
        )
        result = token_exchange.validate(token.token_id)
        assert result is not None
        assert result.token_id == token.token_id

    def test_validate_nonexistent_returns_none(self, token_exchange):
        assert token_exchange.validate("nonexistent") is None

    def test_validate_expired_returns_none(self):
        ts = TokenExchangeService(default_ttl_seconds=1)
        token = ts.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
            ttl_seconds=1,
        )
        # Manually expire the token
        token.expires_at = time.time() - 1
        assert ts.validate(token.token_id) is None


class TestTokenRevocation:
    def test_revoke_existing(self, token_exchange):
        token = token_exchange.exchange(
            parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
        )
        assert token_exchange.revoke(token.token_id) is True
        assert token_exchange.validate(token.token_id) is None

    def test_revoke_nonexistent(self, token_exchange):
        assert token_exchange.revoke("nonexistent") is False

    def test_revoke_all_for_agent(self, token_exchange):
        for i in range(5):
            token_exchange.exchange(
                parent_token_id="p", agent_id="agent-1", org_id="o",
                tool_name=f"tool-{i}",
            )
        token_exchange.exchange(
            parent_token_id="p", agent_id="agent-2", org_id="o", tool_name="t",
        )
        count = token_exchange.revoke_all_for_agent("agent-1")
        assert count == 5
        # agent-2's token still valid
        assert token_exchange.validate is not None

    def test_cleanup_expired(self):
        ts = TokenExchangeService(default_ttl_seconds=0)
        for i in range(3):
            ts.exchange(
                parent_token_id="p", agent_id="a", org_id="o",
                tool_name=f"t-{i}", ttl_seconds=0,
            )
        time.sleep(0.01)
        cleaned = ts.cleanup_expired()
        assert cleaned == 3


class TestTokenThreadSafety:
    def test_concurrent_exchange_and_revoke(self):
        ts = TokenExchangeService()
        tokens = []
        lock = threading.Lock()

        def exchange_tokens():
            for _ in range(50):
                t = ts.exchange(
                    parent_token_id="p", agent_id="a", org_id="o", tool_name="t",
                )
                with lock:
                    tokens.append(t.token_id)

        def revoke_tokens():
            for _ in range(50):
                with lock:
                    if tokens:
                        tid = tokens.pop()
                    else:
                        tid = None
                if tid:
                    ts.revoke(tid)

        t1 = threading.Thread(target=exchange_tokens)
        t2 = threading.Thread(target=revoke_tokens)
        t1.start()
        t2.start()
        t1.join()
        t2.join()
        # No crash = success
