"""Tests for TokenExchangeService — exchange, validate, revoke, expiry."""

import time

from agent_platform.gateway.token_exchange import TokenExchangeService


class TestTokenExchangeService:
    def test_exchange_token(self):
        svc = TokenExchangeService()
        token = svc.exchange("parent-1", "agent-1", "org-1", "search")
        assert token.token_id
        assert token.tool_name == "search"
        assert token.agent_id == "agent-1"

    def test_validate_valid_token(self):
        svc = TokenExchangeService()
        token = svc.exchange("parent-1", "agent-1", "org-1", "search")
        validated = svc.validate(token.token_id)
        assert validated is not None
        assert validated.token_id == token.token_id

    def test_validate_invalid_token(self):
        svc = TokenExchangeService()
        assert svc.validate("nonexistent") is None

    def test_validate_expired_token(self):
        svc = TokenExchangeService()
        token = svc.exchange(
            "parent-1", "agent-1", "org-1", "search", ttl_seconds=0
        )
        # Token expires immediately (ttl=0 means expires_at = now)
        time.sleep(0.01)
        assert svc.validate(token.token_id) is None

    def test_revoke_token(self):
        svc = TokenExchangeService()
        token = svc.exchange("parent-1", "agent-1", "org-1", "search")
        assert svc.revoke(token.token_id) is True
        assert svc.validate(token.token_id) is None

    def test_revoke_nonexistent(self):
        svc = TokenExchangeService()
        assert svc.revoke("nonexistent") is False

    def test_revoke_all_for_agent(self):
        svc = TokenExchangeService()
        svc.exchange("p1", "agent-1", "org-1", "search")
        svc.exchange("p2", "agent-1", "org-1", "calc")
        svc.exchange("p3", "agent-2", "org-1", "search")
        count = svc.revoke_all_for_agent("agent-1")
        assert count == 2

    def test_cleanup_expired(self):
        svc = TokenExchangeService()
        svc.exchange("p1", "agent-1", "org-1", "search", ttl_seconds=0)
        svc.exchange("p2", "agent-1", "org-1", "calc", ttl_seconds=300)
        time.sleep(0.01)
        cleaned = svc.cleanup_expired()
        assert cleaned == 1

    def test_scoped_token_has_claims(self):
        svc = TokenExchangeService()
        token = svc.exchange("parent-1", "agent-1", "org-1", "search")
        assert "grant_type" in token.claims
        assert token.scopes == ["tool:search:execute"]

    def test_custom_scopes(self):
        svc = TokenExchangeService()
        token = svc.exchange(
            "parent-1", "agent-1", "org-1", "search",
            scopes=["read", "write"],
        )
        assert token.scopes == ["read", "write"]
