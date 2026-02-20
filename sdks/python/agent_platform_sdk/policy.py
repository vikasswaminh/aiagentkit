"""Policy management client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from agent_platform.proto import agent_platform_pb2 as pb2


@dataclass
class PolicyDecision:
    allowed: bool
    reason: str
    policy_id: str | None = None


class PolicyClient:
    """Client for policy CRUD and evaluation."""

    def __init__(self, stub: Any) -> None:
        self._stub = stub

    def set(
        self,
        org_id: str,
        agent_id: str | None = None,
        allowed_tools: list[str] | None = None,
        denied_tools: list[str] | None = None,
        token_limit: int = 100_000,
        timeout_seconds: int = 300,
    ) -> str:
        """Set policy. Returns policy_id."""
        tools = []
        for t in (allowed_tools or []):
            tools.append(pb2.ToolPermissionProto(tool_name=t, effect="allow"))
        for t in (denied_tools or []):
            tools.append(pb2.ToolPermissionProto(tool_name=t, effect="deny"))

        resp = self._stub.SetPolicy(
            pb2.SetPolicyRequest(
                org_id=org_id,
                agent_id=agent_id or "",
                tools=tools,
                token_limit=token_limit,
                execution_timeout_seconds=timeout_seconds,
            )
        )
        return resp.policy_id

    def evaluate(
        self,
        org_id: str,
        agent_id: str,
        tool_name: str,
        estimated_tokens: int = 0,
    ) -> PolicyDecision:
        resp = self._stub.EvaluatePolicy(
            pb2.EvaluatePolicyRequest(
                org_id=org_id,
                agent_id=agent_id,
                tool_name=tool_name,
                estimated_tokens=estimated_tokens,
            )
        )
        return PolicyDecision(
            allowed=resp.allowed,
            reason=resp.reason,
            policy_id=resp.matched_policy_id or None,
        )
