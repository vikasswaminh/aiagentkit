# Agent Platform SDK

Identity, policy, budget, and audit governance for AI agent fleets.

## What This Is

A control plane for managing AI agents in multi-tenant enterprise environments. It provides:

- **Agent Identity** — Register agents with org-scoped identities, role assignments, and human delegation bindings. Built on OAuth 2.1 and RFC 8693 token exchange patterns.
- **Policy Engine** — Define tool-level allow/deny rules per agent or org. Hierarchical merge (org-level deny overrides agent-level allow). Integrates with Open Policy Agent (OPA) for enterprise-grade policy evaluation.
- **Budget Management** — Per-agent and per-org token budgets with pre-flight checks and post-flight deductions. Prevents uncontrolled LLM spend.
- **MCP Authorization Proxy** — Intercepts Model Context Protocol (MCP) tool calls. Enforces policy and budget before forwarding to tool servers. Emits audit entries for every action.
- **Audit Trail** — Append-only log of every agent action with full delegation chain tracking (user → agent → tool).

## Architecture

```
┌─────────────────────────────────────────────────┐
│              CONTROL PLANE                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Agent    │ │ Policy   │ │ Budget & Billing │ │
│  │ Registry │ │ Engine   │ │ Engine           │ │
│  └────┬─────┘ └────┬─────┘ └────────┬─────────┘ │
│       │             │                │           │
│  ┌────▼─────────────▼────────────────▼─────────┐ │
│  │          gRPC API (protobuf contracts)       │ │
│  └──────────────────┬──────────────────────────┘ │
└─────────────────────┼───────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Auth0/   │  │ OPA      │  │ MCP      │
  │ Okta     │  │ (Rego)   │  │ Gateway  │
  │ OAuth2.1 │  │          │  │          │
  └──────────┘  └──────────┘  └──────────┘
```

The control plane manages state. Execution workers are stateless. All communication is gRPC with protobuf contracts.

## SDKs

| Language | Path | Status |
|----------|------|--------|
| Python | `sdks/python/` | Production |
| Rust | `sdks/rust/` | Production |
| Go | `sdks/go/` | Production |

All SDKs share the same protobuf contract (`proto/agent_platform.proto`) and expose identical functionality.

### Python

```python
from agent_platform_sdk import AgentPlatformClient

with AgentPlatformClient("localhost:50051") as client:
    org = client.orgs.create("acme-corp")
    agent = client.agents.register(org.org_id, "research-bot", role="executor")
    client.policy.set(org.org_id, agent.agent_id, allowed_tools=["search"], denied_tools=["shell"])
    client.budget.set(org.org_id, agent.agent_id, token_limit=100_000)

    decision = client.policy.evaluate(org.org_id, agent.agent_id, "search")
    # decision.allowed == True
```

### Rust

```rust
use agent_platform_sdk::AgentPlatformClient;

#[tokio::main]
async fn main() {
    let mut client = AgentPlatformClient::connect("http://localhost:50051").await.unwrap();
    let org = client.create_org("acme-corp").await.unwrap();
    let agent = client.register_agent(&org.org_id, "research-bot", "executor", None).await.unwrap();
    client.set_policy(&org.org_id, Some(&agent.agent_id), &["search"], &["shell"], 100_000, 300).await.unwrap();
}
```

### Go

```go
client, _ := agentplatform.NewClient("localhost:50051")
defer client.Close()

org, _ := client.CreateOrg(ctx, "acme-corp")
agent, _ := client.RegisterAgent(ctx, org.OrgID, "research-bot", "executor", "")
decision, _ := client.EvaluatePolicy(ctx, org.OrgID, agent.AgentID, "search", 0)
```

## CLI

```bash
# Start the control plane
python -m platform.main_control

# Use the CLI
python cli/agentctl.py orgs create "acme-corp"
python cli/agentctl.py agents register <org_id> "research-bot" --role executor
python cli/agentctl.py policy set <org_id> --agent-id <agent_id> --allow search --deny shell
python cli/agentctl.py budget set <org_id> --agent-id <agent_id> --token-limit 100000
python cli/agentctl.py policy evaluate <org_id> <agent_id> search
python cli/agentctl.py budget check <org_id> <agent_id> 5000
```

## Execution Flow

```
Client calls ExecuteTask via gRPC
  → Validate agent identity (active, belongs to org)
  → Fetch effective policy (agent-level merged with org-level)
  → Pre-flight budget check (sufficient tokens?)
  → Call LLM
  → If tool_call: validate tool permission against policy
  → If allowed: execute tool through MCP proxy
  → Post-flight: deduct actual token usage from budget
  → Emit audit entry with full delegation chain
  → Return result
```

## Standards Alignment

See [STANDARDS.md](STANDARDS.md) for detailed mapping to NIST, OAuth 2.1, MCP, and OPA standards.

## Project Structure

```
agent-platform-sdk/
├── proto/                          # Shared protobuf contract
│   └── agent_platform.proto
├── platform/                       # Control plane + execution runtime (Python)
│   ├── control_plane/
│   │   ├── orgs.py                # Organization CRUD
│   │   ├── agents.py              # Agent registration + identity
│   │   ├── policy.py              # Policy engine + OPA adapter
│   │   ├── billing.py             # Budget + usage tracking
│   │   └── server.py              # gRPC server
│   ├── execution/
│   │   ├── runtime.py             # Execution orchestrator
│   │   ├── llm.py                 # LLM interface (pluggable)
│   │   ├── tools.py               # Tool system + registry
│   │   ├── memory.py              # Agent-scoped memory
│   │   └── worker.py              # Stateless gRPC worker
│   ├── gateway/
│   │   ├── mcp_proxy.py           # MCP authorization proxy
│   │   ├── token_exchange.py      # RFC 8693 token narrowing
│   │   └── audit.py               # Append-only audit log
│   └── shared/
│       ├── models.py              # Core data models
│       ├── logging.py             # Structured JSON logging
│       └── store.py               # Store interface + in-memory impl
├── sdks/
│   ├── python/                    # Python SDK
│   ├── rust/                      # Rust SDK
│   └── go/                        # Go SDK
├── cli/
│   └── agentctl.py                # CLI tool
└── examples/
    └── quickstart.py              # Getting started example
```

## License

MIT
