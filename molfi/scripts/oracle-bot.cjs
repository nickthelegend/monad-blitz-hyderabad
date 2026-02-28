/**
 * MolFi Oracle Bot
 * ═══════════════════════════════════════════════════════════════
 * Fetches real-time prices from Binance and pushes them on-chain
 * to the MolfiOracle contract on Monad Testnet.
 *
 * Architecture:  Binance REST API → this bot → MolfiOracle.updatePrices()
 *
 * Usage:
 *   node scripts/oracle-bot.cjs                    # default 10s interval
 *   node scripts/oracle-bot.cjs --interval 5       # custom interval in seconds
 *   node scripts/oracle-bot.cjs --once              # single update then exit
 *
 * Requires .env.local with:
 *   DEPLOYER_PRIVATE_KEY       — wallet that deployed the oracle (= updater)
 *   NEXT_PUBLIC_MOLFI_ORACLE   — deployed MolfiOracle contract address
 */
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// ── Config ───────────────────────────────────────────────────────
const RPC_URL = 'https://testnet-rpc.monad.xyz';
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_MOLFI_ORACLE;
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Binance symbols → our pair names
const BINANCE_MAP = {
    'BTCUSDT': 'BTC/USD',
    'ETHUSDT': 'ETH/USD',
    'SOLUSDT': 'SOL/USD',
    'LINKUSDT': 'LINK/USD',
    'DOGEUSDT': 'DOGE/USD',
    'AVAXUSDT': 'AVAX/USD',
    'MATICUSDT': 'MATIC/USD',
    'DOTUSDT': 'DOT/USD',
    'NEARUSDT': 'NEAR/USD',
};

const ORACLE_ABI = [
    'function updatePrice(string calldata pair, uint256 price) external',
    'function updatePrices(string[] calldata pairs, uint256[] calldata prices) external',
    'function getLatestPrice(string memory pair) public view returns (uint256)',
    'function getPriceUnsafe(string memory pair) external view returns (uint256 price, uint256 updatedAt, bool isStale)',
    'function getAllPrices() external view returns (string[] memory pairs, uint256[] memory prices, uint256[] memory timestamps)',
    'function owner() external view returns (address)',
    'function updaters(address) external view returns (bool)',
];

// ── Parse CLI args ───────────────────────────────────────────────
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
let interval = 10; // seconds
const intervalIdx = args.indexOf('--interval');
if (intervalIdx !== -1 && args[intervalIdx + 1]) {
    interval = parseInt(args[intervalIdx + 1], 10);
}

// ── Validation ───────────────────────────────────────────────────
if (!ORACLE_ADDRESS) {
    console.error('❌ NEXT_PUBLIC_MOLFI_ORACLE not set in .env.local');
    console.error('   Deploy the oracle first: npx hardhat run scripts/deploy-oracle.ts --network monadTestnet');
    process.exit(1);
}

if (!PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not set in .env.local');
    process.exit(1);
}

// ── Setup ────────────────────────────────────────────────────────
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const oracle = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, wallet);

// ── Fetch prices from Binance ────────────────────────────────────
async function fetchBinancePrices() {
    const symbols = Object.keys(BINANCE_MAP);
    const query = JSON.stringify(symbols);
    const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(query)}`;

    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const priceMap = {};

    for (const item of data) {
        const pair = BINANCE_MAP[item.symbol];
        if (pair) {
            priceMap[pair] = parseFloat(item.price);
        }
    }

    return priceMap;
}

// ── Push prices on-chain (individual calls — batch has viaIR issues) ──
async function pushPrices(priceMap) {
    let totalGas = 0n;
    let lastHash = '';

    for (const [pair, price] of Object.entries(priceMap)) {
        const priceWei = ethers.parseUnits(price.toFixed(8), 18);
        const tx = await oracle.updatePrice(pair, priceWei, { gasLimit: 300000 });
        const receipt = await tx.wait();
        totalGas += receipt.gasUsed;
        lastHash = tx.hash;
    }

    return { hash: lastHash, gasUsed: totalGas.toString() };
}

// ── Main loop ────────────────────────────────────────────────────
let updateCount = 0;
let errorCount = 0;

async function tick() {
    try {
        // 1. Fetch from Binance
        const prices = await fetchBinancePrices();

        // 2. Push on-chain
        const result = await pushPrices(prices);
        updateCount++;

        // 3. Log
        const timestamp = new Date().toLocaleTimeString();
        const priceStr = Object.entries(prices)
            .map(([pair, price]) => `${pair}: $${price.toLocaleString()}`)
            .join(' | ');

        console.log(`[${timestamp}] #${updateCount} ✅ ${priceStr}`);
        console.log(`   last tx: ${result.hash} (total gas: ${result.gasUsed})`);

    } catch (err) {
        errorCount++;
        const timestamp = new Date().toLocaleTimeString();
        console.error(`[${timestamp}] ❌ Error #${errorCount}: ${err.message}`);

        // If it's a deviation error, the price moved too fast — wait and retry
        if (err.message.includes('deviation')) {
            console.log('   → Price moved too fast. Will retry next tick.');
        }
    }
}

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║           MolFi Oracle Bot v1.0                  ║');
    console.log('║   Binance → MolfiOracle on Monad Testnet        ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  Oracle:   ${ORACLE_ADDRESS}`);
    console.log(`  Updater:  ${wallet.address}`);
    console.log(`  Interval: ${interval}s`);
    console.log(`  Mode:     ${isOnce ? 'single update' : 'continuous'}`);
    console.log(`  Pairs:    ${Object.values(BINANCE_MAP).join(', ')}`);
    console.log('');

    // Verify we have updater permission
    try {
        const isUpdater = await oracle.updaters(wallet.address);
        const isOwner = (await oracle.owner()) === wallet.address;

        if (!isUpdater && !isOwner) {
            console.error('❌ This wallet is not an authorized updater!');
            console.error('   Call oracle.setUpdater(address, true) from the owner.');
            process.exit(1);
        }
        console.log(`  Auth:     ${isOwner ? 'OWNER' : 'UPDATER'} ✓`);
    } catch (err) {
        console.error('❌ Could not verify updater status:', err.message);
        console.log('   Continuing anyway...');
    }

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`  Balance:  ${ethers.formatEther(balance)} MON`);
    console.log('');
    console.log('─'.repeat(52));
    console.log('');

    if (isOnce) {
        await tick();
        console.log('\nDone (single update mode).');
    } else {
        // Initial tick
        await tick();

        // Schedule recurring
        setInterval(tick, interval * 1000);
        console.log(`\n  Updating every ${interval}s. Press Ctrl+C to stop.\n`);
    }
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
