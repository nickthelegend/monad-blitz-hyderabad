# 🎯 PHASE 5 - CLAWDEX: FULL DEX WITH ORDERBOOK

## Overview

Phase 5 implements ClawDex - a comprehensive perpetual DEX with orderbook, Chainlink oracles, agent position tracking, and professional trading interface. Focus on BTC/USDT and ETH/USDT pairs.

---

## 🔍 Research Findings

### Oracle Implementation Best Practices
Based on industry research (GMX, dYdX, Hyperliquid, ApeX Protocol):

**Key Findings:**
- ✅ **Chainlink Data Streams** - Low-latency, high-frequency price data
- ✅ **Hybrid Model** - Off-chain orderbook + on-chain settlement (best performance)
- ✅ **Multi-Oracle** - Use Chainlink + Pyth for redundancy
- ✅ **Price Validation** - Staleness checks, deviation limits
- ✅ **8-Decimal Handling** - Convert to 18 decimals for consistency

**Implementation Pattern:**
```solidity
// 1. Fetch price from Chainlink
uint256 chainlinkPrice = getChainlinkPrice();

// 2. Validate staleness (< 1 hour)
require(updatedAt > block.timestamp - 1 hours, "Stale price");

// 3. Convert 8 decimals → 18 decimals
uint256 priceScaled = chainlinkPrice * 1e10;

// 4. Use in trading logic
```

### Orderbook Implementation Models

**Hybrid Model (RECOMMENDED):**
- Off-chain orderbook matching (fast, low gas)
- On-chain settlement (secure, transparent)
- Used by: dYdX, Aevo, RabbitX
- **Best for:** Performance + Decentralization balance

**Fully On-Chain (Alternative):**
- All orders on-chain
- Used by: Hyperliquid (custom L1)
- **Best for:** Maximum transparency
- **Challenge:** High gas costs on Ethereum

**Our Approach: Hybrid Model**
- Orders matched off-chain via API
- Settlement on-chain via smart contracts
- WebSocket for real-time updates
- Optimistic execution with on-chain verification

---

## 📋 Tasks

### TASK 5.1: Enhanced Oracle System
**Objective:** Implement production-grade oracle with BTC/USDT and ETH/USDT

**Contracts to Create:**

1. **PriceOracle.sol**
```solidity
// Multi-asset price oracle with Chainlink
contract PriceOracle {
    mapping(string => address) public priceFeeds; // "BTC/USDT" => feed address
    
    function getPrice(string memory pair) external view returns (uint256);
    function getPriceWithValidation(string memory pair) external view returns (uint256);
    function updateFeed(string memory pair, address feed) external;
}
```

**Features:**
- BTC/USDT and ETH/USDT feeds
- Price staleness validation (< 1 hour)
- Decimal conversion (8 → 18)
- Emergency pause
- Multi-oracle aggregation (Chainlink primary)

**Files to Create:**
- `contracts/oracles/PriceOracle.sol`
- `contracts/oracles/OracleAggregator.sol`
- `scripts/deploy-price-oracle.ts`
- `test/PriceOracle.test.ts`

**Estimated Time:** 1.5 hours

---

### TASK 5.2: ClawDex Core Contracts
**Objective:** Build hybrid orderbook DEX contracts

**Contracts to Create:**

1. **ClawDexCore.sol**
```solidity
struct Order {
    uint256 id;
    address trader;
    string pair;        // "BTC/USDT"
    uint256 size;       // Position size
    uint256 price;      // Limit price
    uint256 leverage;   // 1-50x
    bool isLong;
    bool isMarket;      // Market or limit order
    OrderStatus status;
    uint256 timestamp;
}

struct Position {
    uint256 orderId;
    address trader;
    address agent;      // Agent that opened position
    string pair;
    uint256 size;
    uint256 collateral;
    uint256 entryPrice;
    uint256 leverage;
    bool isLong;
    int256 unrealizedPnL;
    uint256 liquidationPrice;
    uint256 timestamp;
}
```

2. **OrderbookManager.sol**
```solidity
// Off-chain orderbook with on-chain settlement
contract OrderbookManager {
    function submitOrder(Order memory order) external returns (uint256);
    function cancelOrder(uint256 orderId) external;
    function executeOrder(uint256 orderId, uint256 fillPrice) external;
    function matchOrders(uint256 buyOrderId, uint256 sellOrderId) external;
}
```

3. **PositionManager.sol**
```solidity
contract PositionManager {
    function openPosition(Order memory order) external returns (uint256);
    function closePosition(uint256 positionId) external returns (int256 pnl);
    function getPosition(uint256 positionId) external view returns (Position memory);
    function getAgentPositions(address agent) external view returns (Position[] memory);
    function calculatePnL(uint256 positionId) external view returns (int256);
    function getLiquidationPrice(uint256 positionId) external view returns (uint256);
}
```

4. **LiquidationEngine.sol**
```solidity
contract LiquidationEngine {
    function checkLiquidation(uint256 positionId) external view returns (bool);
    function liquidatePosition(uint256 positionId) external;
    function getHealthFactor(uint256 positionId) external view returns (uint256);
}
```

5. **FundingRateManager.sol**
```solidity
contract FundingRateManager {
    function calculateFundingRate(string memory pair) external view returns (int256);
    function applyFunding(uint256 positionId) external;
    function getFundingHistory(string memory pair) external view returns (int256[] memory);
}
```

**Features:**
- Hybrid orderbook (off-chain matching, on-chain settlement)
- Market and limit orders
- Long/short positions
- Leverage 1x-50x
- Real-time PnL calculation
- Automatic liquidations
- Funding rates (every 8 hours)
- Multi-agent support

**Files to Create:**
- `contracts/dex/ClawDexCore.sol`
- `contracts/dex/OrderbookManager.sol`
- `contracts/dex/PositionManager.sol`
- `contracts/dex/LiquidationEngine.sol`
- `contracts/dex/FundingRateManager.sol`
- `scripts/deploy-clawdex.ts`

**Estimated Time:** 3 hours

---

### TASK 5.3: Backend API for ClawDex
**Objective:** Build comprehensive trading API

**API Endpoints:**

#### Order Management
```typescript
POST   /api/clawdex/order/submit
POST   /api/clawdex/order/cancel
GET    /api/clawdex/order/:orderId
GET    /api/clawdex/orders/:agentId
```

#### Position Management
```typescript
POST   /api/clawdex/position/open
POST   /api/clawdex/position/close
GET    /api/clawdex/position/:positionId
GET    /api/clawdex/positions/:agentId
GET    /api/clawdex/positions/all
```

#### Orderbook Data
```typescript
GET    /api/clawdex/orderbook/:pair
GET    /api/clawdex/trades/:pair
GET    /api/clawdex/depth/:pair
```

#### Price & Market Data
```typescript
GET    /api/clawdex/price/:pair
GET    /api/clawdex/ticker/:pair
GET    /api/clawdex/candles/:pair?timeframe=1h
```

#### WebSocket Streams
```typescript
WS     /api/clawdex/ws/orderbook/:pair
WS     /api/clawdex/ws/trades/:pair
WS     /api/clawdex/ws/positions/:agentId
WS     /api/clawdex/ws/prices
```

**Response Examples:**

**Submit Order:**
```json
{
  "orderId": "123",
  "unsignedTx": "0x...",
  "estimatedGas": "150000",
  "status": "pending",
  "order": {
    "pair": "BTC/USDT",
    "size": 1000,
    "price": 45000,
    "leverage": 10,
    "isLong": true
  }
}
```

**Get Orderbook:**
```json
{
  "pair": "BTC/USDT",
  "bids": [
    { "price": 45000, "size": 10.5, "total": 10.5 },
    { "price": 44990, "size": 5.2, "total": 15.7 }
  ],
  "asks": [
    { "price": 45010, "size": 8.3, "total": 8.3 },
    { "price": 45020, "size": 12.1, "total": 20.4 }
  ],
  "lastPrice": 45005,
  "timestamp": 1707734400
}
```

**Features:**
- Off-chain orderbook management
- Order matching engine
- Real-time price updates
- Position tracking
- Transaction generation
- WebSocket streams
- Rate limiting
- Error handling

**Files to Create:**
- `src/app/api/clawdex/order/submit/route.ts`
- `src/app/api/clawdex/order/cancel/route.ts`
- `src/app/api/clawdex/position/open/route.ts`
- `src/app/api/clawdex/position/close/route.ts`
- `src/app/api/clawdex/positions/[agentId]/route.ts`
- `src/app/api/clawdex/orderbook/[pair]/route.ts`
- `src/app/api/clawdex/price/[pair]/route.ts`
- `src/lib/clawdex/orderbook-engine.ts`
- `src/lib/clawdex/matching-engine.ts`
- `src/lib/clawdex/position-calculator.ts`

**Estimated Time:** 3 hours

---

### TASK 5.4: ClawDex Frontend - Trading Interface
**Objective:** Build professional trading UI with orderbook

**Main Page: `/clawdex`**

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  Header: ClawDex | BTC/USDT $45,250 ↑ +2.5%    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐│
│  │  TradingView     │  │  Orderbook           ││
│  │  Chart           │  │                      ││
│  │  (BTC/USDT)      │  │  Bids    |   Asks   ││
│  │                  │  │  45000   |   45010  ││
│  │  [Candlesticks]  │  │  44990   |   45020  ││
│  │                  │  │  44980   |   45030  ││
│  └──────────────────┘  └──────────────────────┘│
│                                                 │
│  ┌──────────────────┐  ┌──────────────────────┐│
│  │  Trading Panel   │  │  Recent Trades       ││
│  │                  │  │                      ││
│  │  [Long] Short    │  │  45005  0.5  Buy    ││
│  │  Size: 1000      │  │  45000  1.2  Sell   ││
│  │  Leverage: 10x   │  │  45010  0.8  Buy    ││
│  │  [Submit Order]  │  │                      ││
│  └──────────────────┘  └──────────────────────┘│
│                                                 │
│  ┌─────────────────────────────────────────────┐│
│  │  My Positions                               ││
│  │  BTC/USDT Long 10x | Entry: 45000 | PnL: +$55││
│  │  ETH/USDT Short 5x | Entry: 2500 | PnL: -$20││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Components to Create:**

1. **OrderbookDisplay.tsx**
   - Real-time bid/ask display
   - Price levels with depth
   - Visual depth chart
   - Click to fill price
   - WebSocket updates

2. **TradingPanel.tsx**
   - Pair selector (BTC/USDT, ETH/USDT)
   - Order type (Market, Limit)
   - Long/Short toggle
   - Size input
   - Leverage slider (1x-50x)
   - Price input (limit orders)
   - Submit order button
   - Order preview

3. **RecentTrades.tsx**
   - Live trade feed
   - Price, size, side
   - Color-coded (green/red)
   - WebSocket updates

4. **PositionTable.tsx**
   - Active positions
   - Entry price, current price
   - Unrealized PnL
   - Liquidation price
   - Close button
   - Real-time updates

5. **OrderHistory.tsx**
   - Open orders
   - Filled orders
   - Cancelled orders
   - Order status

**Files to Create:**
- `src/app/clawdex/page.tsx`
- `src/components/clawdex/OrderbookDisplay.tsx`
- `src/components/clawdex/TradingPanel.tsx`
- `src/components/clawdex/RecentTrades.tsx`
- `src/components/clawdex/PositionTable.tsx`
- `src/components/clawdex/OrderHistory.tsx`
- `src/components/clawdex/DepthChart.tsx`

**Estimated Time:** 3 hours

---

### TASK 5.5: Agent Position Dashboard
**Objective:** View all agent positions across ClawDex

**Page: `/clawdex/agents`**

**Features:**
- List all registered agents
- View positions per agent
- Aggregate statistics
- Performance metrics
- Position history

**Dashboard Sections:**

1. **Agent List**
   - All registered agents
   - Total positions
   - Total PnL
   - Win rate
   - Click to view details

2. **Agent Detail View**
   - Active positions table
   - Position history
   - Performance chart
   - Trade statistics
   - Risk metrics

3. **Global Stats**
   - Total agents trading
   - Total open positions
   - Total volume
   - Total PnL
   - Top performers

**Files to Create:**
- `src/app/clawdex/agents/page.tsx`
- `src/app/clawdex/agents/[id]/page.tsx`
- `src/components/clawdex/AgentPositionCard.tsx`
- `src/components/clawdex/AgentPerformanceChart.tsx`

**Estimated Time:** 2 hours

---

### TASK 5.6: Contract Integration Hooks
**Objective:** React hooks for ClawDex interactions

**Hooks to Create:**

1. **useSubmitOrder.ts**
   - Submit market/limit orders
   - Transaction state
   - Error handling

2. **useCancelOrder.ts**
   - Cancel pending orders
   - Transaction tracking

3. **useClawDexPositions.ts**
   - Fetch positions
   - Real-time PnL updates
   - Filter by agent

4. **useOrderbook.ts**
   - Subscribe to orderbook
   - Real-time updates
   - Depth calculation

5. **useClawDexPrice.ts**
   - Get current price
   - Subscribe to price updates
   - Multiple pairs

6. **useRecentTrades.ts**
   - Fetch recent trades
   - Real-time trade feed

**Files to Create:**
- `src/hooks/clawdex/useSubmitOrder.ts`
- `src/hooks/clawdex/useCancelOrder.ts`
- `src/hooks/clawdex/useClawDexPositions.ts`
- `src/hooks/clawdex/useOrderbook.ts`
- `src/hooks/clawdex/useClawDexPrice.ts`
- `src/hooks/clawdex/useRecentTrades.ts`

**Estimated Time:** 2 hours

---

### TASK 5.7: WebSocket Infrastructure
**Objective:** Real-time data streaming

**WebSocket Channels:**

1. **Orderbook Updates**
   ```typescript
   ws://localhost:3001/api/clawdex/ws/orderbook/BTC-USDT
   
   Message: {
     type: 'orderbook',
     pair: 'BTC/USDT',
     bids: [...],
     asks: [...],
     timestamp: 1707734400
   }
   ```

2. **Trade Feed**
   ```typescript
   ws://localhost:3001/api/clawdex/ws/trades/BTC-USDT
   
   Message: {
     type: 'trade',
     pair: 'BTC/USDT',
     price: 45005,
     size: 0.5,
     side: 'buy',
     timestamp: 1707734400
   }
   ```

3. **Position Updates**
   ```typescript
   ws://localhost:3001/api/clawdex/ws/positions/:agentId
   
   Message: {
     type: 'position_update',
     positionId: '123',
     unrealizedPnL: 55.50,
     currentPrice: 45250,
     timestamp: 1707734400
   }
   ```

4. **Price Updates**
   ```typescript
   ws://localhost:3001/api/clawdex/ws/prices
   
   Message: {
     type: 'price',
     pair: 'BTC/USDT',
     price: 45250,
     change24h: 2.5,
     timestamp: 1707734400
   }
   ```

**Files to Create:**
- `src/lib/websocket/clawdex-ws.ts`
- `src/hooks/useWebSocket.ts`

**Estimated Time:** 1.5 hours

---

### TASK 5.8: Testing & Documentation
**Objective:** Comprehensive testing and docs

**Testing:**
- Contract unit tests
- API endpoint tests
- Orderbook matching tests
- PnL calculation tests
- Liquidation tests
- WebSocket tests

**Documentation:**
- ClawDex user guide
- API documentation
- Trading guide
- Agent integration guide
- Deployment guide

**Files to Create:**
- `CLAWDEX_GUIDE.md`
- `CLAWDEX_API.md`
- `test/ClawDex.test.ts`

**Estimated Time:** 1.5 hours

---

## 🎯 Success Criteria

### Smart Contracts
- [ ] Oracle integration working (BTC/USDT, ETH/USDT)
- [ ] Orderbook manager functional
- [ ] Position opening/closing works
- [ ] Liquidation engine operational
- [ ] Funding rates calculated

### Backend API
- [ ] All endpoints functional
- [ ] Orderbook matching works
- [ ] Position tracking accurate
- [ ] WebSocket streams working
- [ ] Real-time updates

### Frontend
- [ ] Orderbook displays correctly
- [ ] Trading panel functional
- [ ] Positions update in real-time
- [ ] Charts display prices
- [ ] Agent dashboard works

### Integration
- [ ] End-to-end trading flow
- [ ] Oracle prices accurate
- [ ] Orders execute correctly
- [ ] Positions tracked
- [ ] Liquidations trigger

---

## 📊 Timeline

| Task | Duration | Priority |
|------|----------|----------|
| 5.1 Enhanced Oracle | 1.5 hours | Critical |
| 5.2 ClawDex Contracts | 3 hours | Critical |
| 5.3 Backend API | 3 hours | Critical |
| 5.4 Trading UI | 3 hours | High |
| 5.5 Agent Dashboard | 2 hours | High |
| 5.6 Contract Hooks | 2 hours | High |
| 5.7 WebSocket | 1.5 hours | High |
| 5.8 Testing & Docs | 1.5 hours | Medium |

**Total Estimated Time:** ~18 hours

---

## 🏗️ Architecture

```
Frontend (ClawDex UI)
    ↓
WebSocket ← → Backend API
    ↓
Orderbook Engine (Off-chain)
    ↓
Matching Engine
    ↓
Generate Unsigned Tx
    ↓
User Signs
    ↓
Submit to Blockchain
    ↓
ClawDex Contracts
    ↓
PriceOracle (Chainlink)
    ↓
Position Opened/Closed
    ↓
Event Emitted
    ↓
WebSocket Update → Frontend
```

---

## 💡 Key Design Decisions

### 1. Hybrid Orderbook
- **Off-chain:** Order matching (fast, cheap)
- **On-chain:** Settlement (secure, transparent)
- **Best of both worlds**

### 2. Limited Pairs
- **BTC/USDT** and **ETH/USDT** only
- Simplifies oracle management
- Reduces complexity
- Can expand later

### 3. API-First Approach
- Unsigned transactions
- Fast response
- User control
- Easy testing

### 4. Real-time Updates
- WebSocket for all live data
- Orderbook updates
- Price feeds
- Position PnL

---

## 📝 Notes

- Start with BTC/USDT and ETH/USDT only
- Use Chainlink for price feeds
- Hybrid orderbook model (off-chain + on-chain)
- WebSocket for real-time updates
- Agent position tracking built-in
- Professional trading interface

---

**Phase 5: ClawDex - Full DEX with Orderbook** 📊🔥
