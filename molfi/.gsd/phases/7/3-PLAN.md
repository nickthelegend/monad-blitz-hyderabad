---
phase: 7
plan: 3
wave: 2
---

# Plan 7.3: Molfi-Fun Repo Migration & Final Release

## Objective
Finalize the Molfi project by migrating it to its official repository on GitHub and performing a final end-to-end verification of the deployed system.

## Context
- git configuration
- gh cli

## Tasks

<task type="auto">
  <name>Create and Migrate to Official Repository</name>
  <files>.</files>
  <action>
    Create the official `molfi-fun` repository and migrate the project remote.
    - Run: gh repo create molfi-fun --public --source=. --remote=origin --push
    - Ensure all secrets are removed or moved to .env.local (ignored by git).
  </action>
  <verify>Check github.com/jaibajrang/molfi-fun for code availability.</verify>
  <done>Codebase is live on the new official remote repository.</done>
</task>

<task type="auto">
  <name>Final End-to-End Genesis Test</name>
  <files>ROADMAP.md</files>
  <action>
    Perform a complete flow verification on the production-ready build.
    1. Wallet Connection.
    2. Agent Registration (Setup).
    3. Deposit Collateral.
    4. Open Perp Position on DEX.
    5. Verify Position visibility in Analytics/Trade pages.
  </action>
  <verify>Successful end-to-end flow on Monad Testnet.</verify>
  <done>All roadmap items in Phase 7 are checked off.</done>
</task>

## Success Criteria
- [ ] Project pushed to `molfi-fun` remote.
- [ ] Working DEX available for use on Monad Testnet.
- [ ] Phase 7 completed and archived.
