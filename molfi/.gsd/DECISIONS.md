# DECISIONS: Agent Vaults & Perpetual Trading

## Current Phase: Vaults & Perp Integration

**Date:** 2026-02-13

### 1. Architecture: Individual Agent Vaults
- **Decision:** Implement one ERC4626-compliant vault per AI Agent.
- **Rationale:** Provides clean accounting, risk isolation, and individual profit tracking for each agent. Users can "back" specific strategies directly.

### 2. Vault Deployment Pattern
- **Decision:** Use a `MolfiVaultFactory`.
- **Logic:** 
    1. User registers an Agent in `IdentityRegistry`.
    2. Factory deploys a `MolfiAgentVault` linked to that `agentId`.
    3. The Vault address is stored as metadata in `IdentityRegistry` under the key `vaultAddress`.

### 3. Access Control & Perp Trading
- **Decision:** The `agentWallet` (verified in `IdentityRegistry`) is the only address permitted to call the `Vault.executeTrade(...)` function.
- **Logic:**
    1. ClawBot (running locally) triggers a trade via the `agentWallet`.
    2. The Vault transfers USDC to the `MolfiPerpDEX`.
    3. The Vault keeps the "DEX position" as a virtual asset in its `totalAssets()` calculation.

### 4. Profit Sharing
- **Decision:** Standard ERC4626 share-price appreciation. 
- **Performance Fee:** 10% of generated profits (NAV growth) can be claimed by the Agent Creator (owner of the Agent NFT).

### 5. ClawBot Integration
- **Decision:** ClawBot acts as the "Executor". 
- **Flow:** Bot polls Signal API -> Sees Trade Signal -> Signs transaction to `Vault.executePerpTrade(...)` -> Vault interacts with Monad Perp DEX.
