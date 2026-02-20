"""Structured JSON logging with agent platform context."""

from __future__ import annotations

import sys
from typing import Any

import logging

import structlog

_LEVEL_MAP = {
    "DEBUG": logging.DEBUG,
    "INFO": logging.INFO,
    "WARNING": logging.WARNING,
    "ERROR": logging.ERROR,
    "CRITICAL": logging.CRITICAL,
}


def configure_logging(log_level: str = "INFO") -> None:
    """Configure structured JSON logging for the platform."""
    level = _LEVEL_MAP.get(log_level.upper(), logging.INFO)
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )


def get_logger(**initial_context: Any) -> structlog.stdlib.BoundLogger:
    """Get a logger with optional initial context bindings."""
    return structlog.get_logger(**initial_context)


def bind_context(
    org_id: str | None = None,
    agent_id: str | None = None,
    execution_id: str | None = None,
    **extra: Any,
) -> None:
    """Bind context variables for structured logging (thread-local / contextvars)."""
    ctx: dict[str, Any] = {}
    if org_id is not None:
        ctx["org_id"] = org_id
    if agent_id is not None:
        ctx["agent_id"] = agent_id
    if execution_id is not None:
        ctx["execution_id"] = execution_id
    ctx.update(extra)
    structlog.contextvars.bind_contextvars(**ctx)


def clear_context() -> None:
    """Clear all bound context variables."""
    structlog.contextvars.clear_contextvars()
