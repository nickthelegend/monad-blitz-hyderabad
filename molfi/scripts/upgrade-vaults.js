
const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log("🚀 STARTING VAULT UPGRADE PROCESS");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 1. Deploy New Vault Implementation
    console.log("\n🏦 Deploying NEW MolfiAgentVault Implementation...");
    const MolfiAgentVault = await hre.ethers.getContractFactory("MolfiAgentVault");
    const vaultImpl = await MolfiAgentVault.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddress = await vaultImpl.getAddress();
    console.log("✅ New Vault Impl deployed at:", vaultImplAddress);

    // 2. Fetch Agents from Supabase
    console.log("\n🤖 Fetching agents from Supabase...");
    const { data: agents, error } = await supabase
        .from('AIAgent')
        .select('agentId, name, vaultAddress');

    if (error) {
        console.error("Error fetching agents:", error);
        return;
    }

    console.log(`Found ${agents.length} agents.`);

    // 3. Upgrade each vault
    for (const agent of agents) {
        if (!agent.vaultAddress) {
            console.log(`- Skipping agent ${agent.name} (#${agent.agentId}): No vault address.`);
            continue;
        }

        console.log(`\n- Upgrading vault for ${agent.name} (#${agent.agentId}) at ${agent.vaultAddress}...`);

        try {
            const vaultProxy = await hre.ethers.getContractAt("MolfiAgentVault", agent.vaultAddress);

            // Check if we are the owner
            const owner = await vaultProxy.owner();
            if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
                console.error(`  ❌ Error: Deployer is not the owner of this vault. Owner is ${owner}`);
                continue;
            }

            console.log(`  Sending upgradeToAndCall...`);
            const tx = await vaultProxy.upgradeToAndCall(vaultImplAddress, "0x");
            console.log(`  TX Sent: ${tx.hash}`);
            await tx.wait();
            console.log(`  ✅ Vault upgraded successfully!`);
        } catch (err) {
            console.error(`  ❌ Failed to upgrade vault:`, err.message);
        }
    }

    console.log("\n" + "=".repeat(40));
    console.log("🎉 ALL UPGRADES COMPLETED");
    console.log("New Implementation:", vaultImplAddress);
    console.log("=".repeat(40));
}

main().catch((error) => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
