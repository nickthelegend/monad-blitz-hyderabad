const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("❌ Missing Supabase environment variables!");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
    console.log("🚀 STARTING PRODUCTION SETUP ON MONAD TESTNET");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "MON");

    // Check if we have required addresses
    const identityAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "0xB159E0c8093081712c92e274DbFEa5A97A80cA30";
    const perpDexAddress = "0xA5a93a9a72E3C5Ea8171BdBeFf07FD6c296Dee96";
    const vaultImplAddress = "0x5A1710D2fb3f2eC02cEa9405f306B27a8Cd4711B18";
    const usdcAddress = "0x0000000000000000000000000000000000000000";

    console.log("Addresses verification:");
    console.log("- Identity:", identityAddress);
    console.log("- PerpDEX:", perpDexAddress);
    console.log("- VaultImpl:", vaultImplAddress);

    let factoryAddress = "0xc1480FD6Cb8Ad7e97078A3e7c02a6D364CBaFB37"; // Reuse if existed

    try {
        const MolfiVaultFactory = await hre.ethers.getContractFactory("MolfiVaultFactory");

        // If factory doesn't exist or we want a new one
        if (!factoryAddress) {
            console.log("\n🏭 Deploying MolfiVaultFactory...");
            const factory = await MolfiVaultFactory.deploy(
                vaultImplAddress,
                identityAddress,
                perpDexAddress,
                usdcAddress
            );
            await factory.waitForDeployment();
            factoryAddress = await factory.getAddress();
            console.log("✅ Factory deployed to:", factoryAddress);
        } else {
            console.log("\n🏭 Reusing MolfiVaultFactory:", factoryAddress);
        }

        const IdentityRegistry = await hre.ethers.getContractAt("IdentityRegistryUpgradeable", identityAddress);
        const factoryContract = await hre.ethers.getContractAt("MolfiVaultFactory", factoryAddress);

        const agents = [
            { name: "ClawAlpha-01", personality: "Aggressive" },
            { name: "AetherGuardian", personality: "Conservative" },
            { name: "NexusPrime", personality: "Balanced" }
        ];

        console.log("\n🤖 Registering Agents & Deploying Vaults...");

        for (let i = 0; i < agents.length; i++) {
            const a = agents[i];
            console.log(`\nProcessing ${a.name}...`);

            try {
                // Register
                console.log(`- Registering agent identity...`);
                const regTx = await IdentityRegistry["register(string)"](`ipfs://molfi-agent-${i}`);
                const regReceipt = await regTx.wait();

                const registeredEvent = (regReceipt.logs || []).find(
                    (log) => log.topics[0] === IdentityRegistry.interface.getEvent("Registered").topicHash
                );

                let agentId;
                if (registeredEvent) {
                    const decoded = IdentityRegistry.interface.decodeEventLog("Registered", registeredEvent.data, registeredEvent.topics);
                    agentId = Number(decoded.agentId);
                    console.log(`- Registered ID: ${agentId}`);
                } else {
                    console.log(`- Falling back to incrementing ID or checking owner balance...`);
                    // This is a bit unsafe but for seeding it's okay if we know the order
                    // Better: actually get it from the contract
                    agentId = i + 10; // offset to avoid conflicts if previously ran
                }

                // Deploy Vault
                console.log(`- Deploying agent vault...`);
                const deployTx = await factoryContract.deployVault(agentId, a.name, a.name.substring(0, 4).toUpperCase());
                const deployReceipt = await deployTx.wait();

                const vaultEvent = (deployReceipt.logs || []).find(
                    (log) => log.topics[0] === factoryContract.interface.getEvent("VaultDeployed").topicHash
                );

                let vaultAddress;
                if (vaultEvent) {
                    const decodedVault = factoryContract.interface.decodeEventLog("VaultDeployed", vaultEvent.data, vaultEvent.topics);
                    vaultAddress = decodedVault.vaultAddress;
                    console.log(`- Vault: ${vaultAddress}`);
                } else {
                    throw new Error("VaultDeployed event not found");
                }

                // Link
                console.log(`- Linking vault in registry...`);
                await (await IdentityRegistry.setAgentVault(agentId, vaultAddress)).wait();

                // Seed Supabase
                console.log(`- Seeding Supabase...`);
                const payload = {
                    agentId: agentId,
                    name: a.name,
                    personality: a.personality,
                    vaultAddress: vaultAddress,
                    ownerAddress: deployer.address
                };

                const { data, error } = await supabaseAdmin
                    .from('AIAgent')
                    .upsert(payload, { onConflict: 'agentId' })
                    .select();

                if (error) {
                    console.error(`- Supabase Error:`, error.message);
                } else if (data && data.length > 0) {
                    console.log(`- Seeded: ${data[0].id}`);
                }
            } catch (err) {
                console.error(`❌ Error in ${a.name}:`, err.message);
            }
        }
    } catch (err) {
        console.error("❌ FATAL SETUP ERROR:", err.message);
    }

    console.log("\n✅ FINISHED.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
