"""Core data models for the agent platform."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _new_id() -> str:
    return str(uuid.uuid4())


# --- Enums ---

class AgentRole(str, Enum):
    EXECUTOR = "executor"
    PLANNER = "planner"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class PolicyEffect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"


class UsageMetricType(str, Enum):
    TOKENS = "tokens"
    TOOL_INVOCATIONS = "tool_invocations"
    EXECUTION_DURATION_MS = "execution_duration_ms"


# --- Organization ---

@dataclass
class Organization:
    name: str
    org_id: str = field(default_factory=_new_id)
    created_at: datetime = field(default_factory=_utc_now)
    metadata: dict[str, Any] = field(default_factory=dict)


# --- Agent Identity ---

@dataclass
class AgentIdentity:
    agent_id: str = field(default_factory=_new_id)
    org_id: str = ""
    name: str = ""
    role: AgentRole = AgentRole.EXECUTOR
    delegated_user_id: str | None = None
    token_claims: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utc_now)
    active: bool = True


# --- Policy ---

@dataclass
class ToolPermission:
    tool_name: str
    effect: PolicyEffect = PolicyEffect.ALLOW
    parameters_constraint: dict[str, Any] = field(default_factory=dict)


@dataclass
class Policy:
    policy_id: str = field(default_factory=_new_id)
    org_id: str = ""
    agent_id: str | None = None  # None = org-level policy
    tools: list[ToolPermission] = field(default_factory=list)
    token_limit: int = 100_000  # max tokens per execution
    execution_timeout_seconds: int = 300
    created_at: datetime = field(default_factory=_utc_now)
    updated_at: datetime = field(default_factory=_utc_now)


# --- Budget ---

@dataclass
class Budget:
    budget_id: str = field(default_factory=_new_id)
    org_id: str = ""
    agent_id: str | None = None  # None = org-level budget
    token_limit: int = 1_000_000
    tokens_used: int = 0
    tool_invocations: int = 0
    reset_period_days: int = 30
    created_at: datetime = field(default_factory=_utc_now)
    last_reset_at: datetime = field(default_factory=_utc_now)

    @property
    def tokens_remaining(self) -> int:
        return max(0, self.token_limit - self.tokens_used)

    @property
    def is_exhausted(self) -> bool:
        return self.tokens_used >= self.token_limit


# --- Usage ---

@dataclass
class UsageReport:
    report_id: str = field(default_factory=_new_id)
    org_id: str = ""
    agent_id: str = ""
    execution_id: str = ""
    tokens_used: int = 0
    tool_invocations: int = 0
    execution_duration_ms: int = 0
    tool_name: str | None = None
    timestamp: datetime = field(default_factory=_utc_now)


@dataclass
class UsageQuery:
    org_id: str | None = None
    agent_id: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None


@dataclass
class UsageSummary:
    org_id: str = ""
    agent_id: str | None = None
    total_tokens: int = 0
    total_tool_invocations: int = 0
    total_execution_duration_ms: int = 0
    report_count: int = 0


# --- Execution ---

@dataclass
class ExecutionRequest:
    agent_id: str = ""
    org_id: str = ""
    task: str = ""
    execution_id: str = field(default_factory=_new_id)
    context: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utc_now)


@dataclass
class ExecutionResponse:
    execution_id: str = ""
    agent_id: str = ""
    org_id: str = ""
    result: str = ""
    tokens_used: int = 0
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    duration_ms: int = 0
    success: bool = True
    error: str | None = None
    completed_at: datetime = field(default_factory=_utc_now)


# --- Audit ---

@dataclass
class AuditEntry:
    entry_id: str = field(default_factory=_new_id)
    org_id: str = ""
    agent_id: str = ""
    delegated_user_id: str | None = None
    execution_id: str = ""
    action: str = ""  # e.g., "tool_call", "policy_check", "budget_check"
    tool_name: str | None = None
    parameters: dict[str, Any] = field(default_factory=dict)
    result: str = ""  # "allowed", "denied", "executed", "failed"
    reason: str | None = None
    latency_ms: int = 0
    tokens_used: int = 0
    timestamp: datetime = field(default_factory=_utc_now)


# --- Policy Evaluation ---

@dataclass
class PolicyDecision:
    allowed: bool = False
    reason: str = ""
    matched_policy_id: str | None = None
    evaluated_at: datetime = field(default_factory=_utc_now)
