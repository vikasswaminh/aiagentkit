use crate::error::{Result, SdkError};
use crate::models::*;
use crate::proto::control_plane_client::ControlPlaneClient;
use crate::proto::*;
use tonic::transport::Channel;

/// Unified client for the Agent Platform control plane.
///
/// # Example
/// ```no_run
/// use agent_platform_sdk::AgentPlatformClient;
///
/// #[tokio::main]
/// async fn main() {
///     let mut client = AgentPlatformClient::connect("http://localhost:50051").await.unwrap();
///     let org = client.create_org("my-company").await.unwrap();
///     let agent = client.register_agent(&org.org_id, "assistant", "executor", None).await.unwrap();
/// }
/// ```
pub struct AgentPlatformClient {
    inner: ControlPlaneClient<Channel>,
}

impl AgentPlatformClient {
    pub async fn connect(addr: &str) -> Result<Self> {
        let inner = ControlPlaneClient::connect(addr.to_string()).await?;
        Ok(Self { inner })
    }

    // --- Organizations ---

    pub async fn create_org(&mut self, name: &str) -> Result<Org> {
        let resp = self
            .inner
            .create_organization(CreateOrgRequest {
                name: name.to_string(),
                metadata: None,
            })
            .await?
            .into_inner();
        Ok(Org {
            org_id: resp.org_id,
            name: resp.name,
        })
    }

    pub async fn get_org(&mut self, org_id: &str) -> Result<Org> {
        let resp = self
            .inner
            .get_organization(GetOrgRequest {
                org_id: org_id.to_string(),
            })
            .await?
            .into_inner();
        Ok(Org {
            org_id: resp.org_id,
            name: resp.name,
        })
    }

    pub async fn list_orgs(&mut self) -> Result<Vec<Org>> {
        let resp = self
            .inner
            .list_organizations(ListOrgsRequest {})
            .await?
            .into_inner();
        Ok(resp
            .organizations
            .into_iter()
            .map(|o| Org {
                org_id: o.org_id,
                name: o.name,
            })
            .collect())
    }

    pub async fn delete_org(&mut self, org_id: &str) -> Result<bool> {
        let resp = self
            .inner
            .delete_organization(DeleteOrgRequest {
                org_id: org_id.to_string(),
            })
            .await?
            .into_inner();
        Ok(resp.success)
    }

    // --- Agents ---

    pub async fn register_agent(
        &mut self,
        org_id: &str,
        name: &str,
        role: &str,
        delegated_user_id: Option<&str>,
    ) -> Result<Agent> {
        let resp = self
            .inner
            .register_agent(RegisterAgentRequest {
                org_id: org_id.to_string(),
                name: name.to_string(),
                role: role.to_string(),
                delegated_user_id: delegated_user_id.unwrap_or("").to_string(),
                token_claims: None,
            })
            .await?
            .into_inner();
        Ok(Agent {
            agent_id: resp.agent_id,
            org_id: resp.org_id,
            name: resp.name,
            role: resp.role,
            active: resp.active,
            delegated_user_id: if resp.delegated_user_id.is_empty() {
                None
            } else {
                Some(resp.delegated_user_id)
            },
        })
    }

    pub async fn list_agents(&mut self, org_id: &str) -> Result<Vec<Agent>> {
        let resp = self
            .inner
            .list_agents(ListAgentsRequest {
                org_id: org_id.to_string(),
            })
            .await?
            .into_inner();
        Ok(resp
            .agents
            .into_iter()
            .map(|a| Agent {
                agent_id: a.agent_id,
                org_id: a.org_id,
                name: a.name,
                role: a.role,
                active: a.active,
                delegated_user_id: None,
            })
            .collect())
    }

    pub async fn deactivate_agent(&mut self, org_id: &str, agent_id: &str) -> Result<bool> {
        let resp = self
            .inner
            .deactivate_agent(DeactivateAgentRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.to_string(),
            })
            .await?
            .into_inner();
        Ok(resp.success)
    }

    // --- Policy ---

    pub async fn set_policy(
        &mut self,
        org_id: &str,
        agent_id: Option<&str>,
        allowed_tools: &[&str],
        denied_tools: &[&str],
        token_limit: i64,
        timeout_seconds: i32,
    ) -> Result<String> {
        let mut tools = Vec::new();
        for t in allowed_tools {
            tools.push(ToolPermissionProto {
                tool_name: t.to_string(),
                effect: "allow".to_string(),
                parameters_constraint: None,
            });
        }
        for t in denied_tools {
            tools.push(ToolPermissionProto {
                tool_name: t.to_string(),
                effect: "deny".to_string(),
                parameters_constraint: None,
            });
        }
        let resp = self
            .inner
            .set_policy(SetPolicyRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.unwrap_or("").to_string(),
                tools,
                token_limit,
                execution_timeout_seconds: timeout_seconds,
            })
            .await?
            .into_inner();
        Ok(resp.policy_id)
    }

    pub async fn evaluate_policy(
        &mut self,
        org_id: &str,
        agent_id: &str,
        tool_name: &str,
        estimated_tokens: i64,
    ) -> Result<PolicyDecision> {
        let resp = self
            .inner
            .evaluate_policy(EvaluatePolicyRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.to_string(),
                tool_name: tool_name.to_string(),
                estimated_tokens,
                context: None,
            })
            .await?
            .into_inner();
        Ok(PolicyDecision {
            allowed: resp.allowed,
            reason: resp.reason,
            policy_id: if resp.matched_policy_id.is_empty() {
                None
            } else {
                Some(resp.matched_policy_id)
            },
        })
    }

    // --- Budget ---

    pub async fn set_budget(
        &mut self,
        org_id: &str,
        agent_id: Option<&str>,
        token_limit: i64,
        reset_period_days: i32,
    ) -> Result<BudgetInfo> {
        let resp = self
            .inner
            .set_budget(SetBudgetRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.unwrap_or("").to_string(),
                token_limit,
                reset_period_days,
            })
            .await?
            .into_inner();
        Ok(BudgetInfo {
            budget_id: resp.budget_id,
            token_limit: resp.token_limit,
            tokens_used: resp.tokens_used,
            tokens_remaining: resp.tokens_remaining,
            tool_invocations: resp.tool_invocations,
        })
    }

    pub async fn check_budget(
        &mut self,
        org_id: &str,
        agent_id: &str,
        estimated_tokens: i64,
    ) -> Result<BudgetCheck> {
        let resp = self
            .inner
            .check_budget(CheckBudgetRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.to_string(),
                estimated_tokens,
            })
            .await?
            .into_inner();
        Ok(BudgetCheck {
            allowed: resp.allowed,
            tokens_remaining: resp.tokens_remaining,
            reason: resp.reason,
        })
    }

    pub async fn report_usage(
        &mut self,
        org_id: &str,
        agent_id: &str,
        execution_id: &str,
        tokens_used: i64,
        tool_invocations: i32,
        duration_ms: i64,
    ) -> Result<i64> {
        let resp = self
            .inner
            .report_usage(ReportUsageRequest {
                org_id: org_id.to_string(),
                agent_id: agent_id.to_string(),
                execution_id: execution_id.to_string(),
                tokens_used,
                tool_invocations,
                execution_duration_ms: duration_ms,
                tool_name: String::new(),
            })
            .await?
            .into_inner();
        Ok(resp.tokens_remaining)
    }
}
