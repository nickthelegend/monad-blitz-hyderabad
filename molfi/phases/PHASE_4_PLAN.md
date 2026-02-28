# 🎯 PHASE 4 - PERPETUAL DEX WITH CHAINLINK ORACLES

## Overview

Phase 4 implements a fully functional perpetual DEX with Chainlink price oracles, TradingView charts, API-driven trading, and agent position tracking.

---

## 🏗️ Architecture

### Smart Contracts Layer
- Chainlink Oracle integration
- Perpetual DEX contract
- Position management
- Liquidation engine
- Funding rate mechanism

### Backend API Layer
- Trade execution endpoints
- Position management
- Price feed aggregation
- Transaction signing service
- WebSocket for real-time updates

### Frontend Layer
- TradingView chart integration
- Trading interface
- Agent position dashboard
- Real-time position tracking
- Order management UI

---

## 📋 Tasks

### TASK 4.1: Chainlink Oracle Contracts
**Objective:** Implement Chainlink price feed integration

**Contracts to Create:**
1. **ChainlinkOracle.sol**
   - Price feed interface
   - Multi-asset support (BTC, ETH, SOL, etc.)
   - Decimal handling
   - Price validation
   - Staleness checks

2. **OracleRegistry.sol**
   - Manage multiple price feeds
   - Add/remove feeds
   - Get price for any asset
   - Emergency pause

**Features:**
- Support for multiple assets
- 8-decimal to 18-decimal conversion
- Price staleness validation
- Fallback mechanisms

**Files to Create:**
- `contracts/ChainlinkOracle.sol`
- `contracts/OracleRegistry.sol`
- `scripts/deploy-oracles.ts`

**Estimated Time:** 1 hour

---

### TASK 4.2: Perpetual DEX Contracts
**Objective:** Build core perpetual trading contracts

**Contracts to Create:**
1. **MolfiPerpDEX.sol**
   - Open/close positions
   - Long/short support
   - Leverage (1x-50x)
   - Collateral management
   - Position tracking

2. **LiquidationEngine.sol**
   - Health factor calculation
   - Liquidation triggers
   - Liquidator rewards
   - Partial liquidations

3. **FundingRateManager.sol**
   - Funding rate calculation
   - Long/short imbalance tracking
   - Periodic funding payments

**Position Structure:**
```solidity
struct Position {
    uint256 size;           // Position size in USD
    uint256 collateral;     // Collateral amount
    uint256 entryPrice;     // Entry price
    uint256 leverage;       // Leverage (1-50x)
    bool isLong;            // Long or short
    uint256 timestamp;      // Open timestamp
    int256 fundingIndex;    // Funding rate index
}
```

**Features:**
- Multi-asset trading
- Leverage up to 50x
- PnL calculation
- Liquidation protection
- Funding rates

**Files to Create:**
- `contracts/MolfiPerpDEX.sol`
- `contracts/LiquidationEngine.sol`
- `contracts/FundingRateManager.sol`
- `scripts/deploy-perp-dex.ts`

**Estimated Time:** 2 hours

---

### TASK 4.3: Backend API for Trading
**Objective:** Build API endpoints for trade execution

**API Endpoints:**

#### 1. Trade Execution
```typescript
POST /api/trade/open
Body: {
  agentId: string;
  asset: 'BTC' | 'ETH' | 'SOL';
  size: number;
  leverage: number;
  isLong: boolean;
  slippage: number;
}
Response: {
  unsignedTx: string;
  estimatedGas: string;
  entryPrice: string;
  fees: string;
}
```

#### 2. Close Position
```typescript
POST /api/trade/close
Body: {
  agentId: string;
  positionId: string;
}
Response: {
  unsignedTx: string;
  pnl: string;
  fees: string;
}
```

#### 3. Get Positions
```typescript
GET /api/positions/:agentId
Response: {
  positions: Position[];
  totalPnL: string;
  totalCollateral: string;
}
```

#### 4. Get Price
```typescript
GET /api/price/:asset
Response: {
  price: string;
  timestamp: number;
  source: 'chainlink';
}
```

#### 5. WebSocket for Real-time Updates
```typescript
WS /api/ws/positions/:agentId
Events: {
  positionUpdate: Position;
  priceUpdate: { asset: string; price: string };
  liquidation: { positionId: string };
}
```

**Features:**
- Unsigned transaction generation
- Gas estimation
- Price validation
- Position validation
- Real-time updates via WebSocket

**Files to Create:**
- `src/app/api/trade/open/route.ts`
- `src/app/api/trade/close/route.ts`
- `src/app/api/positions/[agentId]/route.ts`
- `src/app/api/price/[asset]/route.ts`
- `src/lib/perp-dex.ts` (helper functions)
- `src/lib/oracle-client.ts` (Chainlink client)

**Estimated Time:** 2 hours

---

### TASK 4.4: TradingView Chart Integration
**Objective:** Integrate TradingView charts for price visualization

**Features:**
- Real-time price charts
- Multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- Technical indicators
- Drawing tools
- Order markers on chart
- Position entry/exit markers

**Implementation:**
- Use TradingView Lightweight Charts library
- WebSocket for real-time data
- Custom data feed adapter
- Chart controls

**Files to Create:**
- `src/components/TradingViewChart.tsx`
- `src/lib/tradingview-datafeed.ts`
- `src/hooks/usePriceData.ts`

**Estimated Time:** 1.5 hours

---

### TASK 4.5: Trading Interface UI
**Objective:** Build comprehensive trading interface

**Components:**

#### 1. Trading Panel
- Asset selector
- Long/Short toggle
- Size input
- Leverage slider (1x-50x)
- Entry price display
- Liquidation price
- Fees breakdown
- Open position button

#### 2. Position Dashboard
- Active positions table
- Entry price
- Current price
- PnL (unrealized)
- Liquidation price
- Close button

#### 3. Order History
- Past trades
- Realized PnL
- Fees paid
- Timestamps

#### 4. Agent Position Tracker
- Filter by agent
- View all agent positions
- Performance metrics
- Win/loss ratio

**Files to Create:**
- `src/app/trade/page.tsx` (main trading page)
- `src/components/TradingPanel.tsx`
- `src/components/PositionDashboard.tsx`
- `src/components/OrderHistory.tsx`
- `src/components/AgentPositionTracker.tsx`

**Estimated Time:** 2 hours

---

### TASK 4.6: Agent Position Tracking
**Objective:** Track and display all positions taken by registered agents

**Features:**
- View positions by agent
- Real-time PnL updates
- Position history
- Performance analytics
- Win/loss tracking
- Profit/loss charts

**Dashboard Sections:**
1. **Active Positions**
   - Current open positions
   - Live PnL
   - Risk metrics

2. **Position History**
   - Closed positions
   - Realized PnL
   - Trade statistics

3. **Performance Metrics**
   - Total trades
   - Win rate
   - Average profit
   - Max drawdown
   - Sharpe ratio

**Files to Create:**
- `src/app/agents/[id]/positions/page.tsx`
- `src/hooks/useAgentPositions.ts`
- `src/hooks/usePositionPnL.ts`
- `src/components/PositionChart.tsx`

**Estimated Time:** 1.5 hours

---

### TASK 4.7: Contract Integration Hooks
**Objective:** Create React hooks for contract interactions

**Hooks to Create:**

1. **useOpenPosition.ts**
   - Open long/short position
   - Transaction state management
   - Error handling

2. **useClosePosition.ts**
   - Close position
   - PnL calculation
   - Transaction tracking

3. **usePositions.ts**
   - Fetch all positions
   - Real-time updates
   - Filter by agent

4. **useOraclePrice.ts**
   - Get current price
   - Subscribe to price updates
   - Multiple assets

5. **useLiquidationPrice.ts**
   - Calculate liquidation price
   - Health factor
   - Risk warnings

**Files to Create:**
- `src/hooks/useOpenPosition.ts`
- `src/hooks/useClosePosition.ts`
- `src/hooks/usePositions.ts`
- `src/hooks/useOraclePrice.ts`
- `src/hooks/useLiquidationPrice.ts`

**Estimated Time:** 1.5 hours

---

### TASK 4.8: Testing & Documentation
**Objective:** Comprehensive testing and documentation

**Testing:**
- Contract unit tests
- API endpoint tests
- Frontend integration tests
- Oracle price validation
- Liquidation scenarios
- PnL calculations

**Documentation:**
- API documentation
- Trading guide
- Oracle integration guide
- Deployment guide
- User manual

**Files to Create:**
- `PERP_DEX_GUIDE.md`
- `API_DOCUMENTATION.md`
- `ORACLE_SETUP.md`
- `test/PerpDEX.test.ts`

**Estimated Time:** 1 hour

---

## 🎯 Success Criteria

### Smart Contracts
- [ ] Chainlink oracle integration working
- [ ] Multi-asset price feeds
- [ ] Position opening/closing works
- [ ] Liquidation engine functional
- [ ] Funding rates calculated

### Backend API
- [ ] All endpoints functional
- [ ] Unsigned transactions generated
- [ ] Gas estimation accurate
- [ ] WebSocket real-time updates
- [ ] Error handling robust

### Frontend
- [ ] TradingView charts display
- [ ] Trading panel functional
- [ ] Positions display correctly
- [ ] Real-time PnL updates
- [ ] Agent position tracking works

### Integration
- [ ] End-to-end trading flow
- [ ] Oracle prices accurate
- [ ] Transactions confirm
- [ ] Positions tracked correctly
- [ ] Liquidations trigger properly

---

## 📊 Timeline

| Task | Duration | Priority |
|------|----------|----------|
| 4.1 Oracle Contracts | 1 hour | Critical |
| 4.2 Perp DEX Contracts | 2 hours | Critical |
| 4.3 Backend API | 2 hours | Critical |
| 4.4 TradingView Charts | 1.5 hours | High |
| 4.5 Trading UI | 2 hours | High |
| 4.6 Agent Tracking | 1.5 hours | High |
| 4.7 Contract Hooks | 1.5 hours | High |
| 4.8 Testing & Docs | 1 hour | Medium |

**Total Estimated Time:** ~12 hours

---

## 🔗 Architecture Flow

```
User/Agent
    ↓
Frontend Trading UI
    ↓
API Endpoint (/api/trade/open)
    ↓
Generate Unsigned Transaction
    ↓
Return to Frontend
    ↓
User Signs Transaction
    ↓
Submit to Blockchain
    ↓
MolfiPerpDEX Contract
    ↓
ChainlinkOracle (get price)
    ↓
Open Position
    ↓
Emit PositionOpened Event
    ↓
WebSocket Update
    ↓
Frontend Updates Position Dashboard
```

---

## 💡 API Approach Analysis

### ✅ **Your Approach is EXCELLENT!**

**Advantages:**
1. **Security:** Unsigned transactions keep private keys client-side
2. **Flexibility:** Users can review before signing
3. **Scalability:** API handles complex logic, blockchain only stores state
4. **UX:** Fast response, no waiting for blockchain
5. **Debugging:** Easy to test and validate before submission

**Recommended Flow:**
```typescript
// 1. User initiates trade
const response = await fetch('/api/trade/open', {
  method: 'POST',
  body: JSON.stringify({ agentId, asset, size, leverage, isLong })
});

// 2. API returns unsigned transaction
const { unsignedTx, entryPrice, fees } = await response.json();

// 3. User reviews and signs
const signedTx = await signer.signTransaction(unsignedTx);

// 4. Submit to blockchain
const tx = await provider.sendTransaction(signedTx);

// 5. Wait for confirmation
await tx.wait();

// 6. Update UI via WebSocket
```

**Additional Recommendations:**
- Add nonce management
- Implement transaction queuing
- Add retry logic
- Cache unsigned txs (5min TTL)
- Validate prices before signing

---

## 🔥 Chainlink Oracle Setup

### Supported Assets (Monad Testnet)
```typescript
const ORACLE_FEEDS = {
  BTC: '0x...', // BTC/USD feed
  ETH: '0x...', // ETH/USD feed
  SOL: '0x...', // SOL/USD feed
  MATIC: '0x...', // MATIC/USD feed
};
```

### Price Validation
```solidity
function getValidatedPrice(address feed) public view returns (uint256) {
    (
        uint80 roundId,
        int256 price,
        ,
        uint256 updatedAt,
        uint80 answeredInRound
    ) = AggregatorV3Interface(feed).latestRoundData();
    
    require(price > 0, "Invalid price");
    require(updatedAt > block.timestamp - 1 hours, "Stale price");
    require(answeredInRound >= roundId, "Stale round");
    
    return uint256(price);
}
```

---

## 📝 Notes

### Chainlink Integration
- Use Chainlink Data Feeds (not VRF)
- Handle 8-decimal prices
- Validate price staleness
- Implement fallback oracles

### Perpetual DEX
- Start with isolated margin
- Implement cross-margin later
- Add stop-loss/take-profit
- Funding rates every 8 hours

### API Design
- RESTful for CRUD operations
- WebSocket for real-time data
- Rate limiting (100 req/min)
- Authentication via wallet signature

### TradingView
- Use Lightweight Charts (free)
- Custom datafeed adapter
- WebSocket for real-time candles
- Support multiple timeframes

---

**Phase 4: Perpetual DEX with Chainlink Oracles** 🔮📈
