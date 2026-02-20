use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Org {
    pub org_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub agent_id: String,
    pub org_id: String,
    pub name: String,
    pub role: String,
    pub active: bool,
    pub delegated_user_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyDecision {
    pub allowed: bool,
    pub reason: String,
    pub policy_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetInfo {
    pub budget_id: String,
    pub token_limit: i64,
    pub tokens_used: i64,
    pub tokens_remaining: i64,
    pub tool_invocations: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetCheck {
    pub allowed: bool,
    pub tokens_remaining: i64,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageSummary {
    pub total_tokens: i64,
    pub total_tool_invocations: i32,
    pub total_duration_ms: i64,
    pub report_count: i32,
}
