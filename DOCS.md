# Agent Platform SDK — 360-Degree Documentation

> **Version:** 0.1.0 | **License:** MIT | **Python:** >=3.11 | **Protocol:** gRPC + Protobuf

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Core Concepts](#3-core-concepts)
4. [Module Reference](#4-module-reference)
5. [gRPC API Reference](#5-grpc-api-reference)
6. [Data Models](#6-data-models)
7. [Execution Flow](#7-execution-flow)
8. [Policy Engine Deep Dive](#8-policy-engine-deep-dive)
9. [Budget & Billing Engine](#9-budget--billing-engine)
10. [Gateway Layer](#10-gateway-layer)
11. [Security Architecture](#11-security-architecture)
12. [Python SDK](#12-python-sdk)
13. [CLI Reference](#13-cli-reference)
14. [Deployment Guide](#14-deployment-guide)
15. [Testing](#15-testing)
16. [Configuration Reference](#16-configuration-reference)
17. [Standards Compliance](#17-standards-compliance)
18. [Project Structure](#18-project-structure)
19. [Dependencies](#19-dependencies)
20. [Known Limitations & Roadmap](#20-known-limitations--roadmap)

---

## 1. Executive Summary

Agent Platform SDK is an **IAM (Identity and Access Management) system purpose-built for AI agents**. It solves the governance problem that emerges when enterprises deploy fleets of LLM-powered agents: Who is this agent? What is it allowed to do? How much can it spend? Who authorized it?

The platform provides five capabilities:

| Capability | What It Does |
|---|---|
| **Agent Identity** | Register agents with org-scoped identities, roles, and human delegation bindings |
| **Policy Engine** | Define tool-level allow/deny rules with hierarchical merge (org deny overrides agent allow) |
| **Budget Management** | Per-agent and per-org token budgets with pre-flight checks and post-flight deductions |
| **MCP Authorization Proxy** | Intercept Model Context Protocol tool calls, enforce policy + budget before forwarding |
| **Audit Trail** | Append-only log of every agent action with full delegation chain (user -> agent -> tool) |

The system runs as two gRPC microservices:
- **Control Plane** (port 50051) — Stateful. Manages identity, policy, budgets, audit.
- **Execution Worker** (port 50052) — Stateless. Executes tasks with full governance enforcement.

---

## 2. Architecture Overview

```
                    ┌──────────────────────────────────────────────────────────┐
                    │                    CONTROL PLANE (:50051)                 │
                    │                                                          │
                    │  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐   │
                    │  │ OrgService  │  │AgentService  │  │ PolicyService  │   │
                    │  │ CRUD orgs   │  │register,     │  │ set, evaluate, │   │
                    │  │ multi-tenant│  │deactivate,   │  │ merge, OPA     │   │
                    │  └──────┬──────┘  │lifecycle     │  └───────┬────────┘   │
                    │         │         └──────┬───────┘          │            │
                    │         │                │                  │            │
                    │  ┌──────▼────────────────▼──────────────────▼─────────┐  │
                    │  │              BillingService                         │  │
                    │  │  set_budget, check_budget, report_usage, get_usage │  │
                    │  └──────────────────────┬────────────────────────────┘  │
                    │                         │                               │
                    │  ┌──────────────────────▼────────────────────────────┐  │
                    │  │          ControlPlaneServicer (gRPC)               │  │
                    │  │  19 RPCs · APIKeyInterceptor · AuditLog            │  │
                    │  └───────────────────────────────────────────────────┘  │
                    └──────────────────────┬───────────────────────────────────┘
                                           │ gRPC
                    ┌──────────────────────▼───────────────────────────────────┐
                    │                 EXECUTION WORKER (:50052)                 │
                    │                                                          │
                    │  ┌─────────────────────────────────────────────────────┐ │
                    │  │                ExecutionRuntime                      │ │
                    │  │  validate agent → check policy → check budget       │ │
                    │  │  → call LLM → execute tools → report usage → audit  │ │
                    │  └───────────┬──────────────┬──────────────┬──────────┘ │
                    │              │              │              │            │
                    │  ┌───────────▼──┐  ┌───────▼────┐  ┌─────▼──────────┐ │
                    │  │  BaseLLM     │  │ToolRegistry│  │ MCPAuthProxy   │ │
                    │  │  (pluggable) │  │ + SSRF     │  │ policy+budget  │ │
                    │  └──────────────┘  └────────────┘  │ enforcement    │ │
                    │                                     └────────────────┘ │
                    └──────────────────────────────────────────────────────────┘
                                           │
               ┌───────────────────────────┼───────────────────────────┐
               ▼                           ▼                           ▼
        ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
        │   OPA        │          │  PostgreSQL   │          │  MCP Tool    │
        │   (Rego)     │          │  (optional)   │          │  Servers     │
        │   :8181      │          │  :5432        │          │              │
        └──────────────┘          └──────────────┘          └──────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| gRPC over REST | Type-safe contracts, code generation for all SDKs, efficient binary protocol |
| Synchronous Python | Simpler debugging, thread-safe with RLock, avoids asyncio complexity |
| Store[T] interface | Swap backends (InMemory -> Postgres -> Redis) without changing service code |
| Hierarchical policy merge | Enterprise requirement: org-level deny must override agent-level allow |
| Stateless workers | Horizontal scaling — workers call control plane via gRPC for all state |

---

## 3. Core Concepts

### 3.1 Organizations

Organizations are the **multi-tenancy boundary**. Every agent, policy, and budget belongs to exactly one org. Cross-org access is impossible by design.

```
Organization
├── org_id: UUID
├── name: string
├── metadata: dict (extensible)
└── created_at: datetime (UTC)
```

### 3.2 Agent Identity

An agent is a registered identity within an organization. Agents have:

- **Role** — `executor`, `planner`, `reviewer`, or `admin`
- **Delegation** — Optional `delegated_user_id` linking the agent to a human user
- **Lifecycle** — Agents can be deactivated (soft delete); inactive agents cannot execute tasks
- **Token Claims** — Extensible key-value metadata for custom authorization logic

```
AgentIdentity
├── agent_id: UUID
├── org_id: string (FK → Organization)
├── name: string
├── role: AgentRole enum
├── delegated_user_id: string | None
├── token_claims: dict
├── active: bool
└── created_at: datetime (UTC)
```

### 3.3 Policy

Policies define **what tools an agent can use** and **how many tokens it can consume per execution**. Policies exist at two levels:

- **Org-level** — Baseline for all agents in the org
- **Agent-level** — Overrides for specific agents

**Merge rule:** Org-level DENY always wins. Agent-level cannot override an org-level deny. Token limits use `min(org_limit, agent_limit)`.

```
Policy
├── policy_id: UUID
├── org_id: string
├── agent_id: string | None (None = org-level)
├── tools: list[ToolPermission]
│   ├── tool_name: string ("*" = wildcard)
│   └── effect: ALLOW | DENY
├── token_limit: int (per execution)
├── execution_timeout_seconds: int
├── created_at: datetime
└── updated_at: datetime
```

### 3.4 Budget

Budgets track **cumulative token consumption** and enforce spend limits. They exist at both org and agent level.

```
Budget
├── budget_id: UUID
├── org_id: string
├── agent_id: string | None (None = org-level)
├── token_limit: int (total allocation)
├── tokens_used: int (running total)
├── tokens_remaining: int (computed: limit - used)
├── tool_invocations: int (count)
├── reset_period_days: int
├── created_at: datetime
└── last_reset_at: datetime
```

### 3.5 Audit Entry

Every significant action generates an immutable audit entry. Entries cannot be modified or deleted.

```
AuditEntry
├── entry_id: UUID
├── org_id, agent_id, delegated_user_id
├── execution_id: string (links entries in same execution)
├── action: string (tool_call, policy_check, execution_complete)
├── tool_name: string | None
├── parameters: dict
├── result: string (allowed, denied, executed, failed)
├── reason: string | None
├── latency_ms: int
├── tokens_used: int
└── timestamp: datetime (UTC)
```

---

## 4. Module Reference

### 4.1 Control Plane (`agent_platform/control_plane/`)

| Module | Class | Responsibility |
|---|---|---|
| `orgs.py` | `OrgService` | Organization CRUD. Stateless; delegates to `Store[Organization]`. |
| `agents.py` | `AgentService` | Agent registration, lookup (by org+id or global scan), deactivation. |
| `policy.py` | `PolicyService` | Policy set/get, hierarchical merge, tool permission evaluation. |
| `policy.py` | `OPAAdapter` | Translates Policy objects to Rego, evaluates via OPA REST API. Synchronous httpx with lazy client reuse. |
| `billing.py` | `BillingService` | Budget CRUD, pre-flight budget checks, post-flight deductions, usage aggregation. Thread-safe with `RLock`. |
| `server.py` | `ControlPlaneServicer` | gRPC servicer implementing 19 RPCs. Wires all services. |
| `server.py` | `APIKeyInterceptor` | gRPC interceptor for API key authentication via `x-api-key` metadata. |

### 4.2 Execution Engine (`agent_platform/execution/`)

| Module | Class | Responsibility |
|---|---|---|
| `runtime.py` | `ExecutionRuntime` | Full governance pipeline: validate -> policy -> budget -> LLM -> tools -> usage -> audit. |
| `llm.py` | `BaseLLM` (ABC) | Abstract LLM interface. `complete(request) -> response`. |
| `llm.py` | `MockLLM` | Test implementation. Returns canned responses. Simulates tool calls on "use tool" keyword. |
| `tools.py` | `BaseTool` (ABC) | Abstract tool interface. `execute(**kwargs) -> Any`. |
| `tools.py` | `ToolRegistry` | Tool discovery and execution. Stores tools by name. |
| `tools.py` | `HTTPTool` | Built-in HTTP request tool with SSRF protection. |
| `tools.py` | `MockTool` | Test tool returning canned responses. |
| `memory.py` | `BaseMemory` (ABC) | Agent-scoped key-value memory interface. |
| `memory.py` | `InMemoryStorage` | Thread-safe in-memory implementation. |
| `worker.py` | `ExecutionServicer` | gRPC servicer for `ExecuteTask` RPC. |

### 4.3 Gateway (`agent_platform/gateway/`)

| Module | Class | Responsibility |
|---|---|---|
| `mcp_proxy.py` | `MCPAuthorizationProxy` | Sits between agents and MCP tool servers. Policy + budget enforcement on every call. Emits audit entries. |
| `token_exchange.py` | `TokenExchangeService` | RFC 8693 token exchange. Narrow broad agent tokens to tool-scoped, time-limited tokens. Thread-safe with capacity bounds. |
| `audit.py` | `AuditLog` | Append-only audit log. Query by org/agent/execution/action with pagination. Thread-safe. |

### 4.4 Shared (`agent_platform/shared/`)

| Module | Class/Function | Responsibility |
|---|---|---|
| `models.py` | All dataclasses | Core data models (Organization, AgentIdentity, Policy, Budget, UsageReport, AuditEntry, etc.) |
| `store.py` | `Store[T]` (ABC) | Abstract key-value store interface. |
| `store.py` | `InMemoryStore[T]` | Thread-safe dict-backed implementation. |
| `logging.py` | `configure_logging()` | Structured JSON logging via structlog with contextvars. |
| `logging.py` | `bind_context()` / `clear_context()` | Bind org_id, agent_id, execution_id to log context. |

---

## 5. gRPC API Reference

### 5.1 ControlPlane Service (port 50051)

**19 RPCs** across 6 domains:

#### Organization Management

| RPC | Request | Response | Description |
|---|---|---|---|
| `CreateOrganization` | `CreateOrgRequest{name, metadata}` | `OrganizationProto` | Create a new org |
| `GetOrganization` | `GetOrgRequest{org_id}` | `OrganizationProto` | Get org by ID |
| `ListOrganizations` | `ListOrgsRequest{}` | `ListOrgsResponse` | List all orgs |
| `DeleteOrganization` | `DeleteOrgRequest{org_id}` | `DeleteOrgResponse{success}` | Delete an org |

#### Agent Identity Management

| RPC | Request | Response | Description |
|---|---|---|---|
| `RegisterAgent` | `RegisterAgentRequest{org_id, name, role, delegated_user_id, token_claims}` | `AgentIdentityProto` | Register agent in org |
| `GetAgent` | `GetAgentRequest{org_id, agent_id}` | `AgentIdentityProto` | Get agent by org+id |
| `ListAgents` | `ListAgentsRequest{org_id}` | `ListAgentsResponse` | List agents in org |
| `DeactivateAgent` | `DeactivateAgentRequest{org_id, agent_id}` | `DeactivateAgentResponse{success}` | Soft-delete agent |

#### Policy Management

| RPC | Request | Response | Description |
|---|---|---|---|
| `SetPolicy` | `SetPolicyRequest{org_id, agent_id?, tools[], token_limit, timeout}` | `PolicyProto` | Set org or agent policy |
| `GetPolicy` | `GetPolicyRequest{org_id, agent_id?}` | `PolicyProto` | Get effective policy |
| `EvaluatePolicy` | `EvaluatePolicyRequest{org_id, agent_id, tool_name, estimated_tokens}` | `PolicyDecisionProto{allowed, reason}` | Check if action is allowed |

#### Budget Management

| RPC | Request | Response | Description |
|---|---|---|---|
| `SetBudget` | `SetBudgetRequest{org_id, agent_id?, token_limit, reset_period_days}` | `BudgetProto` | Set org or agent budget |
| `GetBudget` | `GetBudgetRequest{org_id, agent_id?}` | `BudgetProto` | Get current budget state |
| `CheckBudget` | `CheckBudgetRequest{org_id, agent_id, estimated_tokens}` | `CheckBudgetResponse{allowed, remaining, reason}` | Pre-flight budget check |

#### Usage Tracking

| RPC | Request | Response | Description |
|---|---|---|---|
| `ReportUsage` | `ReportUsageRequest{org_id, agent_id, execution_id, tokens_used, ...}` | `ReportUsageResponse{success, remaining}` | Record usage + deduct |
| `GetUsage` | `GetUsageRequest{org_id, agent_id?, time_range?}` | `UsageSummaryProto` | Aggregate usage stats |

#### Audit

| RPC | Request | Response | Description |
|---|---|---|---|
| `GetAuditLog` | `GetAuditLogRequest{org_id?, agent_id?, limit?}` | `GetAuditLogResponse{entries[]}` | Query audit entries |

### 5.2 ExecutionService (port 50052)

| RPC | Request | Response | Description |
|---|---|---|---|
| `ExecuteTask` | `ExecuteTaskRequest{agent_id, org_id, task, context}` | `ExecuteTaskResponse{result, tokens_used, tool_calls[], success, error}` | Execute a governed task |

### 5.3 Authentication

Set the `AP_API_KEY` environment variable on the control plane. Clients must pass the key as `x-api-key` gRPC metadata on every call. If `AP_API_KEY` is empty/unset, authentication is disabled.

```python
# Client-side
metadata = [("x-api-key", "your-api-key")]
stub.CreateOrganization(request, metadata=metadata)
```

### 5.4 Error Codes

| gRPC Code | When |
|---|---|
| `NOT_FOUND` | Org, agent, policy, or budget doesn't exist |
| `UNAUTHENTICATED` | Missing or invalid API key |

---

## 6. Data Models

All models are Python dataclasses in `agent_platform/shared/models.py`.

### Enums

```python
class AgentRole(str, Enum):
    EXECUTOR = "executor"     # Can execute tasks and use tools
    PLANNER = "planner"       # Can plan but not directly execute
    REVIEWER = "reviewer"     # Can review outputs
    ADMIN = "admin"           # Full administrative access

class PolicyEffect(str, Enum):
    ALLOW = "allow"
    DENY = "deny"

class UsageMetricType(str, Enum):
    TOKENS = "tokens"
    TOOL_INVOCATIONS = "tool_invocations"
    EXECUTION_DURATION_MS = "execution_duration_ms"
```

### Entity Relationships

```
Organization (1) ──────── (*) AgentIdentity
     │                           │
     │                           │
     ├── (*) Policy              ├── (*) Policy (agent-level)
     │       │                   │
     │       └── (*) ToolPermission
     │
     ├── (*) Budget              ├── (*) Budget (agent-level)
     │
     └── (*) UsageReport ────────┘
                │
                └── AuditEntry (append-only)
```

---

## 7. Execution Flow

When `ExecuteTask` is called, the `ExecutionRuntime` orchestrates this pipeline:

```
Step 1: VALIDATE AGENT
  ├── Look up agent by (org_id, agent_id)
  ├── Fall back to global lookup by agent_id alone
  └── Reject if not found or inactive

Step 2: CHECK POLICY
  ├── Fetch org-level policy
  ├── Fetch agent-level policy (if exists)
  ├── Merge: org deny overrides agent allow
  ├── Token limit = min(org_limit, agent_limit)
  └── Reject if no policy configured

Step 3: PRE-FLIGHT BUDGET CHECK
  ├── Check agent budget (if set)
  ├── Check org budget (if set)
  └── Reject if either budget insufficient

Step 4: CALL LLM
  ├── Send task to configured LLM provider
  └── Receive response (content + optional tool_calls)

Step 5: EXECUTE TOOL CALLS (if any)
  ├── For each tool_call from LLM:
  │   ├── MCPAuthorizationProxy.execute()
  │   │   ├── Policy check (is tool allowed?)
  │   │   ├── Budget check (sufficient tokens?)
  │   │   ├── Execute tool handler
  │   │   ├── Report usage
  │   │   └── Emit audit entry
  │   └── Collect results
  └── Return tool results

Step 6: REPORT USAGE
  ├── Deduct tokens from agent budget
  └── Deduct tokens from org budget

Step 7: EMIT AUDIT
  ├── Log execution_complete entry
  └── Include tokens_used, duration, tool_calls count

Step 8: RETURN RESPONSE
  └── ExecutionResponse{success, result, tokens_used, tool_calls, duration_ms}
```

---

## 8. Policy Engine Deep Dive

### 8.1 Evaluation Algorithm

```
evaluate(org_id, agent_id, tool_name, estimated_tokens):
  1. Merge org + agent policies → effective policy
  2. If estimated_tokens > effective.token_limit → DENY
  3. For each tool permission in effective.tools:
     a. If tool_name matches AND effect=DENY → DENY (deny-first)
     b. If tool_name matches AND effect=ALLOW → ALLOW
     c. If wildcard "*" AND effect=ALLOW → ALLOW
  4. Default → DENY (closed by default)
```

### 8.2 Hierarchical Merge

```python
def _merge_policies(org_policy, agent_policy):
    org_denied = {tools denied at org level}

    merged_tools = org_policy.tools  # start with org baseline

    for perm in agent_policy.tools:
        if perm.tool_name NOT in org_denied:
            # Agent can override org ALLOW, but NOT org DENY
            replace org permission with agent permission

    return Policy(
        tools=merged_tools,
        token_limit=min(org.token_limit, agent.token_limit),
        timeout=min(org.timeout, agent.timeout),
    )
```

**Example:**

| Org Policy | Agent Policy | Effective |
|---|---|---|
| `shell` = DENY | `shell` = ALLOW | `shell` = **DENY** (org wins) |
| `*` = ALLOW | `search` = ALLOW | `search` = ALLOW, `*` = ALLOW, `shell` = DENY |
| token_limit = 200k | token_limit = 50k | token_limit = **50k** (min) |
| token_limit = 10k | token_limit = 100k | token_limit = **10k** (min) |

### 8.3 OPA Integration

The `OPAAdapter` translates Python policies to Rego and evaluates via OPA's REST API.

**Generated Rego example:**

```rego
package agent_platform.policy.acme_corp

default allow := false

token_limit := 50000
execution_timeout := 300

denied_tools := ["shell"]

deny if {
    input.tool_name == denied_tools[_]
}

allowed_tools := ["search", "calculator"]

allow if {
    input.tool_name == allowed_tools[_]
    not deny
}

allow if {
    input.estimated_tokens <= token_limit
}
```

**OPA evaluation flow:**

```
PolicyService.evaluate()
  └── If OPAAdapter configured:
      ├── POST /v1/data/{policy_name}/allow with input
      └── Parse result.allowed
      └── On failure: fall back to local evaluation
```

---

## 9. Budget & Billing Engine

### 9.1 Two-Level Budget Hierarchy

```
Organization Budget (org-level)
├── token_limit: 1,000,000 (total allocation for org)
├── tokens_used: running total across ALL agents
└── tool_invocations: count across ALL agents

Agent Budget (agent-level)
├── token_limit: 100,000 (allocation for this agent)
├── tokens_used: running total for this agent
└── tool_invocations: count for this agent
```

### 9.2 Pre-Flight Check

```
check_budget(org_id, agent_id, estimated_tokens):
  1. Check agent budget: remaining >= estimated_tokens?
  2. Check org budget: remaining >= estimated_tokens?
  3. Both must pass → ALLOW
  4. Either fails → DENY with reason
```

### 9.3 Post-Flight Deduction

```
report_usage(org_id, agent_id, tokens_used):
  1. Validate tokens_used >= 0
  2. Store usage report (thread-safe)
  3. Deduct from agent budget
  4. Deduct from org budget
  5. Return agent tokens_remaining
```

### 9.4 Usage Aggregation

`get_usage(query)` filters all stored usage reports by org, agent, and time range, then aggregates:
- `total_tokens` — Sum of all tokens consumed
- `total_tool_invocations` — Count of tool calls
- `total_execution_duration_ms` — Sum of execution times
- `report_count` — Number of usage reports

---

## 10. Gateway Layer

### 10.1 MCP Authorization Proxy

The `MCPAuthorizationProxy` wraps tool execution with governance:

```
MCPAuthorizationProxy.execute(request):
  1. Policy check → Is this tool allowed for this agent?
     └── DENY → return error + audit "denied"
  2. Budget check → Does agent have remaining budget?
     └── DENY → return error + audit "denied"
  3. Tool lookup → Is this tool registered?
     └── NOT FOUND → return error + audit "failed"
  4. Execute tool handler
     └── EXCEPTION → return error + audit "failed"
  5. Report usage to billing
  6. Audit "executed"
  7. Return result
```

### 10.2 Token Exchange (RFC 8693)

Exchanges broad agent tokens for narrow, tool-scoped tokens:

```python
token = exchange_service.exchange(
    parent_token_id="broad-agent-token",
    agent_id="agent-123",
    org_id="org-456",
    tool_name="search",
    ttl_seconds=300,  # 5 minute expiry
)
# token.scopes = ["tool:search:execute"]
# token.expires_at = now + 300s
```

**Thread safety:** All operations protected by `threading.RLock`.
**Capacity bound:** Max 10,000 active tokens. Auto-cleanup on capacity hit.

### 10.3 Audit Log

Append-only. Entries cannot be modified or deleted.

**Query API:**
```python
entries = audit_log.query(
    org_id="org-456",       # optional filter
    agent_id="agent-123",   # optional filter
    action="tool_call",     # optional filter
    limit=100,              # max entries returned
)
# Returns newest-first
```

**Delegation chain:** All entries in an execution share the same `execution_id`, allowing full chain reconstruction:
```python
chain = audit_log.get_delegation_chain("exec-789")
# [policy_check, tool_call(search), tool_call(calculator), execution_complete]
```

---

## 11. Security Architecture

### 11.1 Authentication

| Layer | Mechanism |
|---|---|
| gRPC Control Plane | API key via `x-api-key` metadata (`AP_API_KEY` env var) |
| Agent Identity | Token claims on registered agent identity |
| Tool Access | Per-tool policy evaluation on every call |
| Token Scoping | RFC 8693 exchange narrows broad tokens to tool-scoped |

### 11.2 SSRF Protection

The `HTTPTool` blocks requests to:

| Target | Blocked |
|---|---|
| Private IPs | `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` |
| Loopback | `127.0.0.0/8` |
| Link-local | `169.254.0.0/16` |
| Cloud metadata | `169.254.169.254`, `metadata.google.internal` |

Additionally: `follow_redirects=False` prevents redirect-based SSRF bypass.

### 11.3 Cross-Org Isolation

- Agents are keyed by `{org_id}:{agent_id}`
- Policies are keyed by `{org_id}:org` or `{org_id}:agent:{agent_id}`
- Budget keys follow the same pattern
- No API allows cross-org lookups except `get_by_id()` (global agent scan, used only internally)

### 11.4 Thread Safety

All mutable services use `threading.RLock`:

| Service | Protected State |
|---|---|
| `InMemoryStore` | `_data` dict |
| `BillingService` | Budget reads/writes, usage report storage |
| `TokenExchangeService` | Active tokens dict |
| `AuditLog` | Entries list |

### 11.5 Input Validation

- Negative `tokens_used` rejected with `ValueError`
- gRPC abort returns empty protobuf after aborting (prevents None dereference)
- Tool names validated against policy before execution
- Budget checks happen before any LLM call or tool execution

---

## 12. Python SDK

### 12.1 Installation

```bash
pip install agent-platform-sdk
```

### 12.2 Client Usage

```python
from agent_platform_sdk import AgentPlatformClient

# Context manager for automatic cleanup
with AgentPlatformClient("localhost:50051") as client:

    # Create organization
    org = client.orgs.create("acme-corp")

    # Register agent
    agent = client.agents.register(
        org.org_id, "research-bot",
        role="executor",
        delegated_user_id="user-jane",
    )

    # Set policy
    client.policy.set(
        org.org_id, agent.agent_id,
        allowed_tools=["search", "calculator"],
        denied_tools=["shell"],
        token_limit=50_000,
    )

    # Set budget
    client.budget.set(org.org_id, agent.agent_id, token_limit=100_000)

    # Evaluate policy
    decision = client.policy.evaluate(org.org_id, agent.agent_id, "search")
    print(f"Allowed: {decision.allowed}, Reason: {decision.reason}")

    # Check budget
    result = client.budget.check(org.org_id, agent.agent_id, 5_000)
    print(f"Budget OK: {result.allowed}, Remaining: {result.tokens_remaining}")

    # Get usage
    usage = client.budget.get_usage(org.org_id, agent.agent_id)
    print(f"Total tokens: {usage.total_tokens}")
```

### 12.3 SDK Sub-Clients

| Sub-Client | Methods |
|---|---|
| `client.orgs` | `create(name)`, `list()`, `get(org_id)`, `delete(org_id)` |
| `client.agents` | `register(org_id, name, role, delegated_user_id)`, `list(org_id)`, `get(org_id, agent_id)`, `deactivate(org_id, agent_id)` |
| `client.policy` | `set(org_id, agent_id?, allowed_tools, denied_tools, token_limit)`, `evaluate(org_id, agent_id, tool_name, tokens)`, `get(org_id, agent_id?)` |
| `client.budget` | `set(org_id, agent_id?, token_limit, reset_days)`, `check(org_id, agent_id, tokens)`, `get(org_id, agent_id?)`, `get_usage(org_id, agent_id?)` |

---

## 13. CLI Reference

```bash
# General
agentctl --address localhost:50051 <command>

# Organizations
agentctl orgs create "Acme Corp"
agentctl orgs list
agentctl orgs delete <org_id>

# Agents
agentctl agents register <org_id> "research-bot" --role executor --delegated-user user-jane
agentctl agents list <org_id>
agentctl agents deactivate <org_id> <agent_id>

# Policies
agentctl policy set <org_id> --agent-id <agent_id> --allow search --allow calculator --deny shell --token-limit 50000
agentctl policy evaluate <org_id> <agent_id> search --tokens 1000

# Budgets
agentctl budget set <org_id> --agent-id <agent_id> --token-limit 100000 --reset-days 30
agentctl budget check <org_id> <agent_id> 5000
agentctl budget usage <org_id> --agent-id <agent_id>
```

All commands output JSON.

---

## 14. Deployment Guide

### 14.1 Local Development

```bash
# Install
pip install -e ".[dev]"

# Start control plane
python -m agent_platform.main_control

# Start worker (separate terminal)
python -m agent_platform.main_worker

# Run tests
pytest tests/ -v
```

### 14.2 Docker Compose

```bash
# Start full stack (Postgres + OPA + Control Plane + Worker)
docker-compose up

# With API key
AP_API_KEY=your-secret docker-compose up

# With custom Postgres password
POSTGRES_PASSWORD=strong-password docker-compose up
```

**Services:**

| Service | Port | Image |
|---|---|---|
| PostgreSQL 16 | 5432 | `postgres:16-alpine` |
| OPA | 8181 | `openpolicyagent/opa:latest` |
| Control Plane | 50051 | Built from `Dockerfile` |
| Worker | 50052 | Built from `Dockerfile.worker` |

### 14.3 Docker Images

Both Dockerfiles use:
- **Multi-stage build** (builder + runtime)
- **Non-root user** (`appuser`)
- **Health checks** (gRPC channel ready)
- **Python 3.12-slim** base

### 14.4 Kubernetes (Helm)

```bash
# Install
helm install agent-platform ./helm/agent-platform \
  --set postgresql.auth.password=strong-password \
  --set controlPlane.apiKey=your-secret

# With custom values
helm install agent-platform ./helm/agent-platform -f my-values.yaml
```

**Helm chart structure:**

```
helm/agent-platform/
├── Chart.yaml          # Chart metadata (v0.1.0)
├── values.yaml         # Default configuration
└── templates/
    ├── control-plane.yaml  # Deployment + Service
    ├── worker.yaml         # Deployment + Service (2 replicas default)
    └── opa.yaml            # Deployment + Service (conditional on opa.enabled)
```

**Default values:**

| Parameter | Default |
|---|---|
| `controlPlane.replicaCount` | 1 |
| `controlPlane.port` | 50051 |
| `controlPlane.resources.limits.cpu` | 500m |
| `controlPlane.resources.limits.memory` | 512Mi |
| `worker.replicaCount` | 2 |
| `worker.port` | 50052 |
| `worker.resources.limits.cpu` | 1000m |
| `worker.resources.limits.memory` | 1Gi |
| `opa.enabled` | true |
| `opa.port` | 8181 |
| `postgresql.auth.password` | changeme |

### 14.5 Database

The `migrations/001_initial.sql` creates 6 tables using JSONB storage:

| Table | Purpose |
|---|---|
| `organizations` | Org records |
| `agents` | Agent identities |
| `policies` | Policy definitions |
| `budgets` | Budget allocations |
| `usage_reports` | Usage records |
| `audit_entries` | Audit trail |

All tables use `key TEXT PRIMARY KEY, data JSONB NOT NULL` with indexes on `org_id`, `agent_id`, and `execution_id`.

---

## 15. Testing

### 15.1 Test Suite

126 tests across 10 test files:

| File | Tests | Coverage Area |
|---|---|---|
| `test_orgs.py` | 8 | Organization CRUD, metadata, existence checks |
| `test_agents.py` | 10 | Registration, roles, delegation, deactivation, cross-org isolation |
| `test_policy.py` | 15 | Allow/deny, wildcards, hierarchical merge, OPA Rego generation, token limits |
| `test_billing.py` | 12 | Budget set/check, usage deduction, org-blocks-agent, negative token rejection |
| `test_runtime.py` | 5 | End-to-end execution, inactive agent, no policy, budget exhausted |
| `test_mcp_proxy.py` | 6 | Policy enforcement, budget enforcement, tool not found, exceptions, audit |
| `test_token_exchange.py` | 10 | Exchange, validate, expire, revoke, capacity, custom scopes |
| `test_tools.py` | 14 | Tool registry, SSRF protection (localhost, private IPs, metadata, link-local) |
| `test_audit.py` | 7 | Append, query by org/agent/action, limit, newest-first, delegation chains |
| `test_validation.py` | 39 | Input validation (names, tokens, timeouts, URLs, roles, effects) |

### 15.2 Running Tests

```bash
# All tests
pytest tests/ -v

# Specific module
pytest tests/test_policy.py -v

# With coverage
coverage run -m pytest tests/ -v
coverage report --show-missing
```

### 15.3 CI Pipeline

GitHub Actions runs on every push/PR to main/master:

1. **Test job** — Python 3.11, 3.12, 3.13 matrix
   - `ruff check` (linting)
   - `mypy` (type checking)
   - `pytest` with coverage
   - Coverage report uploaded as artifact

2. **Security job**
   - `bandit -r agent_platform/ -ll -ii` (security scan)

---

## 16. Configuration Reference

### 16.1 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AP_API_KEY` | *(empty, auth disabled)* | API key for gRPC authentication |
| `DATABASE_URL` | *(empty, in-memory)* | PostgreSQL connection string |
| `OPA_URL` | `http://localhost:8181` | OPA server URL |
| `LOG_LEVEL` | `info` | Log level (DEBUG, INFO, WARNING, ERROR) |
| `CONTROL_PLANE_ADDRESS` | `localhost:50051` | Worker's control plane connection |
| `POSTGRES_PASSWORD` | `agent_platform` | Docker Compose Postgres password |

### 16.2 Ports

| Service | Default Port |
|---|---|
| Control Plane (gRPC) | 50051 |
| Execution Worker (gRPC) | 50052 |
| PostgreSQL | 5432 |
| OPA | 8181 |

---

## 17. Standards Compliance

| Standard | Coverage |
|---|---|
| **NIST Agent Identity** (Feb 2026) | Identification, Authorization, Access Delegation, Logging |
| **NIST SP 800-207** (Zero Trust) | Always verify, least privilege, assume breach |
| **OAuth 2.1 / RFC 7591** | Dynamic client registration via agent registry |
| **RFC 8693** (Token Exchange) | Broad-to-narrow token scoping with TTL |
| **MCP Authorization Spec** | Tool call interception, policy enforcement |
| **OPA / Rego** (CNCF) | Policy-as-code generation and evaluation |
| **NIST SP 800-92** | Append-only audit logging |
| **SCIM** | Multi-tenant org model with identity lifecycle |

### Regulatory Readiness

| Regulation | Coverage |
|---|---|
| **EU AI Act** Art. 13-14 | Transparency (audit trail), human oversight (delegation) |
| **SOC 2 Type II** | Access controls, audit log, policy enforcement |
| **NIST AI RMF** | Policy engine, budget controls |
| **PCI-DSS** | Org isolation, tool-level access, audit |
| **HIPAA** | Agent-scoped access, delegation tracking, audit |

---

## 18. Project Structure

```
agent-platform-sdk/
├── agent_platform/                  # Core platform (Python)
│   ├── __init__.py                  # Package marker
│   ├── main_control.py              # Control plane entrypoint
│   ├── main_worker.py               # Worker entrypoint
│   ├── control_plane/
│   │   ├── agents.py                # Agent identity service
│   │   ├── billing.py               # Budget & usage service
│   │   ├── orgs.py                  # Organization service
│   │   ├── policy.py                # Policy engine + OPA adapter
│   │   └── server.py                # gRPC server + auth interceptor
│   ├── execution/
│   │   ├── llm.py                   # LLM interface (BaseLLM, MockLLM)
│   │   ├── memory.py                # Agent-scoped memory
│   │   ├── runtime.py               # Execution orchestrator
│   │   ├── tools.py                 # Tool registry + SSRF protection
│   │   └── worker.py                # gRPC execution worker
│   ├── gateway/
│   │   ├── audit.py                 # Append-only audit log
│   │   ├── mcp_proxy.py             # MCP authorization proxy
│   │   └── token_exchange.py        # RFC 8693 token exchange
│   ├── proto/
│   │   ├── agent_platform.proto     # Protobuf/gRPC definitions
│   │   ├── agent_platform_pb2.py    # Generated messages
│   │   └── agent_platform_pb2_grpc.py  # Generated stubs
│   └── shared/
│       ├── logging.py               # Structured JSON logging
│       ├── models.py                # Core data models
│       └── store.py                 # Store interface + InMemoryStore
├── sdk/
│   └── agent_platform_sdk/          # Python SDK client
│       ├── __init__.py
│       ├── client.py                # Unified AgentPlatformClient
│       ├── orgs.py                  # OrgClient
│       ├── agents.py                # AgentClient
│       ├── policy.py                # PolicyClient
│       └── budget.py                # BudgetClient
├── cli/
│   └── agentctl.py                  # CLI tool (click-based)
├── tests/                           # 126 tests
│   ├── conftest.py                  # Shared fixtures
│   ├── test_orgs.py
│   ├── test_agents.py
│   ├── test_policy.py
│   ├── test_billing.py
│   ├── test_runtime.py
│   ├── test_mcp_proxy.py
│   ├── test_token_exchange.py
│   ├── test_tools.py
│   ├── test_audit.py
│   └── test_validation.py
├── migrations/
│   └── 001_initial.sql              # PostgreSQL schema
├── helm/agent-platform/             # Kubernetes Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── control-plane.yaml
│       ├── worker.yaml
│       └── opa.yaml
├── .github/workflows/
│   ├── ci.yml                       # Test + lint + security
│   └── publish.yml                  # PyPI publish on tag
├── Dockerfile                       # Control plane image
├── Dockerfile.worker                # Worker image
├── docker-compose.yml               # Full stack deployment
├── Makefile                         # Build commands
├── pyproject.toml                   # Package config
├── .dockerignore
├── .gitignore
├── LICENSE                          # MIT
├── README.md
├── STANDARDS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## 19. Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `grpcio` | >=1.60.0 | gRPC runtime |
| `grpcio-tools` | >=1.60.0 | Protobuf compilation |
| `protobuf` | >=4.25.0 | Protobuf serialization |
| `structlog` | >=24.1.0 | Structured JSON logging |
| `httpx` | >=0.27.0 | HTTP client (OPA, HTTPTool) |

### Optional

| Package | Version | Purpose |
|---|---|---|
| `auth0-python` | >=4.0.0 | Auth0 IdP integration (planned) |

### Development

| Package | Version | Purpose |
|---|---|---|
| `pytest` | >=8.0.0 | Test runner |
| `pytest-asyncio` | >=0.23.0 | Async test support |
| `grpcio-testing` | >=1.60.0 | gRPC test utilities |
| `ruff` | — | Linting + formatting |
| `mypy` | — | Type checking |
| `bandit` | — | Security scanning |
| `coverage` | — | Code coverage |

### CLI (not in pyproject.toml)

| Package | Purpose |
|---|---|
| `click` | CLI framework for agentctl |

---

## 20. Known Limitations & Roadmap

### Current Limitations

| Area | Limitation |
|---|---|
| **Persistence** | InMemoryStore is default. PostgresStore exists but requires `DATABASE_URL`. State lost on restart without Postgres. |
| **Authentication** | API key only. No OAuth 2.1, OIDC, or mTLS. |
| **LLM Providers** | Only MockLLM implemented. Claude/OpenAI provider stubs planned. |
| **Worker Isolation** | `main_worker.py` still creates local in-memory services instead of connecting to control plane via gRPC. |
| **Usage Query** | `get_usage()` scans all reports in memory then filters — O(n) with no pagination. |
| **Agent Lookup** | `get_by_id()` scans all agents across orgs — O(n). Needs index. |
| **Token Exchange** | In-process only. No external token service integration. |
| **MCP Connection** | Proxy gates calls but doesn't connect to real MCP servers. |
| **SDK** | Python only. Rust and Go are scaffolds. |

### Planned

| Feature | Status |
|---|---|
| Auth0/Okta OIDC integration | Adapter interface defined |
| OAuth 2.1 with PKCE | Planned |
| Real LLM providers (Claude, OpenAI) | Planned |
| PostgreSQL store wiring in server.py | Store class exists, wiring pending |
| MCP server connection (stdio/SSE) | Planned |
| Rust SDK | Scaffold |
| Go SDK | Scaffold |
| EU AI Act compliance reports | Planned |
| Cross-app access (Okta XAA) | Planned |
| Anomaly detection on usage | Planned |

---

*Generated for Agent Platform SDK v0.1.0 — February 2026*
