/**
 * MolFi Market Engine
 * ═══════════════════════════════════════════════════════════════
 * Reads real prices from MolfiOracle on Monad Testnet.
 *
 * Price pipeline:
 *   Binance API → oracle-bot.cjs → MolfiOracle contract → this engine → API
 *
 * Fallback chain:
 *   1. Read from MolfiOracle on-chain (live prices pushed by bot)
 *   2. Fetch directly from Binance REST API (if oracle is stale/down)
 *   3. Return hardcoded fallback prices (last resort)
 */

import { ethers } from 'ethers';

// ── MolfiOracle ABI (read-only subset) ──────────────────────────
const ORACLE_ABI = [
  'function getLatestPrice(string memory pair) public view returns (uint256)',
  'function getPriceUnsafe(string memory pair) external view returns (uint256 price, uint256 updatedAt, bool isStale)',
  'function getAllPrices() external view returns (string[] memory pairs, uint256[] memory prices, uint256[] memory timestamps)',
  'function hasPriceFeed(string memory pair) external view returns (bool)',
  'function updatePrice(string memory pair, uint256 price) external',
];

// ── Configuration ────────────────────────────────────────────────
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_MOLFI_ORACLE || '';

const RPC_URLS = [
  process.env.NEXT_PUBLIC_MONAD_RPC || '',
  'https://testnet-rpc.monad.xyz',
  'https://monad-testnet.drpc.org',
].filter(Boolean);

// Binance symbol mapping (for direct fallback)
const BINANCE_SYMBOLS: Record<string, string> = {
  'BTC/USD': 'BTCUSDT',
  'ETH/USD': 'ETHUSDT',
  'SOL/USD': 'SOLUSDT',
  'LINK/USD': 'LINKUSDT',
  'DOGE/USD': 'DOGEUSDT',
  'AVAX/USD': 'AVAXUSDT',
  'MATIC/USD': 'MATICUSDT',
  'DOT/USD': 'DOTUSDT',
  'NEAR/USD': 'NEARUSDT',
};

const BINANCE_ENDPOINTS = [
  'https://api.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api.binance.us', // Often works when others are blocked
];

const COINGECKO_IDS: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
  'LINK/USD': 'chainlink',
  'DOGE/USD': 'dogecoin',
  'AVAX/USD': 'avalanche-2',
  'MATIC/USD': 'matic-network',
  'DOT/USD': 'polkadot',
  'NEAR/USD': 'near',
};

export const SUPPORTED_PAIRS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 'LINK/USD', 'DOGE/USD',
  'AVAX/USD', 'MATIC/USD', 'DOT/USD', 'NEAR/USD',
];

// Last resort fallback prices (Static)
const HARDCODED_FALLBACKS: Record<string, number> = {
  'BTC/USD': 96000,
  'ETH/USD': 2600,
  'SOL/USD': 185,
  'LINK/USD': 18.5,
  'DOGE/USD': 0.15,
  'AVAX/USD': 35,
  'MATIC/USD': 0.5,
  'DOT/USD': 6,
  'NEAR/USD': 4.5,
};

// ── Types ────────────────────────────────────────────────────────
export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  updatedAt: string;
  source: 'oracle' | 'binance' | 'coingecko' | 'fallback';
}

// ── RPC Provider Pool ────────────────────────────────────────────
let providerIndex = 0;

function getProvider(): ethers.JsonRpcProvider {
  const url = RPC_URLS[providerIndex % RPC_URLS.length];
  return new ethers.JsonRpcProvider(url);
}

function rotateProvider() {
  providerIndex = (providerIndex + 1) % RPC_URLS.length;
}

// ── Price Cache (5 second TTL) ───────────────────────────────────
const priceCache: Record<string, { data: PriceData; timestamp: number }> = {};
const CACHE_TTL = 5000;

// ── Strategy 1: Read from MolfiOracle on-chain ───────────────────
async function readFromOracle(symbol: string): Promise<PriceData | null> {
  if (!ORACLE_ADDRESS || RPC_URLS.length === 0) return null;

  for (let attempt = 0; attempt < RPC_URLS.length; attempt++) {
    try {
      const provider = getProvider();
      const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);

      // Use getPriceUnsafe to avoid revert on stale prices
      const [priceWei, updatedAt, isStale] = await oracle.getPriceUnsafe(symbol);

      if (priceWei === BigInt(0)) return null; // No price set
      if (isStale) {
        console.warn(`[MarketEngine] Oracle price for ${symbol} is stale`);
        return null;
      }

      const price = Number(ethers.formatUnits(priceWei, 18));

      return {
        symbol,
        price,
        change24h: 0,
        updatedAt: new Date(Number(updatedAt) * 1000).toISOString(),
        source: 'oracle',
      };
    } catch (err: any) {
      console.warn(`[MarketEngine] Oracle read attempt ${attempt + 1} failed: ${err.message}`);
      rotateProvider();
    }
  }
  return null;
}

// ── Strategy 2: Direct Binance API fetch (Multi-endpoint) ────────
export async function getBinancePrice(symbol: string): Promise<PriceData | null> {
  const binanceSymbol = BINANCE_SYMBOLS[symbol];
  if (!binanceSymbol) return null;

  for (const endpoint of BINANCE_ENDPOINTS) {
    try {
      const res = await fetch(
        `${endpoint}/api/v3/ticker/price?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(3000) }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const price = parseFloat(data.price);

      if (isNaN(price) || price <= 0) continue;

      return {
        symbol,
        price,
        change24h: 0,
        updatedAt: new Date().toISOString(),
        source: 'binance',
      };
    } catch (err: any) {
      console.warn(`[MarketEngine] Binance fetch failed for ${symbol} at ${endpoint}: ${err.message}`);
    }
  }
  return null;
}

async function readFromBinance(symbol: string): Promise<PriceData | null> {
  return getBinancePrice(symbol);
}

// ── Strategy 3: CoinGecko Fallback ───────────────────────────────
async function readFromCoinGecko(symbol: string): Promise<PriceData | null> {
  const cgId = COINGECKO_IDS[symbol];
  if (!cgId) return null;

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const price = data[cgId]?.usd;

    if (!price || isNaN(price) || price <= 0) return null;

    return {
      symbol,
      price,
      change24h: 0,
      updatedAt: new Date().toISOString(),
      source: 'coingecko',
    };
  } catch (err: any) {
    console.warn(`[MarketEngine] CoinGecko fetch failed for ${symbol}: ${err.message}`);
    return null;
  }
}

// ── Strategy 4: Hardcoded Fallback (Last Resort) ─────────────────
function handlePriceFailure(symbol: string): PriceData {
  const fallbackPrice = HARDCODED_FALLBACKS[symbol] || 0;
  const errorMsg = `[MarketEngine] WARNING: All live price sources failed for ${symbol}. Using hardcoded fallback: ${fallbackPrice}`;
  console.error(errorMsg);

  return {
    symbol,
    price: fallbackPrice,
    change24h: 0,
    updatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}


// ── Just-In-Time (JIT) Oracle Synchronization ────────────────────
/**
 * Syncs the on-chain oracle with the latest Binance price.
 * Useful for updating prices only when a trade occurs to save gas.
 */
export async function syncOraclePrice(symbol: string): Promise<PriceData> {
  const normalized = symbol.replace('-', '/').toUpperCase();
  console.log(`[MarketEngine] JIT syncing oracle for ${normalized}...`);

  // 1. Get real price from Binance
  const binanceData = await readFromBinance(normalized);
  if (!binanceData) {
    throw new Error(`Failed to fetch live price for ${normalized} from Binance`);
  }

  // 2. Push to on-chain Oracle if we have the private key
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (ORACLE_ADDRESS && pk) {
    try {
      const provider = getProvider();
      const wallet = new ethers.Wallet(pk, provider);
      const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, wallet);

      const priceWei = ethers.parseUnits(binanceData.price.toFixed(8), 18);

      console.log(`[MarketEngine] Sending update tx for ${normalized}...`);
      const tx = await oracle.updatePrice(normalized, priceWei, { gasLimit: 300000 });
      console.log(`[MarketEngine] Oracle update tx: ${tx.hash}`);

      // Wait for 1 confirmation to ensure the price is on-chain before the trade executes
      await tx.wait(1);
      console.log(`[MarketEngine] Oracle synced ✅`);

      return {
        ...binanceData,
        source: 'oracle',
        updatedAt: new Date().toISOString()
      };
    } catch (err: any) {
      console.error(`[MarketEngine] JIT Sync failed: ${err.message}`);
      return binanceData;
    }
  }

  return binanceData;
}

// ── Main Price Fetcher ───────────────────────────────────────────
/**
 * Fetches the latest price for a symbol.
 * Tries: Binance → MolfiOracle → CoinGecko → Fallback
 */
export async function getOraclePrice(symbol: string): Promise<PriceData> {
  const normalized = symbol.replace('-', '/').toUpperCase();

  // Check cache
  const cached = priceCache[normalized];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // 1. Try Binance first (User requested priority)
  let data: PriceData | null = await getBinancePrice(normalized);

  // 2. Fallback to Oracle
  if (!data) {
    data = await readFromOracle(normalized);
  }

  // 3. Fallback to CoinGecko
  if (!data) {
    data = await readFromCoinGecko(normalized);
  }

  // 4. Last resort: Static fallback
  if (!data) {
    data = handlePriceFailure(normalized);
  }

  // Cache it
  priceCache[normalized] = { data, timestamp: Date.now() };
  return data;
}

/**
 * Fetch all supported prices at once
 */
export async function getAllPrices(): Promise<PriceData[]> {
  // Try batch read from oracle first
  /*
  if (ORACLE_ADDRESS && RPC_URLS.length > 0) {
    for (let attempt = 0; attempt < RPC_URLS.length; attempt++) {
      try {
        const provider = getProvider();
        const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
        const [pairs, prices, timestamps] = await oracle.getAllPrices();

        const results: PriceData[] = [];
        for (let i = 0; i < pairs.length; i++) {
          const price = Number(ethers.formatUnits(prices[i], 18));
          if (price > 0) {
            const data: PriceData = {
              symbol: pairs[i],
              price,
              change24h: 0,
              updatedAt: new Date(Number(timestamps[i]) * 1000).toISOString(),
              source: 'oracle',
            };
            results.push(data);
            priceCache[pairs[i]] = { data, timestamp: Date.now() };
          }
        }

        if (results.length > 0) return results;
      } catch (err: any) {
        console.warn(`[MarketEngine] Batch oracle read failed: ${err.message}`);
        rotateProvider();
      }
    }
  }
  */

  // Fallback: fetch each pair individually (tries Oracle → Binance → CG → Fallback)
  const allPairs = Object.keys(BINANCE_SYMBOLS);
  const results = await Promise.allSettled(allPairs.map(p => getOraclePrice(p)));

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return handlePriceFailure(allPairs[i]);
  });
}


// ── Perpetual Math ───────────────────────────────────────────────
export function calculatePnL(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  currentPrice: number,
  size: number
): number {
  if (side === 'LONG') {
    return (currentPrice - entryPrice) * size / entryPrice;
  } else {
    return (entryPrice - currentPrice) * size / entryPrice;
  }
}

export function calculateLiquidationPrice(
  side: 'LONG' | 'SHORT',
  entryPrice: number,
  leverage: number,
  maintenanceMargin: number = 0.05
): number {
  if (side === 'LONG') {
    return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
  } else {
    return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
  }
}
