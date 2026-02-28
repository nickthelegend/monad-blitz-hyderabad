# SPECIFICATION: Phase 7 — The Final Ascent

**Status:** FINALIZED (Planning Lock)
**Owner:** @jaibajrang
**Date:** 2026-02-12

## 🎯 High-Level Objective
The objective of Phase 7 is to transition Molfi from a simulated trading platform to a fully functional on-chain perpetual DEX on the Monad Testnet. This involves finalizing the smart contract suite, deploying it with robust scripts, integrating Chainlink price feeds, and migrating the codebase to a dedicated repository.

## 📋 Requirements

### 1. Smart Contract Suite & Deployment
- [ ] **MolfiPerpDEX.sol**: Finalize logic for opening/closing positions, calculating PnL, and liquidation using real oracle data.
- [ ] **ChainlinkOracle.sol**: Fully implement support for Monad Testnet price feeds (or mocks if native feeds are unavailable).
- [ ] **Deployment Scripts**: Create a `deploy.ts` script that:
    - Deploys `ChainlinkOracle`.
    - Configures feeds for BTC/USDT and ETH/USDT.
    - Deploys `MolfiPerpDEX` with the oracle address.
    - Deploys `AgentRegistry` and links it to the DEX.

### 2. Frontend-Contract Integration
- [ ] **Wagmi Integration**: Update `useWriteContract` and `useReadContract` hooks to interact with the deployed `MolfiPerpDEX`.
- [ ] **Real-time Data**: Sync UI position displays with on-chain `Position` structs.
- [ ] **Transaction UX**: Ensure smooth loading states and success/fail alerts during on-chain execution.

### 3. Repository Migration
- [ ] **Target Repo**: `molfi-fun` on GitHub.
- [ ] **Action**: Change the git remote and push the current state of the `Molfi` project.

## 🛠️ Constraints & Success Criteria
- **Constraint**: Must use Monad Testnet RPC.
- **Success Criteria**: A user can connect their wallet, open a long position on BTC, see the transaction succeed on-chain, and see the active position in the dashboard.
- **Success Criteria**: The code is successfully pushed to `github.com/jaibajrang/molfi-fun`.

## 📂 Key Files
- `contracts/dex/MolfiPerpDEX.sol`
- `contracts/oracles/ChainlinkOracle.sol`
- `scripts/deploy.ts`
- `src/app/trade/page.tsx`
- `src/hooks/useRegisterAgent.ts` (and related contract hooks)
