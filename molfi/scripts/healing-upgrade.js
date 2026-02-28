
const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log("🚀 STARTING HEALING UPGRADE PROCESS");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const identityAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;
    const perpDexAddress = process.env.NEXT_PUBLIC_MOLFIPERP_DEX;
    const usdcAddress = process.env.NEXT_PUBLIC_USDC;

    console.log(`- Identity Registry: ${identityAddress}`);
    console.log(`- Perp DEX: ${perpDexAddress}`);
    console.log(`- USDC: ${usdcAddress}`);

    // 1. Deploy NEW MolfiAgentVault Implementation
    console.log("\n🏦 Deploying NEW MolfiAgentVault Implementation...");
    const MolfiAgentVault = await hre.ethers.getContractFactory("MolfiAgentVault");
    const vaultImpl = await MolfiAgentVault.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddress = await vaultImpl.getAddress();
    console.log("✅ New Vault Impl:", vaultImplAddress);

    // 2. Deploy NEW Factory
    console.log("\n🏭 Deploying NEW MolfiVaultFactory...");
    const MolfiVaultFactory = await hre.ethers.getContractFactory("MolfiVaultFactory");
    const factory = await MolfiVaultFactory.deploy(
        vaultImplAddress,
        identityAddress,
        perpDexAddress,
        usdcAddress
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ New Factory Address:", factoryAddress);

    // 3. Fetch Agents from Supabase
    console.log("\n🤖 Fetching agents from Supabase...");
    const { data: agents, error: fetchError } = await supabase
        .from('AIAgent')
        .select('*');

    if (fetchError) throw fetchError;
    console.log(`Found ${agents.length} agents to upgrade.`);

    const IdentityRegistry = await hre.ethers.getContractAt("IdentityRegistryUpgradeable", identityAddress);

    // 4. Deploy New Vaults and Update DB
    for (const agent of agents) {
        console.log(`\n- Moving Agent: ${agent.name} (#${agent.agentId})`);

        try {
            // Deploy NEW Vault via Factory
            console.log(`  Deploying new vault...`);
            const deployTx = await factory.deployVault(
                agent.agentId,
                agent.name,
                agent.name.substring(0, 4).toUpperCase()
            );
            const receipt = await deployTx.wait();

            const vaultEvent = receipt.logs.find(
                (log) => log.topics[0] === factory.interface.getEvent("VaultDeployed").topicHash
            );
            const newVaultAddress = factory.interface.decodeEventLog("VaultDeployed", vaultEvent.data, vaultEvent.topics).vaultAddress;
            console.log(`  ✅ New Vault Address: ${newVaultAddress}`);

            // Update Identity Registry
            console.log(`  Linking NEW vault in IdentityRegistry...`);
            await (await IdentityRegistry.setAgentVault(agent.agentId, newVaultAddress)).wait();

            // Update Supabase
            console.log(`  Updating Supabase...`);
            const { error: updateError } = await supabase
                .from('AIAgent')
                .update({ vaultAddress: newVaultAddress })
                .eq('agentId', agent.agentId);

            if (updateError) throw updateError;
            console.log(`  ✅ Agent ${agent.name} successfully upgraded and healed!`);

        } catch (err) {
            console.error(`  ❌ Failed to upgrade ${agent.name}:`, err.message);
        }
    }

    // 5. Update .env.local
    console.log("\n📝 Updating .env.local with new Factory address...");
    let envContent = fs.readFileSync(".env.local", "utf8");
    const factoryKey = "NEXT_PUBLIC_VAULT_FACTORY=";
    const regex = new RegExp(`${factoryKey}.*`, "g");

    if (envContent.includes(factoryKey)) {
        envContent = envContent.replace(regex, `${factoryKey}${factoryAddress}`);
    } else {
        envContent += `\n${factoryKey}${factoryAddress}`;
    }

    fs.writeFileSync(".env.local", envContent);
    console.log("✅ .env.local updated.");

    console.log("\n" + "=".repeat(40));
    console.log("🎉 HEALING UPGRADE COMPLETE");
    console.log(`NEXT_PUBLIC_VAULT_FACTORY=${factoryAddress}`);
    console.log("=".repeat(40));
    console.log("Existing agents now have new vaults controlled by you.");
}

main().catch((error) => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
