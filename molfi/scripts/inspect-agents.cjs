const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await s.from("AIAgent").select("*");
    if (error) {
        console.error("Error:", error.message);
        return;
    }
    console.log("=== ALL AGENTS IN SUPABASE ===\n");
    data.forEach(a => {
        console.log(`Agent #${a.agentId}: ${a.name}`);
        console.log(`  personality: ${a.personality}`);
        console.log(`  ownerAddress: ${a.ownerAddress}`);
        console.log(`  vaultAddress: ${a.vaultAddress}`);
        console.log(`  apiKey: ${a.apiKey || '❌ NONE'}`);
        console.log(`  strategy: ${a.strategy || 'N/A'}`);
        console.log(`  description: ${a.description || 'N/A'}`);
        console.log(`  createdAt: ${a.createdAt}`);
        console.log("");
    });
    console.log(`Total: ${data.length} agents`);
}

main().catch(console.error);
