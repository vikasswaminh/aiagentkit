"""Tests for MCPAuthorizationProxy — policy enforcement, audit."""

from agent_platform.gateway.mcp_proxy import MCPAuthorizationProxy, ToolCallRequest
from agent_platform.shared.models import PolicyDecision


class TestMCPProxy:
    def _make_proxy(self, allow=True, budget_ok=True):
        def policy_checker(org_id, agent_id, tool_name, tokens):
            return PolicyDecision(
                allowed=allow,
                reason="allowed" if allow else "denied by policy",
            )

        def budget_checker(org_id, agent_id, tokens):
            return (budget_ok, 1000, "ok" if budget_ok else "budget exhausted")

        def usage_reporter(**kwargs):
            return 1000

        audit_entries = []

        proxy = MCPAuthorizationProxy(
            policy_checker=policy_checker,
            budget_checker=budget_checker,
            usage_reporter=usage_reporter,
            audit_logger=lambda e: audit_entries.append(e),
        )
        return proxy, audit_entries

    def _make_request(self):
        return ToolCallRequest(
            agent_id="agent-1",
            org_id="org-1",
            delegated_user_id="user-1",
            execution_id="exec-1",
            tool_name="search",
        )

    def test_allowed_execution(self):
        proxy, audit = self._make_proxy()
        proxy.register_tool("search", lambda **kw: "results")
        result = proxy.execute(self._make_request())
        assert result.success is True
        assert result.result == "results"
        assert len(audit) == 1
        assert audit[0].result == "executed"

    def test_policy_denied(self):
        proxy, audit = self._make_proxy(allow=False)
        proxy.register_tool("search", lambda **kw: "results")
        result = proxy.execute(self._make_request())
        assert result.success is False
        assert "policy denied" in result.error
        assert audit[0].result == "denied"

    def test_budget_denied(self):
        proxy, audit = self._make_proxy(budget_ok=False)
        proxy.register_tool("search", lambda **kw: "results")
        result = proxy.execute(self._make_request())
        assert result.success is False
        assert "budget denied" in result.error

    def test_tool_not_found(self):
        proxy, audit = self._make_proxy()
        result = proxy.execute(self._make_request())
        assert result.success is False
        assert "not registered" in result.error

    def test_tool_exception(self):
        proxy, audit = self._make_proxy()

        def bad_tool(**kw):
            raise RuntimeError("tool crashed")

        proxy.register_tool("search", bad_tool)
        result = proxy.execute(self._make_request())
        assert result.success is False
        assert "tool crashed" in result.error
        assert audit[-1].result == "failed"

    def test_audit_entry_fields(self):
        proxy, audit = self._make_proxy()
        proxy.register_tool("search", lambda **kw: "ok")
        proxy.execute(self._make_request())
        entry = audit[0]
        assert entry.org_id == "org-1"
        assert entry.agent_id == "agent-1"
        assert entry.tool_name == "search"
        assert entry.execution_id == "exec-1"
