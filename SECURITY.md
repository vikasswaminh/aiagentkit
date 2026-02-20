# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email: security@agent-platform.dev

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide an initial assessment within 5 business days.

## Security Measures

This project implements the following security controls:

- **SSRF protection**: HTTP tool blocks requests to private IP ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16) and cloud metadata endpoints.
- **Input validation**: All user-facing inputs are validated against regex patterns with length limits.
- **Cross-org isolation**: Agents can only be accessed within their registered organization.
- **Thread safety**: All mutable services use `threading.RLock` for concurrent access.
- **API authentication**: gRPC endpoints support API key authentication via `AP_API_KEY` environment variable.
- **Least privilege**: Token exchange narrows broad agent tokens to tool-scoped, time-limited credentials.
- **Audit logging**: Append-only audit trail captures all agent actions, including denied requests.
