const axios = require('axios');

const API_KEY = 'molfi_637c183fc071812076b5ed15b1351abc6288a711d350cabf0a1ac6a6be497b79';
const BASE_URL = 'http://localhost:3000'; // Adjust if running on a different port/host

async function executeSell() {
    try {
        const response = await axios.post(`${BASE_URL}/api/trade/open`, {
            apiKey: API_KEY,
            pair: 'BTC/USD',
            side: 'SHORT', // "SELL" in perp terms usually means opening a SHORT or closing a LONG. 
            // Based on the prompt "do a SELL", assuming opening a SHORT position. 
            // If closing, we would use /api/trade/close. 
            // Let's assume opening a SHORT for now as per "trading cycle".
            size: '0.1',   // Example size
            collateral: '100', // Example collateral
            leverage: 5    // Example leverage
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Trade executed successfully:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error executing trade:', error.response ? error.response.data : error.message);
    }
}

executeSell();
