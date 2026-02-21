"""Tests for error paths, edge cases, and failure modes."""

import threading
import time

import pytest

from agent_platform.control_plane.billing import BillingService
from agent_platform.control_plane.policy import OPAAdapter, PolicyService
from agent_platform.execution.runtime import ExecutionRuntime
from agent_platform.execution.llm import MockLLM
from agent_platform.execution.tools import MockTool, ToolRegistry, _is_ssrf_safe
from agent_platform.gateway.audit import AuditLog
from agent_platform.gateway.mcp_proxy import (
    MCPAuthorizationProxy,
    ToolCallRequest,
    _validate_parameters,
)
from agent_platform.gateway.token_exchange import TokenExchangeService
from agent_platform.shared.exceptions import (
    AgentNotFoundError,
    BudgetExhaustedError,
    InvalidUsageError,
    PolicyNotFoundError,
    ServiceUnavailableError,
    ToolNotFoundError,
    ToolParameterError,
    TokenCapacityError,
)
from agent_platform.shared.models import PolicyDecision, PolicyEffect, ToolPermission


class TestParameterValidation:
    """Test tool parameter validation (injection prevention)."""

    def test_rejects_too_many_parameters(self):
        params = {f"key_{i}": "val" for i in range(51)}
        with pytest.raises(ToolParameterError, match="too many parameters"):
            _validate_parameters(params)

    def test_rejects_long_key(self):
        params = {"x" * 257: "val"}
        with pytest.raises(ToolParameterError, match="key too long"):
            _validate_parameters(params)

    def test_rejects_long_string_value(self):
        params = {"key": "x" * 10_001}
        with pytest.raises(ToolParameterError, match="value too long"):
            _validate_parameters(params)

    def test_accepts_valid_parameters(self):
        params = {"url": "https://example.com", "method": "GET"}
        _validate_parameters(params)  # Should not raise

    def test_accepts_non_string_values(self):
        params = {"count": 42, "flag": True, "nested": {"a": 1}}
        _validate_parameters(params)  # Should not raise


class TestMCPProxyErrorPaths:
    """Test MCP proxy error handling."""

    def _make_proxy(self, allow=True, budget_ok=True):
        def policy_checker(org_id, agent_id, tool_name, tokens):
            return PolicyDecision(allowed=allow, reason="test")

        def budget_checker(org_id, agent_id, tokens):
            return (budget_ok, 1000, "ok" if budget_ok else "exhausted")

        def usage_reporter(**kwargs):
            return 1000

        proxy = MCPAuthorizationProxy(
            policy_checker=policy_checker,
            budget_checker=budget_checker,
            usage_reporter=usage_reporter,
        )
        return proxy

    def test_parameter_validation_blocks_before_policy_check(self):
        proxy = self._make_proxy(allow=True)
        proxy.register_tool("search", lambda **kw: "ok")
        request = ToolCallRequest(
            agent_id="a1", org_id="o1", delegated_user_id=None,
            execution_id="e1", tool_name="search",
            parameters={"x" * 300: "val"},
        )
        result = proxy.execute(request)
        assert not result.success
        assert result.error_type == "ToolParameterError"

    def test_tool_execution_error_returns_type(self):
        proxy = self._make_proxy(allow=True)

        def failing_tool(**kwargs):
            raise RuntimeError("tool crashed")

        proxy.register_tool("bad_tool", failing_tool)
        request = ToolCallRequest(
            agent_id="a1", org_id="o1", delegated_user_id=None,
            execution_id="e1", tool_name="bad_tool",
        )
        result = proxy.execute(request)
        assert not result.success
        assert result.error_type == "RuntimeError"
        assert "tool crashed" in result.error

    def test_audit_redacts_parameter_values(self):
        proxy = self._make_proxy(allow=True)
        proxy.register_tool("search", lambda **kw: "ok")
        request = ToolCallRequest(
            agent_id="a1", org_id="o1", delegated_user_id=None,
            execution_id="e1", tool_name="search",
            parameters={"secret_key": "super-secret-value"},
        )
        result = proxy.execute(request)
        assert result.success
        # Audit should contain type names, not actual values
        assert result.audit_entry.parameters == {"secret_key": "str"}


class TestAuditLogBounds:
    """Test audit log bounded memory."""

    def test_evicts_oldest_at_capacity(self):
        from agent_platform.shared.models import AuditEntry

        audit = AuditLog(max_entries=5)
        for i in range(10):
            audit.append(AuditEntry(org_id=f"org-{i}", action="test"))
        assert audit.count == 5
        assert audit.total_appended == 10
        # Oldest entries should be evicted
        entries = audit.query()
        org_ids = [e.org_id for e in entries]
        assert "org-0" not in org_ids
        assert "org-9" in org_ids

    def test_is_at_capacity(self):
        from agent_platform.shared.models import AuditEntry

        audit = AuditLog(max_entries=3)
        assert not audit.is_at_capacity
        for i in range(3):
            audit.append(AuditEntry(org_id=f"org-{i}", action="test"))
        assert audit.is_at_capacity


class TestOPACircuitBreaker:
    """Test OPA adapter circuit breaker."""

    def test_circuit_opens_after_failures(self):
        adapter = OPAAdapter(
            opa_url="http://localhost:9999",  # Non-existent
            failure_threshold=2,
            reset_timeout_seconds=60.0,
        )
        # First two failures should raise ServiceUnavailableError
        for _ in range(2):
            with pytest.raises(ServiceUnavailableError):
                adapter.evaluate("test_policy", {"tool_name": "search"})

        # Third call should be blocked by circuit breaker
        with pytest.raises(ServiceUnavailableError, match="circuit breaker open"):
            adapter.evaluate("test_policy", {"tool_name": "search"})


class TestTokenExchangeEdgeCases:
    """Test token exchange error paths."""

    def test_jwt_claims_contain_rfc8693_fields(self):
        svc = TokenExchangeService()
        token = svc.exchange("p1", "a1", "o1", "search")
        assert token.claims["grant_type"] == "urn:ietf:params:oauth:grant-type:token-exchange"
        assert token.claims["iss"] == "agent-platform"
        assert token.claims["sub"] == "a1"
        assert token.claims["aud"] == "tool:search"
        assert "act" in token.claims  # RFC 8693 actor claim

    def test_cross_service_jwt_verification_fails(self):
        """Tokens from one service should not validate on another."""
        svc1 = TokenExchangeService()
        svc2 = TokenExchangeService()  # Different keypair
        token = svc1.exchange("p1", "a1", "o1", "search")
        assert svc2.validate_jwt(token.jwt_token) is None


class TestConcurrency:
    """Test thread safety under concurrent access."""

    def test_concurrent_budget_deductions(self):
        """Multiple threads deducting from the same budget."""
        svc = BillingService()
        svc.set_budget("org-1", "agent-1", token_limit=100_000)

        errors = []

        def deduct():
            try:
                svc.report_usage("org-1", "agent-1", f"exec-{threading.current_thread().name}",
                                 tokens_used=100)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=deduct) for _ in range(50)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors
        budget = svc.get_budget("org-1", "agent-1")
        assert budget.tokens_used == 5000  # 50 threads * 100 tokens

    def test_concurrent_token_exchange(self):
        """Multiple threads exchanging tokens simultaneously."""
        svc = TokenExchangeService()
        tokens = []
        lock = threading.Lock()

        def exchange(i):
            token = svc.exchange(f"p-{i}", f"agent-{i}", "org-1", "search")
            with lock:
                tokens.append(token)

        threads = [threading.Thread(target=exchange, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(tokens) == 20
        # All tokens should be unique
        token_ids = {t.token_id for t in tokens}
        assert len(token_ids) == 20

    def test_concurrent_audit_writes(self):
        """Multiple threads writing to audit log simultaneously."""
        from agent_platform.shared.models import AuditEntry

        audit = AuditLog(max_entries=1000)
        errors = []

        def write(i):
            try:
                audit.append(AuditEntry(org_id=f"org-{i}", action="test"))
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=write, args=(i,)) for i in range(100)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors
        assert audit.count == 100

    def test_concurrent_policy_read_write(self):
        """Concurrent reads and writes to policy service."""
        svc = PolicyService()
        errors = []

        def set_policy(i):
            try:
                svc.set_policy(
                    org_id="org-1",
                    agent_id=f"agent-{i}",
                    tools=[ToolPermission(tool_name="search", effect=PolicyEffect.ALLOW)],
                )
            except Exception as e:
                errors.append(e)

        def read_policy(i):
            try:
                svc.get_effective_policy("org-1", f"agent-{i}")
            except Exception as e:
                errors.append(e)

        threads = []
        for i in range(20):
            threads.append(threading.Thread(target=set_policy, args=(i,)))
            threads.append(threading.Thread(target=read_policy, args=(i,)))
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert not errors


class TestRuntimeErrorPaths:
    """Test execution runtime error handling."""

    def test_agent_not_found_returns_structured_error(self):
        from agent_platform.control_plane.agents import AgentService
        from agent_platform.control_plane.billing import BillingService
        from agent_platform.control_plane.policy import PolicyService
        from agent_platform.shared.models import ExecutionRequest

        runtime = ExecutionRuntime(
            agent_service=AgentService(),
            policy_service=PolicyService(),
            billing_service=BillingService(),
            llm=MockLLM(),
            tool_registry=ToolRegistry(),
        )
        resp = runtime.execute(ExecutionRequest(
            agent_id="nonexistent",
            org_id="nonexistent",
            task="hello",
        ))
        assert not resp.success
        assert "AgentNotFoundError" in resp.error

    def test_no_policy_returns_structured_error(self):
        from agent_platform.control_plane.agents import AgentService
        from agent_platform.control_plane.billing import BillingService
        from agent_platform.control_plane.policy import PolicyService
        from agent_platform.shared.models import ExecutionRequest

        agent_svc = AgentService()
        org_id = "org-1"
        agent = agent_svc.register(org_id=org_id, name="test", role="executor")

        runtime = ExecutionRuntime(
            agent_service=agent_svc,
            policy_service=PolicyService(),
            billing_service=BillingService(),
            llm=MockLLM(),
            tool_registry=ToolRegistry(),
        )
        resp = runtime.execute(ExecutionRequest(
            agent_id=agent.agent_id,
            org_id=org_id,
            task="hello",
        ))
        assert not resp.success
        assert "PolicyNotFoundError" in resp.error
