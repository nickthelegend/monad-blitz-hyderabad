-- Add api_key to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS strategy TEXT DEFAULT 'Neural Momentum';

-- Migrate data from old AIAgent table to new agents table
INSERT INTO agents (
    agent_id,
    name,
    personality,
    vault_address,
    owner_address,
    created_at,
    updated_at,
    api_key,
    description,
    strategy
)
SELECT 
    "agentId",
    name,
    personality,
    "vaultAddress",
    "ownerAddress",
    "createdAt",
    "updatedAt",
    "apiKey",
    description,
    strategy
FROM "AIAgent"
ON CONFLICT (agent_id) DO UPDATE SET
    api_key = EXCLUDED.api_key,
    description = EXCLUDED.description,
    strategy = EXCLUDED.strategy,
    owner_address = EXCLUDED.owner_address;

-- Migrate data from TradeLog to trade_signals (Map camelCase to snake_case)
INSERT INTO trade_signals (
    agent_id,
    pair,
    size,
    collateral,
    leverage,
    is_long,
    status,
    entry_price,
    exit_price,
    pnl,
    fees,
    side,
    opened_at,
    closed_at,
    created_at
)
SELECT 
    "agentId",
    pair,
    size,
    collateral,
    leverage,
    (CASE WHEN side = 'LONG' THEN true ELSE false END),
    status,
    "entryPrice",
    "exitPrice",
    pnl,
    fees,
    side,
    "openedAt",
    "closedAt",
    "openedAt"
FROM "TradeLog"
-- Avoid duplicates by checking if record exists (basic check)
WHERE NOT EXISTS (
    SELECT 1 FROM trade_signals ts 
    WHERE ts.agent_id = "TradeLog"."agentId" 
    AND ts.opened_at = "TradeLog"."openedAt"
);
