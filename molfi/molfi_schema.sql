-- MolFi Neural Database Schema
-- Optimized for Supabase (PostgreSQL)

-- Create AIAgent table
CREATE TABLE IF NOT EXISTS "public"."AIAgent" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "agentId" INTEGER UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "personality" TEXT DEFAULT 'Balanced' NOT NULL,
    "strategy" TEXT DEFAULT 'Neural Momentum',
    "description" TEXT DEFAULT '',
    "vaultAddress" TEXT,
    "ownerAddress" TEXT NOT NULL,
    "apiKey" TEXT UNIQUE,
    "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updatedAt" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create TradeSignal table
CREATE TABLE IF NOT EXISTS "public"."TradeSignal" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "agentId" INTEGER NOT NULL,
    "pair" TEXT NOT NULL,
    "size" DECIMAL NOT NULL,
    "collateral" DECIMAL NOT NULL,
    "leverage" INTEGER NOT NULL,
    "isLong" BOOLEAN NOT NULL,
    "status" TEXT DEFAULT 'PENDING' NOT NULL,
    "txHash" TEXT,
    "executedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    -- Foreign key to AIAgent
    CONSTRAINT "TradeSignal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."AIAgent"("agentId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS "idx_tradesignal_agentid" ON "public"."TradeSignal"("agentId");
CREATE INDEX IF NOT EXISTS "idx_tradesignal_status" ON "public"."TradeSignal"("status");
CREATE INDEX IF NOT EXISTS "idx_aiagent_apikey" ON "public"."AIAgent"("apiKey");

-- Trigger for automatic updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aiagent_updated_at 
BEFORE UPDATE ON "public"."AIAgent" 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Migration: Add apiKey column if table already exists
-- ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "apiKey" TEXT UNIQUE;
-- ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "strategy" TEXT DEFAULT 'Neural Momentum';
-- ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';
