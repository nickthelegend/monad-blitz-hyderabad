/**
 * Quick script to update agent vault address in Supabase
 * Usage: node scripts/update-vault-address.cjs <agentId> <newVaultAddress>
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const agentId = parseInt(process.argv[2] || "1");
    const newVault = process.argv[3] || "0x88CD78e98b11D70bABD6eb737E9e5Aa9011cC1f0";

    console.log(`Updating agent ${agentId} vault to: ${newVault}`);

    // First, show current state
    const { data: before } = await supabase
        .from("AIAgent")
        .select("agentId, name, vaultAddress")
        .eq("agentId", agentId)
        .single();

    if (before) {
        console.log("  Current vault:", before.vaultAddress);
    }

    // Update
    const { data, error } = await supabase
        .from("AIAgent")
        .update({ vaultAddress: newVault })
        .eq("agentId", agentId)
        .select()
        .single();

    if (error) {
        console.error("❌ Error:", error.message);
        return;
    }

    console.log("✅ Updated successfully!");
    console.log("  Agent:", data.name);
    console.log("  New vault:", data.vaultAddress);
}

main().catch(console.error);
