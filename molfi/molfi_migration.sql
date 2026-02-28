-- MolFi: Autonomous AI Hedge Fund SQL Schema
-- Optimized for Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
DO $$ BEGIN
    CREATE TYPE "PositionSide" AS ENUM ('LONG', 'SHORT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PositionStatus" AS ENUM ('OPEN', 'CLOSED', 'LIQUIDATED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RiskLevel" AS ENUM ('CONSERVATIVE', 'BALANCED', 'AGGRESSIVE', 'DEGENERATE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Fund Managers (AI Agents)
CREATE TABLE IF NOT EXISTS "FundManager" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "avatarUrl" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "riskLevel" "RiskLevel" DEFAULT 'BALANCED',
    "model" TEXT DEFAULT 'gpt-4o',
    "totalRoi" DOUBLE PRECISION DEFAULT 0.0,
    "totalAum" DOUBLE PRECISION DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vaults (Pools managed by Agents)
CREATE TABLE IF NOT EXISTS "Vault" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "managerId" UUID NOT NULL REFERENCES "FundManager"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "tvl" DOUBLE PRECISION DEFAULT 0.0,
    "sharePrice" DOUBLE PRECISION DEFAULT 1.0,
    "totalDeposits" DOUBLE PRECISION DEFAULT 0.0,
    "maxCapacity" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Perpetual Positions (Clawbot Auto-Trading)
CREATE TABLE IF NOT EXISTS "Position" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vaultId" UUID NOT NULL REFERENCES "Vault"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL, -- e.g. BTC-PERP, ETH-PERP
    "side" "PositionSide" NOT NULL,
    "leverage" DOUBLE PRECISION DEFAULT 1.0,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "liquidationPrice" DOUBLE PRECISION,
    "markPrice" DOUBLE PRECISION,
    "margin" DOUBLE PRECISION NOT NULL,
    "size" DOUBLE PRECISION NOT NULL, -- Position size in base asset
    "unrealizedPnl" DOUBLE PRECISION DEFAULT 0.0,
    "status" "PositionStatus" DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "exitPrice" DOUBLE PRECISION
);

-- User Deposits
CREATE TABLE IF NOT EXISTS "Deposit" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vaultId" UUID NOT NULL REFERENCES "Vault"("id") ON DELETE CASCADE,
    "walletAddress" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "shares" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- History of Executed Trades
CREATE TABLE IF NOT EXISTS "Trade" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "vaultId" UUID NOT NULL REFERENCES "Vault"("id") ON DELETE CASCADE,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "pnl" DOUBLE PRECISION, -- For closed positions
    "fee" DOUBLE PRECISION,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Protocol-wide Stats
CREATE TABLE IF NOT EXISTS "ProtocolStats" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "totalTvl" DOUBLE PRECISION DEFAULT 0.0,
    "activeVaults" INTEGER DEFAULT 0,
    "totalUsers" INTEGER DEFAULT 0,
    "totalYieldGenerated" DOUBLE PRECISION DEFAULT 0.0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS "Position_vaultId_idx" ON "Position"("vaultId");
CREATE INDEX IF NOT EXISTS "Position_status_idx" ON "Position"("status");
CREATE INDEX IF NOT EXISTS "Vault_managerId_idx" ON "Vault"("managerId");
CREATE INDEX IF NOT EXISTS "Deposit_walletAddress_idx" ON "Deposit"("walletAddress");
CREATE INDEX IF NOT EXISTS "Trade_vaultId_idx" ON "Trade"("vaultId");
