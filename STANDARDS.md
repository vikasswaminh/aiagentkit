# Standards Alignment

This document maps Agent Platform capabilities to industry standards and regulatory frameworks. Each capability references the specific standard it implements or aligns with.

## NIST Framework Alignment

Reference: [NIST NCCoE — Software and AI Agent Identity and Authorization](https://www.nccoe.nist.gov/projects/software-and-ai-agent-identity-and-authorization) (February 2026)

The NIST concept paper identifies four core requirements for AI agent governance. This table maps each to Agent Platform capabilities.

| NIST Requirement | Agent Platform Implementation | Component |
|---|---|---|
| **Identification** — Distinguish AI agents from human users; manage metadata to control agent action range | Agent Registry with org-scoped identity, role assignment (executor/planner/reviewer/admin), and active/inactive lifecycle management | `control_plane/agents.py` |
| **Authorization** — Apply OAuth 2.0/2.1 and policy-based access control to define agent entitlements | Policy Engine with tool-level ABAC (allow/deny per tool), hierarchical merge (org < agent), and OPA integration for Rego-based evaluation | `control_plane/policy.py` |
| **Access Delegation** — Link user identities to AI agents to maintain accountability | Delegation binding via `delegated_user_id` on agent identity; token exchange (RFC 8693) for narrowing broad tokens to task-scoped credentials | `gateway/token_exchange.py` |
| **Logging and Transparency** — Link agent actions to non-human entities for visibility | Append-only audit log with full delegation chain tracking (user → agent → tool), structured JSON with org_id, agent_id, execution_id context | `gateway/audit.py` |

### NIST SP 800-207 (Zero Trust Architecture)

| Zero Trust Principle | Implementation |
|---|---|
| Never trust, always verify | Every execution validates agent identity, checks policy, and verifies budget before any action |
| Least privilege | Token exchange narrows broad agent tokens to tool-scoped, time-limited credentials |
| Assume breach | Audit log is append-only and captures denied actions, not just allowed ones |

### NIST SP 800-63-4 (Digital Identity Guidelines)

| Guideline Area | Implementation |
|---|---|
| Identity proofing | Agent registration requires org membership verification |
| Authentication | Agent identity validated on every gRPC call via token claims |
| Federation | Auth0/Okta integration planned; adapter interface defined |

## OAuth 2.1 Alignment

| OAuth 2.1 Concept | Implementation |
|---|---|
| Dynamic Client Registration (RFC 7591) | Agent registration creates a client identity with org scope, role, and metadata |
| Token Exchange (RFC 8693) | `TokenExchangeService` exchanges broad agent tokens for narrow, tool-scoped tokens with configurable TTL |
| Scope restriction | Exchanged tokens carry `tool:{name}:execute` scopes, limiting agent capability per tool call |
| Token revocation | `revoke()` and `revoke_all_for_agent()` for immediate credential invalidation |

## Model Context Protocol (MCP)

| MCP Concept | Implementation |
|---|---|
| Tool call interception | `MCPAuthorizationProxy` wraps MCP tool servers and intercepts every call |
| Pre-execution policy check | Policy evaluated before tool forwarding; denied calls never reach the tool server |
| Pre-execution budget check | Budget verified before execution; over-budget calls are rejected |
| Post-execution usage reporting | Token usage and tool invocations reported to billing engine after each call |
| Audit emission | Every tool call generates an immutable audit entry with parameters, result, latency, and delegation chain |

### MCP Authorization Spec (June 2025)

| Spec Requirement | Implementation |
|---|---|
| OAuth 2.1 with PKCE | Planned (Auth0/Okta adapter interface defined, not yet wired) |
| Incremental scope negotiation | Token exchange produces narrowed scopes per tool |
| Human-in-the-loop for high-risk actions | Extensible via policy engine (configurable per-tool risk levels) |

## Open Policy Agent (OPA) — CNCF Graduated

| OPA Capability | Implementation |
|---|---|
| Policy-as-code | `OPAAdapter.policy_to_rego()` auto-generates Rego policies from Python governance rules |
| Centralized evaluation | Policy decisions via OPA REST API (`/v1/data/{policy}/allow`) |
| ABAC support | Tool permissions support attribute-based constraints via `parameters_constraint` field |
| Hierarchical policy | Org-level policies merge with agent-level; org deny always overrides agent allow |

## SCIM (System for Cross-domain Identity Management)

| SCIM Concept | Implementation |
|---|---|
| Organization model | Multi-tenant org hierarchy with CRUD operations |
| Identity lifecycle | Agent creation, deactivation, and org membership management |
| Metadata | Extensible metadata on orgs and agent identities |

## Capability Matrix

| Capability | Standard | Status |
|---|---|---|
| Agent identity issuance | OAuth 2.1 / RFC 7591 | Implemented |
| Token exchange (broad → narrow) | RFC 8693 | Implemented (in-process; Auth0 integration pending) |
| Policy evaluation (local) | Custom ABAC | Implemented |
| Policy evaluation (OPA) | OPA / Rego | Implemented (Rego generation + REST eval with local fallback) |
| Tool-level ABAC | NIST SP 800-162 | Implemented |
| Hierarchical policy merge | Custom (org < agent) | Implemented |
| Token budget enforcement | Custom | Implemented |
| Per-agent usage tracking | Custom | Implemented |
| Delegation chain tracking | W3C PROV-aligned | Implemented |
| Append-only audit log | NIST SP 800-92 aligned | Implemented |
| MCP tool call interception | MCP Authorization Spec | Implemented |
| Structured logging | structlog JSON | Implemented |
| Multi-tenant org isolation | SCIM-aligned | Implemented |
| gRPC API contracts | Protobuf v3 | Implemented |
| Auth0/Okta IdP integration | OIDC / OAuth 2.1 | Planned (adapter interface defined) |
| Cross App Access (XAA) | Okta XAA (2026) | Planned |
| EU AI Act compliance reports | EU AI Act Article 14 | Planned |
| NIST AI Agent Standards Initiative alignment | NIST CAISI | Aligned |

## Regulatory Readiness

| Regulation | Relevance | Coverage |
|---|---|---|
| **EU AI Act** | Article 14 (Human oversight), Article 13 (Transparency) | Audit trail, delegation chain, human-in-the-loop extensibility |
| **SOC 2 Type II** | Trust service criteria (security, availability, processing integrity) | Append-only audit log, policy enforcement, access controls |
| **NIST AI RMF** | AI risk management framework | Policy engine, budget controls, anomaly detection (planned) |
| **PCI-DSS** | Payment card industry (if agents handle financial data) | Org isolation, tool-level access control, audit trail |
| **HIPAA** | Healthcare (if agents handle PHI) | Agent-scoped access, delegation tracking, audit log |
