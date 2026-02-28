const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateApiKey() {
    return `molfi_${crypto.randomBytes(32).toString("hex")}`;
}

async function main() {
    const { data: agents } = await s.from("AIAgent").select("agentId, name, apiKey");

    for (const agent of agents) {
        if (agent.apiKey) {
            console.log(`Agent #${agent.agentId} (${agent.name}): already has key`);
            continue;
        }

        const key = generateApiKey();
        const { error } = await s
            .from("AIAgent")
            .update({ apiKey: key })
            .eq("agentId", agent.agentId);

        if (error) {
            console.error(`❌ Agent #${agent.agentId}: ${error.message}`);
        } else {
            console.log(`✅ Agent #${agent.agentId} (${agent.name})`);
            console.log(`   API Key: ${key}`);
            console.log("");
        }
    }
}

main().catch(console.error);
