/**
 * Test Trade Close — Uses agent API key to close a position
 * Usage: node scripts/test-trade-close.cjs [tradeId]
 *   or   node scripts/test-trade-close.cjs --all   (close all open trades)
 */

const BASE_URL = 'http://localhost:3000';

const API_KEYS = {
    clawAlpha: 'molfi_32e9ddf3b2697645ccebce698b7da01f2ee8b9c3ef731dd6fb7cde90c0170aff',       // Agent #0
    aetherGuardian: 'molfi_ee329f940bd6ee88184b7f250dbbf37362703f6073323e452489b6a1b332c505', // Agent #1
    nexusPrime: 'molfi_94e58cc7635a73778df832a1d7534ab558f66e164784b7590e7df6384cb4504c',    // Agent #2
};

async function closeTrade(apiKey, tradeId) {
    console.log(`\n🔴 Closing trade: ${tradeId}`);

    try {
        const res = await fetch(`${BASE_URL}/api/trade/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey, tradeId }),
        });

        const data = await res.json();

        if (data.success) {
            const t = data.trade;
            const pnlColor = t.pnl >= 0 ? '🟢' : '🔴';
            console.log(`✅ Trade closed!`);
            console.log(`   Agent: ${data.agent.name}`);
            console.log(`   ${t.pair} ${t.side}`);
            console.log(`   Entry: $${t.entryPrice.toFixed(2)} → Exit: $${t.exitPrice.toFixed(2)}`);
            console.log(`   ${pnlColor} PnL: ${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(4)}`);
            console.log(`   Fees: $${t.totalFees.toFixed(4)}`);
            console.log(`   Duration: ${(t.duration / 1000).toFixed(0)}s`);
            return true;
        } else {
            console.error(`❌ Failed: ${data.error}`);
            return false;
        }
    } catch (err) {
        console.error('❌ Request failed:', err.message);
        return false;
    }
}

async function fetchOpenTrades() {
    const res = await fetch(`${BASE_URL}/api/trades?status=OPEN`);
    const data = await res.json();
    return data.success ? data.trades : [];
}

async function main() {
    const arg = process.argv[2];

    console.log('===========================================');
    console.log('  MolFi Trade Close Test');
    console.log('===========================================');

    if (arg === '--all') {
        console.log('\n📋 Fetching all open trades...');
        const openTrades = await fetchOpenTrades();
        console.log(`   Found ${openTrades.length} open trades`);

        for (const trade of openTrades) {
            // Find matching API key for this agent
            const key = trade.agentId === 0 ? API_KEYS.clawAlpha
                : trade.agentId === 1 ? API_KEYS.aetherGuardian
                    : trade.agentId === 2 ? API_KEYS.nexusPrime
                        : null;
            if (key) {
                await closeTrade(key, trade.id);
            } else {
                console.log(`⚠️ No API key for agent #${trade.agentId}, skipping`);
            }
        }
    } else if (arg) {
        // Close specific trade — try both keys
        let success = await closeTrade(API_KEYS.nexusPrime, arg);
        if (!success) {
            success = await closeTrade(API_KEYS.aetherGuardian, arg);
        }
    } else {
        console.log('\nUsage:');
        console.log('  node scripts/test-trade-close.cjs <tradeId>');
        console.log('  node scripts/test-trade-close.cjs --all');

        console.log('\n📋 Current open trades:');
        const openTrades = await fetchOpenTrades();
        if (openTrades.length === 0) {
            console.log('   No open trades. Run test-trade-open.cjs first.');
        } else {
            openTrades.forEach(t => {
                console.log(`   ${t.id} | Agent: ${t.agentName} | ${t.side} ${t.pair} @ $${parseFloat(t.entryPrice).toFixed(2)}`);
            });
        }
    }

    // Show leaderboard
    console.log('\n📊 Current Leaderboard:');
    try {
        const lbRes = await fetch(`${BASE_URL}/api/trades?leaderboard=true`);
        const lbData = await lbRes.json();
        if (lbData.success) {
            lbData.leaderboard.forEach(a => {
                const pnl = a.totalPnL >= 0 ? `+$${a.totalPnL.toFixed(2)}` : `-$${Math.abs(a.totalPnL).toFixed(2)}`;
                console.log(`   #${a.rank} ${a.name.padEnd(18)} | Equity: $${a.equity.toFixed(2)} | PnL: ${pnl} | Trades: ${a.tradesCount} | Win: ${a.winRate}%`);
            });
        }
    } catch (err) {
        console.log('   Could not fetch leaderboard');
    }
}

main().catch(console.error);
