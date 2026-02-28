/**
 * Test Trade Open — Uses agent API key to open a position
 * Usage: node scripts/test-trade-open.cjs
 */

const BASE_URL = 'http://localhost:3000';

// Agent API keys (from generate-api-keys.cjs)
const API_KEYS = {
    clawAlpha: 'molfi_32e9ddf3b2697645ccebce698b7da01f2ee8b9c3ef731dd6fb7cde90c0170aff',       // Agent #0
    aetherGuardian: 'molfi_ee329f940bd6ee88184b7f250dbbf37362703f6073323e452489b6a1b332c505', // Agent #1
    nexusPrime: 'molfi_94e58cc7635a73778df832a1d7534ab558f66e164784b7590e7df6384cb4504c',    // Agent #2
};

async function openTrade(apiKey, pair, side, size, collateral, leverage) {
    console.log(`\n🔵 Opening ${side} ${pair} | Size: ${size} | Lev: ${leverage}x`);

    try {
        const res = await fetch(`${BASE_URL}/api/trade/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, pair, size, collateral, leverage, side }),
        });

        const data = await res.json();

        if (data.success) {
            console.log(`✅ Trade opened!`);
            console.log(`   Trade ID: ${data.tradeId}`);
            console.log(`   Agent: ${data.agent.name} (#${data.agent.id})`);
            console.log(`   Entry: $${data.trade.entryPrice.toFixed(2)}`);
            console.log(`   Liq Price: $${data.trade.liquidationPrice}`);
            console.log(`   Fees: $${data.trade.fees}`);
            console.log(`   Source: ${data.trade.priceSource}`);
            return data.tradeId;
        } else {
            console.error(`❌ Failed: ${data.error}`);
            return null;
        }
    } catch (err) {
        console.error('❌ Request failed:', err.message);
        return null;
    }
}

async function main() {
    console.log('===========================================');
    console.log('  MolFi Trade Open Test');
    console.log('===========================================');

    // First, fetch prices
    console.log('\n📊 Fetching live prices...');
    try {
        const priceRes = await fetch(`${BASE_URL}/api/prices?symbol=all`);
        const priceData = await priceRes.json();
        if (priceData.success) {
            priceData.data.forEach(p => {
                console.log(`   ${p.symbol}: $${p.price.toFixed(2)} (${p.source})`);
            });
        }
    } catch (err) {
        console.log('   ⚠️ Could not fetch prices:', err.message);
    }

    // --- Agent 2: NexusPrime goes LONG BTC ---
    const trade1 = await openTrade(
        API_KEYS.nexusPrime,
        'BTC/USD',
        'LONG',
        500,    // $500 size
        100,    // $100 collateral
        5       // 5x leverage
    );

    // --- Agent 1: AetherGuardian goes SHORT ETH ---
    const trade2 = await openTrade(
        API_KEYS.aetherGuardian,
        'ETH/USD',
        'SHORT',
        300,    // $300 size
        150,    // $150 collateral
        2       // 2x leverage
    );

    // --- Agent 0: ClawAlpha opens a LINK position ---
    const trade3 = await openTrade(
        API_KEYS.clawAlpha,
        'LINK/USD',
        'LONG',
        200,
        100,
        2
    );

    console.log('\n===========================================');
    console.log('  Summary');
    console.log('===========================================');
    console.log(`Trade 1 (BTC LONG): ${trade1 || 'FAILED'}`);
    console.log(`Trade 2 (ETH SHORT): ${trade2 || 'FAILED'}`);
    console.log(`Trade 3 (LINK LONG): ${trade3 || 'FAILED'}`);

    if (trade1 || trade2 || trade3) {
        console.log('\n💡 Save the trade IDs above to test closing with:');
        console.log('   node scripts/test-trade-close.cjs <tradeId>');
    }
}

main().catch(console.error);
