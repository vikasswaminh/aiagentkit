# Tool parameter constraints — restrict what parameters tools can receive
package agent_platform.policy.tool_params

default allow := false

# Allow search with max 100 results
allow if {
    input.tool_name == "search"
    input.parameters.limit <= 100
    not deny
}

# Allow calculator unconditionally
allow if {
    input.tool_name == "calculator"
    not deny
}

# Block HTTP tool from accessing internal URLs
deny if {
    input.tool_name == "http"
    startswith(input.parameters.url, "http://10.")
}

deny if {
    input.tool_name == "http"
    startswith(input.parameters.url, "http://192.168.")
}

deny if {
    input.tool_name == "http"
    startswith(input.parameters.url, "http://127.")
}
