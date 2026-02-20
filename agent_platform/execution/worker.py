"""Stateless gRPC execution worker."""

from __future__ import annotations

from concurrent import futures
from typing import Any

import grpc
from google.protobuf import struct_pb2, timestamp_pb2

from agent_platform.execution.llm import BaseLLM, MockLLM
from agent_platform.execution.runtime import ExecutionRuntime
from agent_platform.execution.tools import ToolRegistry
from agent_platform.shared.logging import get_logger
from agent_platform.shared.models import ExecutionRequest

from agent_platform.proto import agent_platform_pb2 as pb2
from agent_platform.proto import agent_platform_pb2_grpc as pb2_grpc

log = get_logger()


class ExecutionServicer(pb2_grpc.ExecutionServiceServicer):
    """gRPC servicer for task execution."""

    def __init__(self, runtime: ExecutionRuntime) -> None:
        self._runtime = runtime

    def ExecuteTask(self, request, context):
        exec_request = ExecutionRequest(
            agent_id=request.agent_id,
            org_id=request.org_id,
            task=request.task,
            execution_id=request.execution_id or "",
            context=dict(request.context) if request.context else {},
        )

        response = self._runtime.execute(exec_request)

        ts = timestamp_pb2.Timestamp()
        ts.FromDatetime(response.completed_at)

        tool_calls = []
        for tc in response.tool_calls:
            params = struct_pb2.Struct()
            params.update(tc.get("parameters", {}))
            tool_calls.append(pb2.ToolCallProto(
                tool_name=tc.get("tool_name", ""),
                parameters=params,
                result=str(tc.get("result", "")),
                latency_ms=tc.get("latency_ms", 0),
            ))

        return pb2.ExecuteTaskResponse(
            execution_id=response.execution_id,
            agent_id=response.agent_id,
            org_id=response.org_id,
            result=response.result,
            tokens_used=response.tokens_used,
            tool_calls=tool_calls,
            duration_ms=response.duration_ms,
            success=response.success,
            error=response.error or "",
            completed_at=ts,
        )


def create_execution_server(
    agent_service: Any,
    policy_service: Any,
    billing_service: Any,
    llm: BaseLLM | None = None,
    tool_registry: ToolRegistry | None = None,
    port: int = 50052,
    max_workers: int = 10,
) -> grpc.Server:
    """Create the execution worker gRPC server.

    Services can be local instances or remote gRPC-backed stubs (duck-typed).
    """
    runtime = ExecutionRuntime(
        agent_service=agent_service,
        policy_service=policy_service,
        billing_service=billing_service,
        llm=llm or MockLLM(),
        tool_registry=tool_registry or ToolRegistry(),
    )

    servicer = ExecutionServicer(runtime)
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=max_workers))
    pb2_grpc.add_ExecutionServiceServicer_to_server(servicer, server)
    server.add_insecure_port(f"[::]:{port}")

    log.info("execution_server_created", port=port)
    return server
