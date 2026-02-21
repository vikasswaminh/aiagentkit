"""Unified client for the Agent Platform control plane."""

from __future__ import annotations

import os
from typing import Any

import grpc

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc
from agent_platform_sdk.orgs import OrgClient
from agent_platform_sdk.agents import AgentClient
from agent_platform_sdk.policy import PolicyClient
from agent_platform_sdk.budget import BudgetClient

# Default gRPC channel options for resilience
_DEFAULT_CHANNEL_OPTIONS = [
    ("grpc.keepalive_time_ms", 30_000),
    ("grpc.keepalive_timeout_ms", 10_000),
    ("grpc.keepalive_permit_without_calls", 1),
    ("grpc.max_receive_message_length", 10 * 1024 * 1024),  # 10MB
    ("grpc.initial_reconnect_backoff_ms", 1_000),
    ("grpc.max_reconnect_backoff_ms", 30_000),
]


class AgentPlatformClient:
    """Unified client for all control plane operations.

    Usage:
        client = AgentPlatformClient("localhost:50051")
        org = client.orgs.create("my-company")
        agent = client.agents.register(org.org_id, "assistant", role="executor")
        client.policy.set(org.org_id, agent.agent_id, allowed_tools=["search"])
        client.budget.set(org.org_id, agent.agent_id, token_limit=100000)

    With TLS:
        client = AgentPlatformClient(
            "myserver:50051",
            tls=True,
            tls_cert_path="/path/to/ca.pem",
        )

    With API key:
        client = AgentPlatformClient(
            "localhost:50051",
            api_key="my-secret-key",
        )
    """

    def __init__(
        self,
        address: str = "localhost:50051",
        *,
        tls: bool = False,
        tls_cert_path: str | None = None,
        api_key: str | None = None,
        timeout_seconds: float = 30.0,
        channel_options: list[tuple[str, Any]] | None = None,
    ) -> None:
        self._timeout = timeout_seconds
        options = channel_options or _DEFAULT_CHANNEL_OPTIONS

        # Resolve API key from param or environment
        self._api_key = api_key or os.environ.get("AP_API_KEY", "")

        # Build channel with optional TLS
        if tls:
            if tls_cert_path:
                with open(tls_cert_path, "rb") as f:
                    root_cert = f.read()
                credentials = grpc.ssl_channel_credentials(root_certificates=root_cert)
            else:
                credentials = grpc.ssl_channel_credentials()
            self._channel = grpc.secure_channel(address, credentials, options=options)
        else:
            self._channel = grpc.insecure_channel(address, options=options)

        # Attach API key metadata interceptor if provided
        if self._api_key:
            self._channel = grpc.intercept_channel(
                self._channel,
                _APIKeyInterceptor(self._api_key),
            )

        self._stub = pb2_grpc.ControlPlaneStub(self._channel)
        self.orgs = OrgClient(self._stub)
        self.agents = AgentClient(self._stub)
        self.policy = PolicyClient(self._stub)
        self.budget = BudgetClient(self._stub)

    def close(self) -> None:
        self._channel.close()

    def __enter__(self) -> AgentPlatformClient:
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:
            pass


class _APIKeyInterceptor(
    grpc.UnaryUnaryClientInterceptor,
    grpc.UnaryStreamClientInterceptor,
    grpc.StreamUnaryClientInterceptor,
    grpc.StreamStreamClientInterceptor,
):
    """Client-side interceptor that attaches API key metadata to every call."""

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._metadata = [("x-api-key", api_key)]

    def _add_metadata(self, client_call_details: Any) -> Any:
        metadata = list(client_call_details.metadata or [])
        metadata.extend(self._metadata)
        return grpc._common.ClientCallDetails(
            client_call_details.method,
            client_call_details.timeout,
            metadata,
            client_call_details.credentials,
            client_call_details.wait_for_ready,
            client_call_details.compression,
        )

    def intercept_unary_unary(self, continuation, client_call_details, request):
        return continuation(self._add_metadata(client_call_details), request)

    def intercept_unary_stream(self, continuation, client_call_details, request):
        return continuation(self._add_metadata(client_call_details), request)

    def intercept_stream_unary(self, continuation, client_call_details, request_iterator):
        return continuation(self._add_metadata(client_call_details), request_iterator)

    def intercept_stream_stream(self, continuation, client_call_details, request_iterator):
        return continuation(self._add_metadata(client_call_details), request_iterator)
