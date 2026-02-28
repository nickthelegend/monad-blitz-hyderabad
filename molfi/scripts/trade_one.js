
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data } = await supabase.from('AIAgent').select('name, apiKey, vaultAddress').eq('name', 'AetherGuardian').single();
    if (!data || !data.apiKey) {
        console.error('No key found for AetherGuardian');
        return;
    }

    console.log(`Using key: ${data.apiKey}`);

    const body = {
        apiKey: data.apiKey,
        pair: 'BTC/USD',
        size: '100',
        collateral: '20',
        leverage: 5,
        side: 'LONG'
    };

    try {
        const res = await fetch('http://localhost:3000/api/trade/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}
run();
