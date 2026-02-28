-- Create agent_decisions table to replace AgentSignal
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id BIGINT REFERENCES agents(agent_id),
  action TEXT NOT NULL, -- BUY, SELL, HOLD
  pair TEXT NOT NULL,
  confidence NUMERIC,
  reasoning TEXT,
  price NUMERIC,
  proof_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for querying decisions by agent
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent_id ON agent_decisions(agent_id);
