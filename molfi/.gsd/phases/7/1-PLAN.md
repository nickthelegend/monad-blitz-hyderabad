---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Smart Contract Genesis & Deployment

## Objective
The goal of this plan is to deploy the core smart contract infrastructure for the Molfi Perpetuals DEX to the Monad Testnet. This includes fixing dependencies, creating the deployment pipeline, and exporting contract data for the frontend.

## Context
- .gsd/SPEC.md
- contracts/dex/MolfiPerpDEX.sol
- contracts/oracles/ChainlinkOracle.sol
- hardhat.config.ts

## Tasks

<task type="auto">
  <name>Install Chainlink Dependencies</name>
  <files>package.json</files>
  <action>
    Install the Chainlink smart contract library to resolve AggregatorV3Interface imports.
    - Run: npm install @chainlink/contracts --save-dev
  </action>
  <verify>npm list @chainlink/contracts</verify>
  <done>package.json contains @chainlink/contracts</done>
</task>

<task type="auto">
  <name>Create Deployment Script</name>
  <files>scripts/deploy_dex.ts</files>
  <action>
    Create a Hardhat deployment script to:
    1. Deploy ChainlinkOracle.
    2. Configure price feeds for BTC/USD (0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31) and ETH/USD (0x0c76859E85727683Eeba0C70Bc2e0F5781337818) on Monad Testnet.
    3. Deploy MolfiPerpDEX with the oracle address.
    4. Deploy AgentRegistry (if not already deployed) and link to DEX.
  </action>
  <verify>npx hardhat compile</verify>
  <done>Script exists and contracts compile without errors.</done>
</task>

<task type="auto">
  <name>Execute Deployment & Export Artifacts</name>
  <files>src/lib/contracts/addresses.json</files>
  <action>
    Execute the deployment to Monad Testnet and save the resulting addresses and ABIs for frontend use.
    - Run: npx hardhat run scripts/deploy_dex.ts --network monadTestnet
    - Ensure DEPLOYER_PRIVATE_KEY is in .env.local
  </action>
  <verify>Test the monadTestnet connection and confirm successful deployment logs.</verify>
  <done>addresses.json exists with valid contract addresses on Monad Testnet.</done>
</task>

## Success Criteria
- [ ] MolfiPerpDEX and ChainlinkOracle deployed to Monad Testnet.
- [ ] Price feeds correctly configured for BTC and ETH.
- [ ] Contract addresses exported to frontend lib.
