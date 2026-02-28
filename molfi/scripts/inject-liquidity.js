
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.local' });

// ERC20 ABI for transfer
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function symbol() view returns (string)"
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RPC_URL = "https://testnet-rpc.monad.xyz";
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC || "0x98EF37D9ca1288B35fD1C1Bf36AcA618F12E02D4"; // Fallsback to known mUSD address

async function main() {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("❌ Missing Supabase environment variables");
        return;
    }

    const deployerKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!deployerKey) {
        console.error("❌ Missing DEPLOYER_PRIVATE_KEY");
        return;
    }

    console.log("🚀 Starting Agent Liquidity Injection...");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(deployerKey, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, wallet);

    // 1. Check Deployer Balance
    const deployerBalance = await usdc.balanceOf(wallet.address);
    console.log(`🏦 Deployer Address: ${wallet.address}`);
    console.log(`💰 Deployer Balance: ${ethers.formatUnits(deployerBalance, 18)} mUSD`);

    const refillAmount = ethers.parseUnits("10000", 18);

    if (deployerBalance < refillAmount) {
        console.warn(`⚠️ Warning: Balance might be too low for multiple dispensers.`);
    }

    // 2. Fetch all Agents
    console.log("📂 Fetching all agents from Supabase...");
    const { data: agents, error } = await supabase.from('agents').select('*');
    if (error) throw error;

    console.log(`🤖 Found ${agents.length} agents. Injecting 10,000 mUSD into each vault...`);

    for (const agent of agents) {
        if (!agent.vault_address) {
            console.log(`⏭️ Skipping ${agent.name}: No vault address.`);
            continue;
        }

        console.log(`\n💎 Injecting into ${agent.name} (${agent.vault_address})...`);

        try {
            // Check if already has balance (optional, but good for logs)
            const currentBal = await usdc.balanceOf(agent.vault_address);
            console.log(`   Current Balance: ${ethers.formatUnits(currentBal, 18)} mUSD`);

            const tx = await usdc.transfer(agent.vault_address, refillAmount);
            console.log(`   Transaction Sent: ${tx.hash}`);

            await tx.wait();
            console.log(`   ✅ Success!`);
        } catch (err) {
            console.error(`   ❌ Failed to inject into ${agent.name}:`, err.message);
        }
    }

    console.log("\n🎉 Liquidity injection complete for all agents.");
}

main().catch(err => {
    console.error("💀 Fatal Error:", err);
});
