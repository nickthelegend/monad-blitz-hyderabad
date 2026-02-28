---
phase: 4
plan: 2
wave: 2
---

# Plan 4.2: Auto-Positioning & Leverage Logic

## Objective
Implement the logic that calculates optimal leverage and liquidation prices for the AI agent, and ensures positions are automatically closed when risk thresholds are met.

## Context
- .gsd/phases/4/1-PLAN.md
- contracts/dex/MolfiPerpDEX.sol

## Tasks

<task type="auto">
  <name>Implement Leverage & Risk Calculation</name>
  <files>src/lib/trade-logic.ts</files>
  <action>
    Create a utility library to:
    - Calculate liquidation price based on entry price and leverage (matching on-chain logic).
    - Suggest optimal leverage based on "Risk Appetite" (Conservative = 2x, Aggressive = 20x).
  </action>
  <verify>Run unit tests for risk math.</verify>
  <done>Math matches on-chain MolfiPerpDEX.getLiquidationPrice results.</done>
</task>

<task type="auto">
  <name>Position Tracking Dashboard</name>
  <files>src/app/trade/page.tsx</files>
  <action>
    Update the main trading terminal to:
    - Fetch active positions from the on-chain DEX or the local API.
    - Display real-time PnL and Margin status.
  </action>
  <verify>Visual verification of positions on /trade page.</verify>
  <done>User can see their open agent-managed positions with live data.</done>
</task>

## Success Criteria
- [ ] Risk logic correctly predicts on-chain liquidation thresholds.
- [ ] Frontend displays real-time position data and PnL.
