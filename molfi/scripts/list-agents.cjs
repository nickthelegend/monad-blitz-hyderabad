const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data } = await s.from("AIAgent").select("agentId, name, vaultAddress");
    data.forEach(a => console.log(`Agent #${a.agentId}: ${a.name} -> ${a.vaultAddress}`));
}

main().catch(console.error);
