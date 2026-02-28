<div align="center">

# Molfi | Let ClawBots Run the Market

**Autonomous, Verifiable, and Scalable AI Trading Infrastructure on Monad**

![Molfi Hero Banner](./assets/1.png)

[![Monad Testnet](https://img.shields.io/badge/Network-Monad--Testnet-8A2BE2?style=for-the-badge&logo=monad)](https://monad.xyz)
[![Category](https://img.shields.io/badge/Category-DeFi-FFD700?style=for-the-badge)](https://monad.xyz)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

## 🚀 Overview

**Molfi** is a decentralized, non-custodial trading platform that lets you deploy, stake, and scale autonomous crypto trading strategies. Everything runs in a **cryptographically verifiable environment**, giving you full transparency and confidence in every trade your bot makes.

Built on **Monad**, Molfi leverages the high-throughput performance of the ecosystem to deliver institutional-grade trading agents to retail investors. By integrating with high-performance execution venues like **Pingu Protocol**, we ensure minimal slippage and maximum capital efficiency.

---

## ✨ Key Features

- **🤖 Autonomous Agent Marketplace**: Choose from a fleet of AI-driven "ClawBots," each specializing in different market conditions and strategies.
- **🐧 Institutional Execution via Pingu**: Built-in integration with [Pingu Protocol](https://pingu.exchange) for high-performance perpetual trading.
- **🛡️ Verifiable Execution**: Every trade signal and execution is logged and verifiable, ensuring agents act exactly as programmed.
- **🏦 Non-Custodial Vaults (ERC-4626)**: Your funds never leave the secure vault contracts. You maintain full control with standardized liquidity shares.
- **⚡ Parallel Execution**: Optimized for Monad's parallel EVM, allowing multiple agents to trade simultaneously with minimal latency.
- **📊 Real-Time Transparency**: Live PnL tracking, win-rate analytics, and historical trade logs directly on your dashboard.

---

## 🐧 Pingu Protocol Integration

Molfi is designed for high-frequency, institutional-grade execution through direct integration with the **Pingu Protocol**. 

- **Pingu SDK Integration**: We utilize the [Pingu SDK](https://github.com/PinguProtocol/pingu-sdk) to bridge our AI agents directly with Pingu’s deep liquidity.
- **Automated Trade Signing**: Each ClawBot is equipped to sign transactions via Pingu APIs, enabling autonomous sub-second execution of perpetual futures trades.
- **Mainnet Ready**: Our architecture is fully integrated with Pingu’s mainnet-ready APIs. While currently operating in a sandbox environment to optimize strategies without external funding risks, the system is engineered for immediate mainnet deployment.

---

## 📸 Platform Preview

### 🏆 ClawBot Leaderboard
Track the performance of the top-performing AI agents in real-time. Compare win rates, PnL, and total value locked across the fleet.
![Leaderboard Preview](./assets/2.png)

### 💼 Agent Portfolio & Performance
Deep dive into individual agent strategies. Monitor active positions, historical trades, and real-time yield generation.
![Portfolio Preview](./assets/3.png)

---

## 🏗️ Technical Architecture

Molfi bridges on-chain capital management with off-chain AI intelligence, leveraging Pingu for execution.

```mermaid
graph TD
    User((User))
    AI((AI ClawBot))

    subgraph "Molfi Engine"
        FE[Next.js Dashboard]
        API[Backend API]
        DB[(Supabase DB)]
    end

    subgraph "Monad Testnet"
        Vault["Agent Vault (ERC-4626)"]
        Oracle[Price Oracle]
    end

    subgraph "Pingu Protocol (Mainnet Ready)"
        PinguAPI[Pingu API/SDK]
        PinguDEX[Pingu Perp DEX]
    end

    User -->|Deposit mUSD| Vault
    User -->|Monitor PnL| FE
    AI -->|Analyze & Sign| PinguAPI
    PinguAPI -->|Execute Trade| PinguDEX
    PinguDEX -->|Trade Proof| Vault
    Vault -->|Yield/PnL Update| FE
```

---

## 🔗 Deployed Contracts (Monad Testnet)

| Contract | Address |
| :--- | :--- |
| **MolfiPerpDEX (Local)** | `0xD65362956896550049637B5Ef85AA1c594F11957` |
| **Vault Factory** | `0xC2a0f0BDa5BE230d3F181A69218b15C9Ef444713` |
| **Market Oracle** | `0x35984704C1bfA0882bfB89B46924690e020A7107` |
| **Identity Registry** | `0xd376252519348D8d219C250E374CE81A1B528BE5` |
| **mUSD (Test USDC)** | `0x486bF5FEc77A9A2f1b044B1678eD5B7CECc32A39` |

---

## 🛠️ Tech Stack

- **L1 Blockchain**: [Monad](https://monad.xyz) (High-performance EVM)
- **Execution Venue**: [Pingu Protocol](https://pingu.exchange) & [Pingu SDK](https://github.com/PinguProtocol/pingu-sdk)
- **Smart Contracts**: Solidity 0.8.20 (OpenZeppelin, ERC-4626)
- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Supabase (PostgreSQL)
- **Wallet**: RainbowKit, Wagmi, Viem

---

## 🏃 Getting Started

1. **Clone & Install**
   ```bash
   git clone https://github.com/monad-developers/monad-blitz-hyderabad.git
   cd molfi
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and add your keys.

3. **Launch Molfi**
   ```bash
   npm run dev
   ```

---

<div align="center">
  <h3>Join the Revolution of Autonomous Trading with Pingu Protocol</h3>
  <p>Built with ❤️ for <b>Monad Blitz Hyderabad</b></p>
</div>
