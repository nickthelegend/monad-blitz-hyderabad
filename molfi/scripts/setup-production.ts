import { ethers } from "hardhat";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing Supabase environment variables!");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
    console.log("🚀 STARTING PRODUCTION SETUP ON MONAD TESTNET");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 1. Deploy Perp DEX
    console.log("\n📡 Deploying MolfiPerpDEX...");
    const MolfiPerpDEX = await ethers.getContractFactory("MolfiPerpDEX");
    // Using a fixed oracle address for Monad testnet or placeholder
    const perpDex = await MolfiPerpDEX.deploy("0x0c76859E85727683Eeba0C70Bc2e0F5781337818");
    await perpDex.waitForDeployment();
    const perpDexAddress = await perpDex.getAddress();
    console.log("✅ MolfiPerpDEX:", perpDexAddress);

    // 2. Deploy Vault Implementation
    console.log("\n🏦 Deploying MolfiAgentVault Implementation...");
    const MolfiAgentVault = await ethers.getContractFactory("MolfiAgentVault");
    const vaultImpl = await MolfiAgentVault.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddress = await vaultImpl.getAddress();
    console.log("✅ Vault Impl:", vaultImplAddress);

    // 3. Deploy Vault Factory
    console.log("\n🏭 Deploying MolfiVaultFactory...");
    const identityRegistryAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "0xB159E0c8093081712c92e274DbFEa5A97A80cA30";
    const usdcAddress = "0x" + "0".repeat(40);

    const MolfiVaultFactory = await ethers.getContractFactory("MolfiVaultFactory");
    const factory = await MolfiVaultFactory.deploy(
        vaultImplAddress,
        identityRegistryAddress,
        perpDexAddress,
        usdcAddress
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ Factory:", factoryAddress);

    const agents = [
        { name: "ClawAlpha-01", personality: "Aggressive" },
        { name: "AetherGuardian", personality: "Conservative" },
        { name: "NexusPrime", personality: "Balanced" }
    ];

    const IdentityRegistry = await ethers.getContractAt("IdentityRegistryUpgradeable", identityRegistryAddress);
    console.log("\n🤖 Registering Agents & Deploying Vaults...");

    const seededAgents = [];

    for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        console.log(`\nProcessing ${a.name}...`);

        try {
            // Register - Using the specific overload for register(string)
            // In ethers v6, we can use the signature if needed or just register
            const regTx = await IdentityRegistry.getFunction("register(string)")(`ipfs://molfi-agent-${i}`);
            const regReceipt = await regTx.wait();
            if (!regReceipt) throw new Error("Registration failed");

            const registeredEvent = regReceipt.logs.find(
                (log: any) => log.topics[0] === IdentityRegistry.interface.getEvent("Registered").topicHash
            );
            if (!registeredEvent) throw new Error("Registered event not found");
            const decoded = IdentityRegistry.interface.decodeEventLog("Registered", registeredEvent.data, registeredEvent.topics);
            const agentId = Number(decoded.agentId);
            console.log(`- Registered ID: ${agentId}`);

            // Vault
            const deployTx = await factory.deployVault(agentId, a.name, a.name.substring(0, 4).toUpperCase());
            const deployReceipt = await deployTx.wait();
            if (!deployReceipt) throw new Error("Vault deployment failed");

            const vaultEvent = deployReceipt.logs.find(
                (log: any) => log.topics[0] === factory.interface.getEvent("VaultDeployed").topicHash
            );
            if (!vaultEvent) throw new Error("VaultDeployed event not found");
            const vaultAddress = factory.interface.decodeEventLog("VaultDeployed", vaultEvent.data, vaultEvent.topics).vaultAddress;
            console.log(`- Vault: ${vaultAddress}`);

            // Link
            console.log(`- Linking vault in Registry...`);
            const linkTx = await IdentityRegistry.setAgentVault(agentId, vaultAddress);
            await linkTx.wait();

            // Supabase
            console.log(`- Seeding Supabase for ${a.name}...`);
            const payload = {
                agentId: agentId,
                name: a.name,
                personality: a.personality,
                vaultAddress: vaultAddress,
                ownerAddress: deployer.address
            };

            const { data: dbAgent, error: dbError } = await supabaseAdmin
                .from('AIAgent')
                .upsert(payload, { onConflict: 'agentId' })
                .select();

            if (dbError) {
                console.error(`- Supabase Error for ${a.name}:`, JSON.stringify(dbError));
            } else if (dbAgent && dbAgent.length > 0) {
                console.log(`- Seeded in DB: ${dbAgent[0].id}`);
                seededAgents.push(dbAgent[0]);
            } else {
                console.log(`- Seeded in DB (no returned data)`);
            }
        } catch (err: any) {
            console.error(`❌ Error processing ${a.name}:`, err.message);
        }
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 PRODUCTION SETUP SUMMARY");
    console.log("=".repeat(60));
    console.log(`PerpDEX: ${perpDexAddress}`);
    console.log(`Factory: ${factoryAddress}`);
    console.log(`Agents Seeded: ${seededAgents.length}`);
    console.log("=".repeat(60));
}

main().catch(error => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
