---
phase: 3
plan: 1
wave: 1
---

# Plan 3.1: MolfiAgentVault Implementation

## Objective
Implement an ERC4626-compliant vault that allows users to deposit USDC and enables an authorized Agent (ClawBot) to execute perpetual trades on the `MolfiPerpDEX`.

## Context
- .gsd/SPEC.md
- .gsd/DECISIONS.md
- contracts/dex/MolfiPerpDEX.sol (Target DEX to integrate with)
- contracts/IdentityRegistryUpgradeable.sol (To verify agent identity)

## Tasks

<task type="auto">
  <name>Implement MolfiAgentVault.sol</name>
  <files>contracts/MolfiAgentVault.sol</files>
  <action>
    Create a new contract `MolfiAgentVault` that:
    - Inherits from OpenZeppelin's `ERC4626Upgradeable` and `OwnableUpgradeable`.
    - Implements `totalAssets()` to include the locked margin in the Perp DEX.
    - Implements `executePerpTrade(...)` which can ONLY be called by the `agentWallet` verified in the registration.
    - Interacts with `MolfiPerpDEX.openPosition(...)` and `closePosition(...)`.
    - Handles performance fee calculations (10% of profit on withdrawal or periodic).
  </action>
  <verify>npx hardhat compile</verify>
  <done>The contract compiles and includes logic to call MolfiPerpDEX functions.</done>
</task>

<task type="auto">
  <name>Implement MolfiVaultFactory.sol</name>
  <files>contracts/MolfiVaultFactory.sol</files>
  <action>
    Create a `MolfiVaultFactory` that:
    - Can deploy a new `MolfiAgentVault` for a specific `agentId`.
    - Links the deployed vault to the `IdentityRegistry` via metadata or a mapping.
    - Emits a `VaultDeployed(uint256 indexed agentId, address vaultAddress)` event.
  </action>
  <verify>npx hardhat compile</verify>
  <done>Factory successfully deploys clones or new instances of MolfiAgentVault.</done>
</task>

## Success Criteria
- [ ] MolfiAgentVault compiles with ERC4626 compatibility.
- [ ] MolfiVaultFactory can deploy vaults.
- [ ] Agent-specific execution role is enforced in the Vault.
