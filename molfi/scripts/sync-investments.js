
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// ABI for ERC4626 balanceOf
const VAULT_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function name() view returns (string)"
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = "https://testnet-rpc.monad.xyz";

async function main() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase environment variables in .env.local");
        return;
    }

    console.log("🚀 Starting Investment Cleanup & Sync Script...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const provider = new ethers.JsonRpcProvider(RPC_URL);

    // 1. Fetch all ACTIVE investments
    console.log("📂 Fetching ACTIVE investments from Supabase...");
    const { data: investments, error } = await supabase
        .from('investments')
        .select(`
            *,
            agents (
                name,
                vault_address
            )
        `)
        .eq('status', 'ACTIVE');

    if (error) {
        console.error("❌ Error fetching investments:", error);
        return;
    }

    if (!investments || investments.length === 0) {
        console.log("✅ No ACTIVE investments found. Database is already clean.");
        return;
    }

    console.log(`🔍 Found ${investments.length} active investments. Checking on-chain status...`);

    let closedCount = 0;

    for (const inv of investments) {
        const vaultAddress = inv.agents?.vault_address;
        const userAddress = inv.user_address;
        const agentName = inv.agents?.name || "Unknown";

        if (!vaultAddress) {
            console.log(`⚠️ Skip: No vault address for ${agentName} (ID: ${inv.agent_id})`);
            continue;
        }

        try {
            const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
            const balance = await vault.balanceOf(userAddress);

            console.log(`📊 Agent: ${agentName.padEnd(20)} | User: ${userAddress.substring(0, 10)}... | Balance: ${ethers.formatEther(balance)}`);

            if (balance === 0n) {
                console.log(`✅ Position CLOSED on-chain. Updating database...`);

                const { error: updateError } = await supabase
                    .from('investments')
                    .update({
                        status: 'CLOSED',
                        withdrawn_at: new Date().toISOString()
                    })
                    .eq('id', inv.id);

                if (updateError) {
                    console.error(`❌ Failed to update investment ${inv.tx_hash}:`, updateError);
                } else {
                    console.log(`✨ Successfully marked investment ${inv.id.substring(0, 8)} as CLOSED`);
                    closedCount++;
                }
            } else {
                console.log(`ℹ️ Position still ACTIVE (Balance > 0)`);
            }
        } catch (err) {
            console.error(`❌ Error checking balance for ${agentName}:`, err.message);
        }
        console.log("-".repeat(50));
    }

    console.log(`\n🎉 Sync Complete!`);
    console.log(`✅ Marked ${closedCount} investments as CLOSED based on on-chain reality.`);
}

main().catch(err => {
    console.error("💀 Fatal Error:", err);
});
