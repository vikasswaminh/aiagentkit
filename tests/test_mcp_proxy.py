"""Tests for MCP Authorization Proxy — policy and budget enforcement on tool calls."""

import pytest

from agent_platform.gateway.mcp_proxy import MCPAuthorizationProxy, ToolCallRequest
from agent_platform.shared.models import PolicyDecision


def _allow_policy(org_id, agent_id, tool_name, estimated_tokens):
    return PolicyDecision(allowed=True, reason="allowed")


def _deny_policy(org_id, agent_id, tool_name, estimated_tokens):
    return PolicyDecision(allowed=False, reason="tool denied by policy")


def _allow_budget(org_id, agent_id, estimated_tokens):
    return (True, 99999, "budget_ok")


def _deny_budget(org_id, agent_id, estimated_tokens):
    return (False, 0, "budget exhausted")


def _noop_usage(**kwargs):
    return 0


def _make_request(tool_name="search", params=None):
    return ToolCallRequest(
        agent_id="agent-1",
        org_id="org-1",
        delegated_user_id="user-1",
        execution_id="exec-1",
        tool_name=tool_name,
        parameters=params or {},
    )


class TestPolicyEnforcement:
    def test_allowed_tool_executes(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("search", lambda: "results")
        result = proxy.execute(_make_request("search"))
        assert result.success is True
        assert result.result == "results"

    def test_denied_tool_blocked(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_deny_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("shell", lambda cmd: None)
        result = proxy.execute(_make_request("shell"))
        assert result.success is False
        assert "policy denied" in result.error

    def test_unregistered_tool_fails(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        result = proxy.execute(_make_request("nonexistent"))
        assert result.success is False
        assert "not registered" in result.error


class TestBudgetEnforcement:
    def test_over_budget_blocked(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_deny_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("search", lambda: "results")
        result = proxy.execute(_make_request("search"))
        assert result.success is False
        assert "budget denied" in result.error

    def test_within_budget_executes(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("search", lambda: "results")
        result = proxy.execute(_make_request("search"))
        assert result.success is True


class TestAuditEmission:
    def test_audit_entry_on_success(self):
        entries = []
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
            audit_logger=entries.append,
        )
        proxy.register_tool("search", lambda: "results")
        result = proxy.execute(_make_request("search"))
        assert result.audit_entry is not None
        assert result.audit_entry.result == "executed"
        assert len(entries) == 1

    def test_audit_entry_on_denial(self):
        entries = []
        proxy = MCPAuthorizationProxy(
            policy_checker=_deny_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
            audit_logger=entries.append,
        )
        result = proxy.execute(_make_request("search"))
        assert result.audit_entry.result == "denied"
        assert len(entries) == 1

    def test_audit_entry_on_error(self):
        entries = []
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
            audit_logger=entries.append,
        )
        proxy.register_tool("broken", lambda: (_ for _ in ()).throw(RuntimeError("boom")))
        result = proxy.execute(_make_request("broken"))
        assert result.success is False
        assert result.audit_entry.result == "failed"


class TestToolExecution:
    def test_tool_receives_parameters(self):
        received = {}

        def handler(query="", limit=10):
            received["query"] = query
            received["limit"] = limit
            return "ok"

        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("search", handler)
        result = proxy.execute(
            _make_request("search", params={"query": "AI agents", "limit": 5})
        )
        assert result.success is True
        assert received["query"] == "AI agents"
        assert received["limit"] == 5

    def test_latency_recorded(self):
        proxy = MCPAuthorizationProxy(
            policy_checker=_allow_policy,
            budget_checker=_allow_budget,
            usage_reporter=_noop_usage,
        )
        proxy.register_tool("slow", lambda: "done")
        result = proxy.execute(_make_request("slow"))
        assert result.latency_ms >= 0
