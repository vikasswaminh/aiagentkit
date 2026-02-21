"""Policy management service with hierarchical merge (agent < org)."""

from __future__ import annotations

import json
import time
from dataclasses import replace
from datetime import datetime, timezone
from typing import Any

from agent_platform.shared.exceptions import ServiceUnavailableError
from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import (
    Policy,
    PolicyDecision,
    PolicyEffect,
    ToolPermission,
    _new_id,
)
from agent_platform.shared.store import InMemoryStore, Store

log = get_logger()


def _policy_key(org_id: str, agent_id: str | None = None) -> str:
    if agent_id:
        return f"{org_id}:agent:{agent_id}"
    return f"{org_id}:org"


class PolicyService:
    """Policy CRUD and evaluation with hierarchical merge."""

    def __init__(
        self,
        store: Store[Policy] | None = None,
        opa_adapter: OPAAdapter | None = None,
    ) -> None:
        self._store: Store[Policy] = store or InMemoryStore()
        self._opa = opa_adapter

    def set_policy(
        self,
        org_id: str,
        agent_id: str | None = None,
        tools: list[ToolPermission] | None = None,
        token_limit: int = 100_000,
        execution_timeout_seconds: int = 300,
    ) -> Policy:
        key = _policy_key(org_id, agent_id)
        existing = self._store.get(key)

        policy = Policy(
            policy_id=existing.policy_id if existing else _new_id(),
            org_id=org_id,
            agent_id=agent_id,
            tools=tools or [],
            token_limit=token_limit,
            execution_timeout_seconds=execution_timeout_seconds,
        )
        if existing:
            policy = replace(policy, updated_at=datetime.now(timezone.utc))

        self._store.put(key, policy)

        # Push to OPA if adapter is configured
        if self._opa:
            policy_name = f"agent_platform.policy.{org_id.replace('-', '_')}"
            if agent_id:
                policy_name += f".{agent_id.replace('-', '_')}"
            rego = self._opa.policy_to_rego(policy)
            self._opa.push_policy(policy_name, rego)

        scope = f"agent:{agent_id}" if agent_id else "org"
        log.info("policy_set", org_id=org_id, scope=scope, policy_id=policy.policy_id)
        return policy

    def get_policy(self, org_id: str, agent_id: str | None = None) -> Policy | None:
        return self._store.get(_policy_key(org_id, agent_id))

    def get_effective_policy(self, org_id: str, agent_id: str) -> Policy | None:
        """Get merged policy: agent-level overrides org-level."""
        org_policy = self._store.get(_policy_key(org_id))
        agent_policy = self._store.get(_policy_key(org_id, agent_id))

        if agent_policy and org_policy:
            return self._merge_policies(org_policy, agent_policy)
        return agent_policy or org_policy

    def evaluate(
        self,
        org_id: str,
        agent_id: str,
        tool_name: str,
        estimated_tokens: int = 0,
        context: dict[str, Any] | None = None,
    ) -> PolicyDecision:
        """Evaluate whether an action is allowed by policy."""
        # If OPA is configured, delegate to OPA
        if self._opa:
            policy_name = f"agent_platform.policy.{org_id.replace('-', '_')}"
            input_data = {
                "org_id": org_id,
                "agent_id": agent_id,
                "tool_name": tool_name,
                "estimated_tokens": estimated_tokens,
            }
            if context:
                input_data["context"] = context
            return self._opa.evaluate(policy_name, input_data)

        # Local evaluation
        policy = self.get_effective_policy(org_id, agent_id)

        if policy is None:
            return PolicyDecision(
                allowed=False,
                reason="no policy found for org/agent",
            )

        # Check token limit
        if estimated_tokens > policy.token_limit:
            return PolicyDecision(
                allowed=False,
                reason=f"estimated tokens {estimated_tokens} exceeds limit {policy.token_limit}",
                matched_policy_id=policy.policy_id,
            )

        # Check tool permissions
        return self._evaluate_tool_permission(policy, tool_name)

    def _evaluate_tool_permission(
        self, policy: Policy, tool_name: str
    ) -> PolicyDecision:
        """Check if a tool is allowed by the policy."""
        # Explicit deny takes precedence
        for perm in policy.tools:
            if perm.tool_name == tool_name and perm.effect == PolicyEffect.DENY:
                return PolicyDecision(
                    allowed=False,
                    reason=f"tool '{tool_name}' explicitly denied",
                    matched_policy_id=policy.policy_id,
                )

        # Check for explicit allow
        for perm in policy.tools:
            if perm.tool_name == tool_name and perm.effect == PolicyEffect.ALLOW:
                return PolicyDecision(
                    allowed=True,
                    reason=f"tool '{tool_name}' explicitly allowed",
                    matched_policy_id=policy.policy_id,
                )

        # Wildcard allow
        for perm in policy.tools:
            if perm.tool_name == "*" and perm.effect == PolicyEffect.ALLOW:
                return PolicyDecision(
                    allowed=True,
                    reason="wildcard allow",
                    matched_policy_id=policy.policy_id,
                )

        # Default deny
        return PolicyDecision(
            allowed=False,
            reason=f"tool '{tool_name}' not in allowed list (default deny)",
            matched_policy_id=policy.policy_id,
        )

    def _merge_policies(self, org: Policy, agent: Policy) -> Policy:
        """Merge org and agent policies. Agent overrides org, but org deny wins."""
        org_denied = {
            p.tool_name for p in org.tools if p.effect == PolicyEffect.DENY
        }
        merged_tools = list(org.tools)
        for perm in agent.tools:
            if perm.tool_name not in org_denied:
                merged_tools = [
                    t for t in merged_tools if t.tool_name != perm.tool_name
                ]
                merged_tools.append(perm)

        return Policy(
            policy_id=agent.policy_id,
            org_id=org.org_id,
            agent_id=agent.agent_id,
            tools=merged_tools,
            token_limit=min(org.token_limit, agent.token_limit),
            execution_timeout_seconds=min(
                org.execution_timeout_seconds, agent.execution_timeout_seconds
            ),
        )


class OPAAdapter:
    """Adapter to translate governance rules to OPA Rego and evaluate via REST.

    Includes a circuit breaker: after `failure_threshold` consecutive failures,
    the circuit opens for `reset_timeout_seconds` before allowing another attempt.
    """

    def __init__(
        self,
        opa_url: str = "http://localhost:8181",
        failure_threshold: int = 3,
        reset_timeout_seconds: float = 30.0,
    ) -> None:
        self._opa_url = opa_url
        self._client: Any = None
        # Circuit breaker state
        self._failure_count = 0
        self._failure_threshold = failure_threshold
        self._reset_timeout = reset_timeout_seconds
        self._circuit_open_until: float = 0.0

    def _get_client(self) -> Any:
        """Lazily create and reuse a synchronous httpx client."""
        if self._client is None:
            import httpx
            self._client = httpx.Client(timeout=10.0)
        return self._client

    def _check_circuit(self) -> None:
        """Raise ServiceUnavailableError if circuit breaker is open."""
        if self._failure_count >= self._failure_threshold:
            if time.time() < self._circuit_open_until:
                raise ServiceUnavailableError(
                    "OPA",
                    f"circuit breaker open after {self._failure_count} failures, "
                    f"retry after {self._circuit_open_until - time.time():.0f}s",
                )
            # Reset for half-open state
            self._failure_count = 0

    def _record_failure(self) -> None:
        self._failure_count += 1
        if self._failure_count >= self._failure_threshold:
            self._circuit_open_until = time.time() + self._reset_timeout
            log.error(
                "opa_circuit_breaker_opened",
                failure_count=self._failure_count,
                reset_after_seconds=self._reset_timeout,
            )

    def _record_success(self) -> None:
        self._failure_count = 0

    def policy_to_rego(self, policy: Policy) -> str:
        """Generate Rego policy from a Policy dataclass."""
        lines = [
            f'package agent_platform.policy.{policy.org_id.replace("-", "_")}',
            "",
            "default allow := false",
            "",
            f"token_limit := {policy.token_limit}",
            f"execution_timeout := {policy.execution_timeout_seconds}",
            "",
        ]

        allowed_tools = [
            p.tool_name for p in policy.tools if p.effect == PolicyEffect.ALLOW
        ]
        denied_tools = [
            p.tool_name for p in policy.tools if p.effect == PolicyEffect.DENY
        ]

        if denied_tools:
            lines.append(f"denied_tools := {json.dumps(denied_tools)}")
            lines.append("")
            lines.append("deny if {")
            lines.append("    input.tool_name == denied_tools[_]")
            lines.append("}")
            lines.append("")

        if allowed_tools:
            if "*" in allowed_tools:
                lines.append("allow if {")
                lines.append("    not deny")
                lines.append("}")
            else:
                lines.append(f"allowed_tools := {json.dumps(allowed_tools)}")
                lines.append("")
                lines.append("allow if {")
                lines.append("    input.tool_name == allowed_tools[_]")
                lines.append("    not deny")
                lines.append("}")

        lines.append("")
        lines.append("allow if {")
        lines.append("    input.estimated_tokens <= token_limit")
        lines.append("}")

        return "\n".join(lines)

    def push_policy(self, policy_name: str, rego_content: str) -> bool:
        """Push a Rego policy to OPA via REST API."""
        self._check_circuit()
        client = self._get_client()
        url = f"{self._opa_url}/v1/policies/{policy_name}"
        try:
            resp = client.put(
                url,
                content=rego_content,
                headers={"Content-Type": "text/plain"},
            )
            if resp.status_code == 200:
                self._record_success()
                return True
            self._record_failure()
            log.error("opa_push_failed", policy=policy_name, status=resp.status_code)
            return False
        except Exception as e:
            self._record_failure()
            log.error("opa_push_error", policy=policy_name, error=str(e))
            raise ServiceUnavailableError("OPA", str(e)) from e

    def evaluate(
        self,
        policy_name: str,
        input_data: dict[str, Any],
    ) -> PolicyDecision:
        """Evaluate a policy decision via OPA REST API.

        Raises ServiceUnavailableError if OPA is unreachable (with circuit breaker).
        """
        self._check_circuit()
        client = self._get_client()
        url = f"{self._opa_url}/v1/data/{policy_name}/allow"
        try:
            resp = client.post(url, json={"input": input_data})
            if resp.status_code == 200:
                self._record_success()
                result = resp.json()
                allowed = result.get("result", False)
                return PolicyDecision(
                    allowed=allowed,
                    reason="opa_evaluation",
                )
            self._record_failure()
            raise ServiceUnavailableError("OPA", f"HTTP {resp.status_code}")
        except ServiceUnavailableError:
            raise
        except Exception as e:
            self._record_failure()
            log.error("opa_evaluation_failed", policy=policy_name, error=str(e))
            raise ServiceUnavailableError("OPA", str(e)) from e

    def close(self) -> None:
        """Close the underlying HTTP client."""
        if self._client is not None:
            self._client.close()
            self._client = None
