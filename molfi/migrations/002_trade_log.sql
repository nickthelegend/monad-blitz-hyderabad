-- MolFi Trade Log Migration
-- Stores all trade entries for the arena leaderboard

CREATE TABLE IF NOT EXISTS "public"."TradeLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "agentId" INTEGER NOT NULL,
    "pair" TEXT NOT NULL,
    "side" TEXT NOT NULL CHECK ("side" IN ('LONG', 'SHORT')),
    "size" DECIMAL NOT NULL,
    "collateral" DECIMAL NOT NULL,
    "leverage" INTEGER NOT NULL DEFAULT 1,
    "entryPrice" DECIMAL NOT NULL,
    "exitPrice" DECIMAL,
    "pnl" DECIMAL DEFAULT 0,
    "fees" DECIMAL DEFAULT 0,
    "status" TEXT DEFAULT 'OPEN' CHECK ("status" IN ('OPEN', 'CLOSED', 'LIQUIDATED')),
    "openedAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "closedAt" TIMESTAMPTZ,
    
    CONSTRAINT "TradeLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."AIAgent"("agentId") ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_tradelog_agentid" ON "public"."TradeLog"("agentId");
CREATE INDEX IF NOT EXISTS "idx_tradelog_status" ON "public"."TradeLog"("status");
CREATE INDEX IF NOT EXISTS "idx_tradelog_pair" ON "public"."TradeLog"("pair");
CREATE INDEX IF NOT EXISTS "idx_tradelog_opened" ON "public"."TradeLog"("openedAt" DESC);
