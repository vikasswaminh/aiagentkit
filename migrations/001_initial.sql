-- Agent Platform: Initial schema
-- All tables use JSONB 'data' column for flexible model storage
-- The key column enables the Store[T] interface pattern

CREATE TABLE IF NOT EXISTS organizations (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policies (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_reports (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_entries (
    key TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_agents_org ON agents ((data->>'org_id'));
CREATE INDEX IF NOT EXISTS idx_policies_org ON policies ((data->>'org_id'));
CREATE INDEX IF NOT EXISTS idx_budgets_org ON budgets ((data->>'org_id'));
CREATE INDEX IF NOT EXISTS idx_usage_org_agent ON usage_reports ((data->>'org_id'), (data->>'agent_id'));
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_entries ((data->>'org_id'));
CREATE INDEX IF NOT EXISTS idx_audit_agent ON audit_entries ((data->>'agent_id'));
CREATE INDEX IF NOT EXISTS idx_audit_execution ON audit_entries ((data->>'execution_id'));
