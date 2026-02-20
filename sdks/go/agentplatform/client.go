// Package agentplatform provides a Go client for the Agent Platform control plane.
//
// Usage:
//
//	client, err := agentplatform.NewClient("localhost:50051")
//	org, err := client.CreateOrg(ctx, "my-company")
//	agent, err := client.RegisterAgent(ctx, org.OrgID, "assistant", "executor", "")
//	err = client.SetPolicy(ctx, org.OrgID, agent.AgentID, []string{"search"}, []string{"shell"}, 100000, 300)
package agentplatform

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// Client is the unified Agent Platform SDK client.
type Client struct {
	conn *grpc.ClientConn
}

// NewClient connects to the Agent Platform control plane.
func NewClient(address string) (*Client, error) {
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}
	return &Client{conn: conn}, nil
}

// Close closes the gRPC connection.
func (c *Client) Close() error {
	return c.conn.Close()
}

// --- Data types ---

// Org represents an organization.
type Org struct {
	OrgID string
	Name  string
}

// Agent represents a registered agent identity.
type Agent struct {
	AgentID         string
	OrgID           string
	Name            string
	Role            string
	Active          bool
	DelegatedUserID string
}

// PolicyDecision represents the result of a policy evaluation.
type PolicyDecision struct {
	Allowed  bool
	Reason   string
	PolicyID string
}

// BudgetInfo represents budget state.
type BudgetInfo struct {
	BudgetID        string
	TokenLimit      int64
	TokensUsed      int64
	TokensRemaining int64
	ToolInvocations int32
}

// BudgetCheck represents a pre-flight budget check result.
type BudgetCheck struct {
	Allowed         bool
	TokensRemaining int64
	Reason          string
}

// UsageSummary represents aggregated usage data.
type UsageSummary struct {
	TotalTokens          int64
	TotalToolInvocations int32
	TotalDurationMs      int64
	ReportCount          int32
}

// NOTE: Full gRPC method implementations require generated protobuf code.
// Generate with:
//   protoc --go_out=. --go-grpc_out=. ../../proto/agent_platform.proto
//
// The generated code provides the ControlPlaneClient interface that this
// SDK wraps with typed, ergonomic methods matching the Python and Rust SDKs.
//
// Each method follows the pattern:
//   func (c *Client) MethodName(ctx context.Context, args...) (Result, error)
//
// See examples/ directory for usage patterns.

// CreateOrg creates a new organization.
func (c *Client) CreateOrg(ctx context.Context, name string) (*Org, error) {
	// Implementation uses generated ControlPlaneClient from proto
	// Placeholder until proto generation is run
	return &Org{Name: name}, nil
}

// RegisterAgent registers an agent under an organization.
func (c *Client) RegisterAgent(ctx context.Context, orgID, name, role, delegatedUserID string) (*Agent, error) {
	return &Agent{
		OrgID:           orgID,
		Name:            name,
		Role:            role,
		DelegatedUserID: delegatedUserID,
	}, nil
}

// EvaluatePolicy checks if an agent can use a specific tool.
func (c *Client) EvaluatePolicy(ctx context.Context, orgID, agentID, toolName string, estimatedTokens int64) (*PolicyDecision, error) {
	return &PolicyDecision{}, nil
}

// CheckBudget performs a pre-flight budget check.
func (c *Client) CheckBudget(ctx context.Context, orgID, agentID string, estimatedTokens int64) (*BudgetCheck, error) {
	return &BudgetCheck{}, nil
}
