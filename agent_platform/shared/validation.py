"""Input validation for the agent platform. All boundary inputs must pass through here."""

from __future__ import annotations

import ipaddress
import re
import uuid
from urllib.parse import urlparse

_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9\-_. ]{0,127}$")
_TOOL_NAME_PATTERN = re.compile(r"^(\*|[a-zA-Z][a-zA-Z0-9_]{0,63})$")
_MAX_TOKEN_LIMIT = 100_000_000  # 100M tokens
_MAX_METADATA_SIZE = 64  # max keys in metadata dict

_BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # AWS metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]


class ValidationError(Exception):
    """Raised when input validation fails."""

    def __init__(self, field: str, message: str) -> None:
        self.field = field
        self.message = message
        super().__init__(f"{field}: {message}")


def validate_name(name: str, field: str = "name") -> str:
    """Validate a human-readable name (org name, agent name)."""
    if not name or not name.strip():
        raise ValidationError(field, "cannot be empty")
    name = name.strip()
    if not _NAME_PATTERN.match(name):
        raise ValidationError(
            field,
            "must be 1-128 chars, start with alphanumeric, contain only alphanumeric/hyphens/underscores/dots/spaces",
        )
    return name


def validate_id(id_value: str, field: str = "id") -> str:
    """Validate a UUID-format identifier."""
    if not id_value or not id_value.strip():
        raise ValidationError(field, "cannot be empty")
    try:
        uuid.UUID(id_value.strip())
    except ValueError:
        raise ValidationError(field, "must be a valid UUID")
    return id_value.strip()


def validate_tool_name(name: str, field: str = "tool_name") -> str:
    """Validate a tool name (alphanumeric + underscores, or wildcard '*')."""
    if not name or not name.strip():
        raise ValidationError(field, "cannot be empty")
    name = name.strip()
    if not _TOOL_NAME_PATTERN.match(name):
        raise ValidationError(
            field,
            "must be 1-64 chars, start with letter, contain only alphanumeric/underscores (or '*' for wildcard)",
        )
    return name


def validate_token_limit(limit: int, field: str = "token_limit") -> int:
    """Validate a token limit is positive and within bounds."""
    if limit <= 0:
        raise ValidationError(field, "must be a positive integer")
    if limit > _MAX_TOKEN_LIMIT:
        raise ValidationError(field, f"cannot exceed {_MAX_TOKEN_LIMIT}")
    return limit


def validate_timeout(seconds: int, field: str = "timeout_seconds") -> int:
    """Validate an execution timeout."""
    if seconds <= 0:
        raise ValidationError(field, "must be a positive integer")
    if seconds > 3600:
        raise ValidationError(field, "cannot exceed 3600 seconds (1 hour)")
    return seconds


def validate_url(url: str, field: str = "url") -> str:
    """Validate a URL is safe (not internal/private IPs)."""
    if not url or not url.strip():
        raise ValidationError(field, "cannot be empty")

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValidationError(field, "must use http or https scheme")

    hostname = parsed.hostname
    if not hostname:
        raise ValidationError(field, "must have a valid hostname")

    # Block private/reserved IPs
    try:
        ip = ipaddress.ip_address(hostname)
        for network in _BLOCKED_IP_NETWORKS:
            if ip in network:
                raise ValidationError(field, f"blocked: private/reserved IP address {hostname}")
    except ValueError:
        # hostname is a domain name, not an IP — resolve and check
        # In production, DNS resolution + check is needed here
        # For now, block obvious patterns
        if hostname in ("localhost", "metadata.google.internal"):
            raise ValidationError(field, f"blocked: reserved hostname {hostname}")

    return url


def validate_role(role: str, field: str = "role") -> str:
    """Validate agent role."""
    valid = {"executor", "planner", "reviewer", "admin"}
    if role not in valid:
        raise ValidationError(field, f"must be one of: {', '.join(sorted(valid))}")
    return role


def validate_effect(effect: str, field: str = "effect") -> str:
    """Validate policy effect."""
    valid = {"allow", "deny"}
    if effect not in valid:
        raise ValidationError(field, f"must be one of: {', '.join(sorted(valid))}")
    return effect
