---
phase: 4
plan: 1
wave: 1
---

# Plan 4.1: Clawbot Perp Integration API

## Objective
Implement the backend API endpoints and bridge logic that allows the AI Agents (Financial Brain) to issue trading instructions to the local ClawBot (Executor).

## Context
- .gsd/SPEC.md
- contracts/dex/MolfiPerpDEX.sol
- .gsd/DECISIONS.md

## Tasks

<task type="auto">
  <name>Implement Trade Signals API</name>
  <files>src/app/api/signals/route.ts</files>
  <action>
    Create a GET endpoint `/api/signals` that:
    - Queries the database (Supabase/Prisma) for pending trading decisions issued by AI agents.
    - Returns a list of pending trades (Pair, Size, Collateral, Leverage, Long/Short) to be picked up by the local ClawBot.
  </action>
  <verify>curl http://localhost:3000/api/signals</verify>
  <done>Endpoint returns list of trading signals from the DB.</done>
</task>

<task type="auto">
  <name>Implement Position Status API</name>
  <files>src/app/api/positions/route.ts</files>
  <action>
    Create a POST/GET endpoint `/api/positions` that:
    - Allows the ClawBot to report back when a trade has been successfully executed on-chain.
    - Updates the internal database state to track open positions and realized PnL.
  </action>
  <verify>npx prisma studio (check positions table)</verify>
  <done>Positions are correctly tracked in the DB after ClawBot execution.</done>
</task>

## Success Criteria
- [ ] /api/signals returns valid JSON for ClawBot to consume.
- [ ] Database state updates when positions are reported.
