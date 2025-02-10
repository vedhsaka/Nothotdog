-- Organizations and Users
CREATE TABLE organizations (
    id uuid NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE profiles (
    id uuid NOT NULL PRIMARY KEY,
    clerk_id text NOT NULL UNIQUE,
    org_id uuid REFERENCES organizations(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE org_members (
    id uuid NOT NULL PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES organizations(id),
    user_id uuid NOT NULL REFERENCES profiles(id),
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    status text NOT NULL CHECK (status IN ('active', 'invited', 'disabled')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Agent Configuration
CREATE TABLE agent_configs (
    id uuid NOT NULL PRIMARY KEY,
    name text NOT NULL,
    endpoint text NOT NULL,
    input_format jsonb,
    org_id uuid NOT NULL REFERENCES organizations(id),
    created_by uuid NOT NULL REFERENCES profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE agent_descriptions (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    description text NOT NULL,
    updated_by uuid REFERENCES profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE agent_user_descriptions (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    description text NOT NULL,
    updated_by uuid REFERENCES profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE agent_headers (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    key text NOT NULL,
    value text NOT NULL,
    is_sensitive boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE agent_outputs (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    response_data jsonb NOT NULL,
    response_time integer,
    status text NOT NULL CHECK (status IN ('success', 'failed')),
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE validation_rules (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    path text NOT NULL,
    condition text NOT NULL,
    expected_value text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Personas
CREATE TABLE personas (
    id uuid NOT NULL PRIMARY KEY,
    org_id uuid NOT NULL REFERENCES organizations(id),
    name text NOT NULL,
    description text,
    system_prompt text NOT NULL,
    min_conversation_turns integer DEFAULT 1,
    example_messages jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE agent_persona_mappings (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    persona_id uuid NOT NULL REFERENCES personas(id),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (agent_id, persona_id)
);

-- Testing
CREATE TABLE test_scenarios (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    name text NOT NULL,
    description text,
    input text NOT NULL,
    expected_output text NOT NULL,
    category text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE test_runs (
    id uuid NOT NULL PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES agent_configs(id),
    name text NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    total_tests integer DEFAULT 0,
    passed_tests integer DEFAULT 0,
    failed_tests integer DEFAULT 0,
    created_by uuid NOT NULL REFERENCES profiles(id),
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE test_conversations (
    id uuid NOT NULL PRIMARY KEY,
    run_id uuid NOT NULL REFERENCES test_runs(id),
    scenario_id uuid NOT NULL REFERENCES test_scenarios(id),
    persona_id uuid NOT NULL REFERENCES personas(id),
    status text NOT NULL CHECK (status IN ('running', 'passed', 'failed')),
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE conversation_messages (
    id uuid NOT NULL PRIMARY KEY,
    conversation_id uuid NOT NULL REFERENCES test_conversations(id),
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    is_correct boolean,
    response_time integer,
    validation_score double precision,
    metrics jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE INDEX idx_agent_configs_org ON agent_configs(org_id);
CREATE INDEX idx_agent_outputs_agent ON agent_outputs(agent_id);
CREATE INDEX idx_agent_descriptions_agent ON agent_descriptions(agent_id);
CREATE INDEX idx_agent_user_descriptions_agent ON agent_user_descriptions(agent_id);
CREATE INDEX idx_personas_org ON personas(org_id);
CREATE INDEX idx_test_runs_config ON test_runs(agent_id);
CREATE INDEX idx_test_runs_status ON test_runs(status);
CREATE INDEX idx_test_conversations_run ON test_conversations(run_id);
CREATE INDEX idx_test_conversations_status ON test_conversations(status);
CREATE INDEX idx_conversation_messages_conv ON conversation_messages(conversation_id);