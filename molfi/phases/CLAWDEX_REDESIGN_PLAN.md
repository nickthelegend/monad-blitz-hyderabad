# ClawDex Premium Redesign Plan

## Vision
ClawDex is an AI agent trading marketplace where users can:
- Browse AI trading agents with verified track records
- View real-time positions and trading decisions
- Stake USDT/tokens into agents for automated trading
- Track performance with transparent, verifiable data

---

## Features to Implement

### 1. Real-Time Price Oracle
- **API:** Binance WebSocket (free, no auth)
- **Pairs:** BTC/USDT, ETH/USDT, SOL/USDT
- **Update Frequency:** Real-time (< 1s latency)
- **Fallback:** CoinGecko REST API

### 2. Agent Marketplace
**Agent Card Components:**
- Agent avatar/logo with glassmorphic container
- Performance metrics (24h, 7d, 30d, All-time)
- Current positions (live)
- Total AUM (Assets Under Management)
- Trust score / verification badge
- Staking APY estimate

**Agent Details Page:**
- Full trading history
- Decision timeline (verifiable on-chain)
- Position breakdown
- Risk metrics
- Staking interface

### 3. Premium UI Elements

**Glassmorphic Design:**
```css
.glass-card {
    background: rgba(168, 85, 247, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(168, 85, 247, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Animated Elements:**
- Live price tickers
- Position change indicators
- P&L counters with smooth transitions
- Agent activity pulse indicators

**Data Visualization:**
- Performance charts (lightweight-charts)
- Position distribution pie charts
- Risk/reward scatter plots
- Decision timeline

### 4. Staking System
- Deposit USDT interface
- Withdrawal queue
- Earnings tracker
- Lock period indicator
- Risk disclosure

---

## Implementation Order

1. ✅ Real-time price WebSocket service
2. ✅ Agent data models & mock data
3. ✅ Premium ClawDex marketplace UI
4. ✅ Agent detail page
5. ✅ Staking interface
6. ✅ All pages premium redesign

---

## Design Principles

1. **Premium First** - Every element should feel high-end
2. **Data Transparency** - All decisions verifiable
3. **Real-Time** - Live updates, no stale data
4. **Trust Building** - Clear metrics, verified badges
5. **User Empowerment** - Easy to understand, hard to misuse

---

## Tech Stack

- **Frontend:** Next.js 16, React 19
- **Styling:** CSS Variables, Glassmorphism
- **Charts:** lightweight-charts
- **Real-time:** WebSocket (Binance API)
- **State:** React hooks, context
- **Icons:** lucide-react

---

**Let's build something novel! 🚀**
