"""Tests for tool system — registry, SSRF protection, mock tools."""

import pytest

from agent_platform.execution.tools import (
    MockTool,
    ToolRegistry,
    _is_ssrf_safe,
)
from agent_platform.shared.exceptions import ToolNotFoundError


class TestToolRegistry:
    def test_register_and_get(self):
        reg = ToolRegistry()
        reg.register(MockTool(name="test"))
        assert reg.get("test") is not None

    def test_get_nonexistent(self):
        reg = ToolRegistry()
        assert reg.get("nope") is None

    def test_list_tools(self):
        reg = ToolRegistry()
        reg.register(MockTool(name="a"))
        reg.register(MockTool(name="b"))
        schemas = reg.list()
        names = {s.name for s in schemas}
        assert names == {"a", "b"}

    def test_execute(self):
        reg = ToolRegistry()
        reg.register(MockTool(name="calc", response="42"))
        result = reg.execute("calc")
        assert result == "42"

    def test_execute_nonexistent_raises(self):
        reg = ToolRegistry()
        with pytest.raises(ToolNotFoundError, match="not registered"):
            reg.execute("nonexistent")

    def test_count(self):
        reg = ToolRegistry()
        assert reg.count == 0
        reg.register(MockTool(name="a"))
        assert reg.count == 1


class TestSSRFProtection:
    def test_blocks_localhost_ip(self):
        assert _is_ssrf_safe("http://127.0.0.1/admin") is False

    def test_blocks_private_ip(self):
        assert _is_ssrf_safe("http://10.0.0.1/api") is False
        assert _is_ssrf_safe("http://192.168.1.1/api") is False
        assert _is_ssrf_safe("http://172.16.0.1/api") is False

    def test_blocks_metadata_endpoint(self):
        assert _is_ssrf_safe("http://169.254.169.254/latest/meta-data") is False

    def test_blocks_cloud_metadata_host(self):
        assert _is_ssrf_safe("http://metadata.google.internal/") is False

    def test_allows_public_url(self):
        assert _is_ssrf_safe("https://api.example.com/data") is True

    def test_blocks_empty_url(self):
        assert _is_ssrf_safe("") is False

    def test_allows_public_ip(self):
        assert _is_ssrf_safe("http://8.8.8.8/dns") is True

    def test_blocks_link_local(self):
        assert _is_ssrf_safe("http://169.254.0.1/") is False
