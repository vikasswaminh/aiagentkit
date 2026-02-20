"""agentctl — CLI for the Agent Platform control plane."""

from __future__ import annotations

import json
import sys

import click
import grpc

sys.path.insert(0, '.')
sys.path.insert(0, './sdks/python')

from agent_platform_sdk.client import AgentPlatformClient


def _handle_rpc_error(e: grpc.RpcError) -> None:
    """Print a user-friendly error for gRPC failures."""
    code = e.code() if hasattr(e, 'code') else 'UNKNOWN'
    details = e.details() if hasattr(e, 'details') else str(e)
    click.echo(f"Error [{code}]: {details}", err=True)
    raise SystemExit(1)


@click.group()
@click.option("--address", default="localhost:50051", help="Control plane address")
@click.pass_context
def cli(ctx: click.Context, address: str) -> None:
    """Agent Platform CLI — manage orgs, agents, policies, and budgets."""
    ctx.ensure_object(dict)
    ctx.obj["address"] = address


def _client(ctx: click.Context) -> AgentPlatformClient:
    return AgentPlatformClient(ctx.obj["address"])


# --- Organizations ---

@cli.group()
def orgs() -> None:
    """Manage organizations."""
    pass


@orgs.command("create")
@click.argument("name")
@click.pass_context
def orgs_create(ctx: click.Context, name: str) -> None:
    """Create an organization."""
    try:
        with _client(ctx) as c:
            org = c.orgs.create(name)
            click.echo(json.dumps({"org_id": org.org_id, "name": org.name}, indent=2))
    except grpc.RpcError as e:
        _handle_rpc_error(e)


@orgs.command("list")
@click.pass_context
def orgs_list(ctx: click.Context) -> None:
    """List all organizations."""
    with _client(ctx) as c:
        for org in c.orgs.list():
            click.echo(f"{org.org_id}\t{org.name}")


@orgs.command("delete")
@click.argument("org_id")
@click.pass_context
def orgs_delete(ctx: click.Context, org_id: str) -> None:
    """Delete an organization."""
    with _client(ctx) as c:
        success = c.orgs.delete(org_id)
        click.echo("deleted" if success else "not found")


# --- Agents ---

@cli.group()
def agents() -> None:
    """Manage agents."""
    pass


@agents.command("register")
@click.argument("org_id")
@click.argument("name")
@click.option("--role", default="executor", type=click.Choice(["executor", "planner", "reviewer", "admin"]))
@click.option("--delegated-user", default=None)
@click.pass_context
def agents_register(ctx: click.Context, org_id: str, name: str, role: str, delegated_user: str | None) -> None:
    """Register an agent under an organization."""
    try:
        with _client(ctx) as c:
            agent = c.agents.register(org_id, name, role=role, delegated_user_id=delegated_user)
            click.echo(json.dumps({
                "agent_id": agent.agent_id,
                "org_id": agent.org_id,
                "name": agent.name,
                "role": agent.role,
                "active": agent.active,
            }, indent=2))
    except grpc.RpcError as e:
        _handle_rpc_error(e)


@agents.command("list")
@click.argument("org_id")
@click.pass_context
def agents_list(ctx: click.Context, org_id: str) -> None:
    """List agents in an organization."""
    with _client(ctx) as c:
        for a in c.agents.list(org_id):
            status = "active" if a.active else "inactive"
            click.echo(f"{a.agent_id}\t{a.name}\t{a.role}\t{status}")


@agents.command("deactivate")
@click.argument("org_id")
@click.argument("agent_id")
@click.pass_context
def agents_deactivate(ctx: click.Context, org_id: str, agent_id: str) -> None:
    """Deactivate an agent."""
    with _client(ctx) as c:
        success = c.agents.deactivate(org_id, agent_id)
        click.echo("deactivated" if success else "not found")


# --- Policy ---

@cli.group()
def policy() -> None:
    """Manage policies."""
    pass


@policy.command("set")
@click.argument("org_id")
@click.option("--agent-id", default=None)
@click.option("--allow", multiple=True, help="Tools to allow")
@click.option("--deny", multiple=True, help="Tools to deny")
@click.option("--token-limit", default=100000, type=int)
@click.option("--timeout", default=300, type=int)
@click.pass_context
def policy_set(ctx: click.Context, org_id: str, agent_id: str | None, allow: tuple, deny: tuple, token_limit: int, timeout: int) -> None:
    """Set policy for an org or agent."""
    with _client(ctx) as c:
        policy_id = c.policy.set(
            org_id=org_id,
            agent_id=agent_id,
            allowed_tools=list(allow) or None,
            denied_tools=list(deny) or None,
            token_limit=token_limit,
            timeout_seconds=timeout,
        )
        click.echo(json.dumps({"policy_id": policy_id}, indent=2))


@policy.command("evaluate")
@click.argument("org_id")
@click.argument("agent_id")
@click.argument("tool_name")
@click.option("--tokens", default=0, type=int)
@click.pass_context
def policy_evaluate(ctx: click.Context, org_id: str, agent_id: str, tool_name: str, tokens: int) -> None:
    """Evaluate whether an agent can use a tool."""
    try:
        with _client(ctx) as c:
            decision = c.policy.evaluate(org_id, agent_id, tool_name, tokens)
            click.echo(json.dumps({
                "allowed": decision.allowed,
                "reason": decision.reason,
                "policy_id": decision.policy_id,
            }, indent=2))
    except grpc.RpcError as e:
        _handle_rpc_error(e)


# --- Budget ---

@cli.group()
def budget() -> None:
    """Manage budgets."""
    pass


@budget.command("set")
@click.argument("org_id")
@click.option("--agent-id", default=None)
@click.option("--token-limit", default=1000000, type=int)
@click.option("--reset-days", default=30, type=int)
@click.pass_context
def budget_set(ctx: click.Context, org_id: str, agent_id: str | None, token_limit: int, reset_days: int) -> None:
    """Set budget for an org or agent."""
    with _client(ctx) as c:
        info = c.budget.set(org_id, agent_id, token_limit=token_limit, reset_period_days=reset_days)
        click.echo(json.dumps({
            "budget_id": info.budget_id,
            "token_limit": info.token_limit,
            "tokens_remaining": info.tokens_remaining,
        }, indent=2))


@budget.command("check")
@click.argument("org_id")
@click.argument("agent_id")
@click.argument("estimated_tokens", type=int)
@click.pass_context
def budget_check(ctx: click.Context, org_id: str, agent_id: str, estimated_tokens: int) -> None:
    """Check if agent has budget for estimated tokens."""
    with _client(ctx) as c:
        result = c.budget.check(org_id, agent_id, estimated_tokens)
        click.echo(json.dumps({
            "allowed": result.allowed,
            "tokens_remaining": result.tokens_remaining,
            "reason": result.reason,
        }, indent=2))


@budget.command("usage")
@click.argument("org_id")
@click.option("--agent-id", default=None)
@click.pass_context
def budget_usage(ctx: click.Context, org_id: str, agent_id: str | None) -> None:
    """Get usage summary."""
    with _client(ctx) as c:
        usage = c.budget.get_usage(org_id, agent_id)
        click.echo(json.dumps({
            "total_tokens": usage.total_tokens,
            "total_tool_invocations": usage.total_tool_invocations,
            "total_duration_ms": usage.total_duration_ms,
            "report_count": usage.report_count,
        }, indent=2))


if __name__ == "__main__":
    cli()
