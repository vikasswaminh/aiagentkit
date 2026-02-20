"""Tests for input validation and SSRF protection."""

import pytest

from agent_platform.shared.validation import (
    ValidationError,
    validate_name,
    validate_id,
    validate_tool_name,
    validate_token_limit,
    validate_timeout,
    validate_url,
    validate_role,
    validate_effect,
)


class TestValidateName:
    def test_valid_name(self):
        assert validate_name("my-agent") == "my-agent"

    def test_valid_name_with_spaces(self):
        assert validate_name("My Agent v2") == "My Agent v2"

    def test_strips_whitespace(self):
        assert validate_name("  test  ") == "test"

    def test_empty_name_rejected(self):
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_name("")

    def test_whitespace_only_rejected(self):
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_name("   ")

    def test_too_long_rejected(self):
        with pytest.raises(ValidationError):
            validate_name("a" * 200)

    def test_special_chars_rejected(self):
        with pytest.raises(ValidationError):
            validate_name("agent;DROP TABLE")

    def test_starts_with_hyphen_rejected(self):
        with pytest.raises(ValidationError):
            validate_name("-agent")


class TestValidateId:
    def test_valid_uuid(self):
        assert validate_id("550e8400-e29b-41d4-a716-446655440000")

    def test_empty_rejected(self):
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_id("")

    def test_invalid_uuid_rejected(self):
        with pytest.raises(ValidationError, match="valid UUID"):
            validate_id("not-a-uuid")


class TestValidateToolName:
    def test_valid_tool_name(self):
        assert validate_tool_name("search") == "search"

    def test_wildcard(self):
        assert validate_tool_name("*") == "*"

    def test_underscore_allowed(self):
        assert validate_tool_name("web_search") == "web_search"

    def test_empty_rejected(self):
        with pytest.raises(ValidationError):
            validate_tool_name("")

    def test_starts_with_number_rejected(self):
        with pytest.raises(ValidationError):
            validate_tool_name("1tool")

    def test_hyphen_rejected(self):
        with pytest.raises(ValidationError):
            validate_tool_name("web-search")


class TestValidateTokenLimit:
    def test_valid_limit(self):
        assert validate_token_limit(100_000) == 100_000

    def test_zero_rejected(self):
        with pytest.raises(ValidationError, match="positive"):
            validate_token_limit(0)

    def test_negative_rejected(self):
        with pytest.raises(ValidationError, match="positive"):
            validate_token_limit(-1)

    def test_exceeds_max_rejected(self):
        with pytest.raises(ValidationError, match="cannot exceed"):
            validate_token_limit(200_000_000)


class TestValidateTimeout:
    def test_valid_timeout(self):
        assert validate_timeout(300) == 300

    def test_zero_rejected(self):
        with pytest.raises(ValidationError):
            validate_timeout(0)

    def test_exceeds_max_rejected(self):
        with pytest.raises(ValidationError, match="3600"):
            validate_timeout(7200)


class TestValidateUrl:
    def test_valid_https(self):
        assert validate_url("https://example.com/api") == "https://example.com/api"

    def test_valid_http(self):
        assert validate_url("http://example.com/api") == "http://example.com/api"

    def test_empty_rejected(self):
        with pytest.raises(ValidationError, match="cannot be empty"):
            validate_url("")

    def test_ftp_rejected(self):
        with pytest.raises(ValidationError, match="http or https"):
            validate_url("ftp://example.com")

    def test_localhost_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://localhost/admin")

    def test_127_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://127.0.0.1/secret")

    def test_aws_metadata_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://169.254.169.254/latest/meta-data")

    def test_private_10_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://10.0.0.1/internal")

    def test_private_172_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://172.16.0.1/internal")

    def test_private_192_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://192.168.1.1/router")

    def test_google_metadata_blocked(self):
        with pytest.raises(ValidationError, match="blocked"):
            validate_url("http://metadata.google.internal/computeMetadata")


class TestValidateRole:
    def test_valid_roles(self):
        for role in ("executor", "planner", "reviewer", "admin"):
            assert validate_role(role) == role

    def test_invalid_role_rejected(self):
        with pytest.raises(ValidationError, match="must be one of"):
            validate_role("superadmin")


class TestValidateEffect:
    def test_valid_effects(self):
        assert validate_effect("allow") == "allow"
        assert validate_effect("deny") == "deny"

    def test_invalid_effect_rejected(self):
        with pytest.raises(ValidationError):
            validate_effect("maybe")
