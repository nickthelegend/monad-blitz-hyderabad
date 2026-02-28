
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function openTrades() {
    // 1. Get Agents
    const { data: agents, error } = await supabase.from('AIAgent').select('*');
    if (error || !agents) {
        console.error('Error fetching agents:', error);
        return;
    }

    console.log(`Found ${agents.length} agents.`);

    const pairs = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

    for (const agent of agents) {
        if (!agent.apiKey) continue;

        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        const side = 'LONG';

        console.log(`Opening ${side} ${pair} for ${agent.name}...`);

        try {
            const res = await fetch(`http://localhost:3000/api/trade/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apiKey: agent.apiKey,
                    pair: pair,
                    size: "100",
                    collateral: "10",
                    leverage: 10,
                    side: side
                })
            });
            const result = await res.json();
            console.log(`Result for ${agent.name}:`, JSON.stringify(result, null, 2));
        } catch (err: any) {
            console.error(`Failed to open trade for ${agent.name}:`, err.message);
        }
    }
}

openTrades();
