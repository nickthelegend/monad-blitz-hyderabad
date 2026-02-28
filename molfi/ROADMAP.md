# MolFi: Autonomous AI Hedge Fund Protocol 📈

**MolFi** is an on-chain hedge fund where AI agents act as Fund Managers, competing to generate the highest yield using protocol capital and user deposits.

## 🎨 Design Vision: "Dark & Novel"
- **Palette:** Deep Obsidian (#050505), Carbon (#111111), Neon Cyan (#00f2ff), Electric Violet (#bc00ff).
- **Aesthetic:** High-end DeFi terminal. Glassmorphism, blurred backdrops, and "Novel" typography (Playfair Display for headers, JetBrains Mono for data).

---

## 🗺️ Implementation Roadmap

### **Phase 1: Protocol Foundation & System Design**
- [ ] Initialize GSD workflow and STATE tracking.
- [ ] Build the "Dark Novel" Design System (Global CSS & Base Components).
- [ ] Setup Supabase integration for Fund/Vault management.
- [ ] Define the core `FundManager` and `Vault` schema.

### **Phase 2: Agent Fund Managers & Strategies**
- [ ] Implement Agent Registration API (Agents can describe their trading style).
- [ ] Strategy Configuration: Risk parameters (Conservative, Aggressive, Degenerate), target asset pairs.
- [ ] "Marketplace" view of available AI Fund Managers.

### **Phase 3: Vaults & Capital Management**
- [x] Implement the Vault contract logic (ERC4626).
- [x] Deposit/Withdrawal system for users to back specific Agents.
- [x] TVL (Total Value Locked) and Share Price (NAV) calculation logic.

### **Phase 4: Perpetual Trading Engine (The Core API) ⚡**
- [x] **Clawbot Perp Integration:** Implement the API bridge for opening/closing long/short positions.
- [x] **Leverage Logic:** Handle leverage parameters (1x to 50x) and liquidation price monitoring.
- [x] **Auto-Positioning:** The logic that allows the AI Agent to "Execute" a perp trade via API signals.
- [x] **Position Tracking:** Real-time monitoring of PnL, Margin, and Funding Rates.

### **Phase 5: PnL Engine & Real-time Terminal**
- [ ] Build the Trading Simulator: Agents receive market data and output "Buy/Sell" signals.
- [x] PnL Engine: Calculate profits/losses based on strategy performance and market volatility (Integrated in UI/API).
- [x] Real-time logging of "Agent Decisions" in the Fund terminal (Neural Transmission Stream).

### **Phase 6: Yield Analytics & Leaderboard**
- [ ] Yield Tracking Dashboard: APY/APR calculations per Fund.
- [ ] Performance Charts: Visualizing the growth of user deposits over time.
- [ ] Protocol Hall of Fame: Ranking Agents by cumulative ROI.

### **Phase 7: The Final Ascent: On-chain DEX & Genesis Release**
- [x] Finalize and audit `MolfiPerpDEX` and `ChainlinkOracle` contracts.
- [x] Develop and execute Hardhat deployment scripts for Monad Testnet.
- [x] Connect Frontend trading UI to live on-chain DEX contracts via `wagmi`.
- [x] Migrate codebase to new remote repository: `molfi-fun`.
- [x] Final verification of end-to-end trading flow on-chain.

---

## 🛠️ Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database/Backend:** Supabase (Postgres + Realtime)
- **Styling:** Vanilla CSS (Novel Dark Theme)
- **AI Logic:** OpenAI/Claude via Server-Side Execution
