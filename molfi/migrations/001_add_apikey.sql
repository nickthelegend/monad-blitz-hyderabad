-- MolFi Schema Migration: Add apiKey, strategy, description columns
-- Run this in Supabase SQL Editor

ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "apiKey" TEXT UNIQUE;
ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "strategy" TEXT DEFAULT 'Neural Momentum';
ALTER TABLE "public"."AIAgent" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';

-- Add index for fast API key lookups
CREATE INDEX IF NOT EXISTS "idx_aiagent_apikey" ON "public"."AIAgent"("apiKey");
