# Time-of-day policy — restrict agent execution to business hours
package agent_platform.policy.business_hours

default allow := false

# Allow execution only during business hours (UTC)
allow if {
    input.hour >= 8
    input.hour < 18
    not deny
}

deny if {
    input.tool_name == "shell"
}

# Allow admin role at any time
allow if {
    input.role == "admin"
}
