# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-21

### Added
- Agent identity registry with org-scoped identities and role assignment
- Policy engine with hierarchical merge (org-level deny overrides agent-level allow)
- Budget management with per-agent and per-org token limits
- MCP authorization proxy for tool call interception
- Append-only audit log with delegation chain tracking
- RFC 8693 token exchange for scope narrowing
- OPA integration (Rego generation + REST evaluation with local fallback)
- Claude and OpenAI LLM provider adapters
- MCP client with stdio transport
- PostgreSQL persistence (optional, via DATABASE_URL)
- gRPC API key authentication (via AP_API_KEY)
- Docker and docker-compose deployment
- Helm chart for Kubernetes
- CI/CD with GitHub Actions (tests, lint, security scan)
- Python SDK client library
- CLI tool (agentctl)
- Input validation with SSRF protection
- 96 unit tests

### Security
- SSRF protection on HTTP tool (blocks private IP ranges, metadata endpoints)
- Cross-org isolation enforcement (no org-bypass in runtime)
- Thread-safe policy, billing, and token exchange services
- API key authentication on gRPC endpoints
