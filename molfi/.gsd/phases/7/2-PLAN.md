---
phase: 7
plan: 2
wave: 1
---

# Plan 7.2: On-chain Trading Integration

## Objective
Connect the frontend "Perpetuals" trading interface to the live on-chain MolfiPerpDEX contracts. This replaces mock interactions with real smart contract calls on the Monad Testnet.

## Context
- src/app/trade/page.tsx
- src/lib/contracts/addresses.json
- src/hooks/useTrade.ts (to be created/updated)

## Tasks

<task type="auto">
  <name>Implement useTrade Hook</name>
  <files>src/hooks/useTrade.ts</files>
  <action>
    Create a robust hook using wagmi to interact with MolfiPerpDEX.
    - Implement `openPosition` with parameters (agent, pair, size, collateral, leverage, isLong).
    - Implement `closePosition` for specific position IDs.
    - Implement `getTraderPositions` to fetch active contracts for the connected wallet.
  </action>
  <verify>Check hook exports and types.</verify>
  <done>Hook exists and correctly references the deployed contract addresses.</done>
</task>

<task type="auto">
  <name>Integrate Real Trading Logic in UI</name>
  <files>src/app/trade/page.tsx</files>
  <action>
    Replace the mock trade alerts in `TradePageContent` with actual transaction calls.
    - Connect the "OPEN LONG/SHORT" buttons to the `openPosition` hook.
    - Fetch and display real active positions from the contract in the "ACTIVE CONTRACTS" section.
    - Calculate liquidation price and PnL on-chain using oracle data.
  </action>
  <verify>Manual verification of "OPEN LONG" triggering a wallet signature.</verify>
  <done>Trading UI reflects real on-chain state and handles transactions.</done>
</task>

<task type="auto">
  <name>Final UX Polish: Transaction Alerting</name>
  <files>src/app/trade/page.tsx</files>
  <action>
    Add feedback loops for on-chain transactions.
    - Show `Loader2` during transaction pending.
    - Trigger `AlertCenter` notifications for contract success/error.
    - Auto-refresh the positions list after a successful trade.
  </action>
  <verify>Successful transaction displays a notification.</verify>
  <done>Professional transaction UX with real-time feedback.</done>
</task>

## Success Criteria
- [ ] Users can open and close perp positions on Monad Testnet from the UI.
- [ ] Active positions are fetched from the DEX contract.
- [ ] Transaction state is clearly communicated to the user.
