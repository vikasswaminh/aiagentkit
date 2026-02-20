# Rate limiting policy — restrict tool calls per time window
package agent_platform.policy.rate_limit

default allow := false

# Max 100 tool invocations per agent per hour
max_invocations_per_hour := 100

allow if {
    input.tool_invocations_last_hour < max_invocations_per_hour
    not deny
}

deny if {
    input.tool_name == "shell"
}

deny if {
    input.estimated_tokens > 50000
}
