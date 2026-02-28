const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
    console.log("📡 Seeding live trade signals...");

    const { data: agents } = await supabaseAdmin.from('AIAgent').select('*');
    if (!agents || agents.length === 0) {
        console.error("No agents found to seed signals for.");
        return;
    }

    const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'MON/USDT'];

    for (const agent of agents) {
        console.log(`Creating signal for ${agent.name}...`);
        const { error } = await supabaseAdmin.from('TradeSignal').insert({
            agentId: agent.agentId,
            pair: pairs[Math.floor(Math.random() * pairs.length)],
            size: (Math.random() * 5 + 0.5).toFixed(2),
            collateral: (Math.random() * 1000 + 100).toFixed(2),
            leverage: Math.floor(Math.random() * 20) + 5,
            isLong: Math.random() > 0.5,
            status: 'PENDING'
        });
        if (error) console.error(error.message);
    }
    console.log("✅ Signals seeded.");
}

main();
