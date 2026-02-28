const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function checkTrades() {
    try {
        const response = await axios.get(`${BASE_URL}/api/trades?limit=10`);
        const trades = response.data.trades;
        const prices = response.data.livePrices;

        console.log('--- Live Prices (Binance via Cache) ---');
        console.log(prices);

        console.log('--- Recent Trades ---');
        trades.slice(0, 3).forEach(t => {
            if (t.status === 'OPEN') {
                console.log(`Open Trade: ${t.pair} ${t.side}`);
                console.log(`  Entry: ${t.entryPrice}, Current: ${t.currentPrice}`);
                console.log(`  Size: ${t.size}, Collateral: ${t.collateral}`);
                console.log(`  Unrealized PnL: ${t.unrealizedPnl}`);
                console.log(`  PnL Percent: ${t.pnlPercent}%`);
            } else {
                console.log(`Closed Trade: ${t.pair} PnL: ${t.pnl}`);
            }
        });
    } catch (error) {
        console.error('Error fetching trades:', error.message);
    }
}

checkTrades();
