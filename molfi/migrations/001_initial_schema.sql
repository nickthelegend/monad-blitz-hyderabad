-- Create Agents Table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id BIGINT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  personality TEXT DEFAULT 'Balanced',
  vault_address TEXT,
  owner_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Trade Signals Table (Linked to Agents)
CREATE TABLE IF NOT EXISTS trade_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id BIGINT REFERENCES agents(agent_id),
  pair TEXT NOT NULL,
  size NUMERIC NOT NULL,
  collateral NUMERIC NOT NULL,
  leverage INTEGER NOT NULL,
  is_long BOOLEAN NOT NULL,
  status TEXT DEFAULT 'PENDING',
  tx_hash TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Investments Table (Linked to Agents & Users)
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT UNIQUE NOT NULL,
  agent_id BIGINT REFERENCES agents(agent_id),
  user_address TEXT NOT NULL,
  amount NUMERIC NOT NULL, -- Amount in Underlying Asset (e.g. USDT)
  shares NUMERIC NOT NULL, -- Shares received from Vault
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, WITHDRAWN
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  withdrawn_tx_hash TEXT
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_investments_user_address ON investments(user_address);
CREATE INDEX IF NOT EXISTS idx_investments_agent_id ON investments(agent_id);
CREATE INDEX IF NOT EXISTS idx_trade_signals_agent_id ON trade_signals(agent_id);

-- Enable RLS (Row Level Security) - Optional but recommended
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own investments
CREATE POLICY "Users can view own investments" ON investments
  FOR SELECT USING (user_address = auth.uid()::text);

-- Policy: Public can view agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public agents view" ON agents FOR SELECT USING (true);
