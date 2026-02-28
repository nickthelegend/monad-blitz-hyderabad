---
phase: 3
plan: 2
wave: 2
---

# Plan 3.2: Identity Registry Integration

## Objective
Update the `IdentityRegistry` and the frontend launch flow to automatically deploy a vault and link it to the agent's identity.

## Context
- .gsd/phases/3/1-PLAN.md
- contracts/IdentityRegistryUpgradeable.sol
- src/app/launch/page.tsx

## Tasks

<task type="auto">
  <name>Update IdentityRegistry with Vault Metadata</name>
  <files>contracts/IdentityRegistryUpgradeable.sol, scripts/link-vault-logic.ts</files>
  <action>
    - Add a convenience function to `IdentityRegistryUpgradeable` (or use existing metadata logic) to store the `vaultAddress`.
    - Create a script or update existing registration script to call the `VaultFactory` immediately after registration.
  </action>
  <verify>npx hardhat compile</verify>
  <done>IdentityRegistry can store and retrieve agent vault addresses.</done>
</task>

<task type="auto">
  <name>Frontend: Update Launch Flow to include Vault Deployment</name>
  <files>src/app/launch/page.tsx</files>
  <action>
    - Update the deployment simulation (and actual hook) to include the vault deployment step.
    - Display the "Vault Address" in the success terminal.
  </action>
  <verify>Check frontend UI renders the vault address after simulation.</verify>
  <done>User sees their individual agent vault address in the success screen.</done>
</task>

## Success Criteria
- [ ] Registered agents have a `vaultAddress` associated with them in the registry.
- [ ] Frontend displays the vault address upon successful launch.
