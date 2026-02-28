const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    console.log("🚀 STARTING REAL PRODUCTION VAULT DEPLOYMENT");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    // 1. Deploy Mock USDC (to use for vaults)
    console.log("\n💰 Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("✅ USDC Address:", usdcAddress);

    // 2. Deploy or reuse Perp DEX
    const perpDexAddress = "0xA5a93a9a72E3C5Ea8171BdBeFf07FD6c296Dee96";
    console.log("📡 Using PerpDEX:", perpDexAddress);

    // 3. Deploy Vault Implementation
    console.log("\n🏦 Deploying MolfiAgentVault Implementation...");
    const MolfiAgentVault = await hre.ethers.getContractFactory("MolfiAgentVault");
    const vaultImpl = await MolfiAgentVault.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddress = await vaultImpl.getAddress();
    console.log("✅ Vault Impl:", vaultImplAddress);

    // 4. Deploy Vault Factory
    console.log("\n🏭 Deploying MolfiVaultFactory...");
    const identityAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "0xB159E0c8093081712c92e274DbFEa5A97A80cA30";
    const MolfiVaultFactory = await hre.ethers.getContractFactory("MolfiVaultFactory");
    const factory = await MolfiVaultFactory.deploy(
        vaultImplAddress,
        identityAddress,
        perpDexAddress,
        usdcAddress
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("✅ Factory Address:", factoryAddress);

    // 5. Reconcile existing agents and give them vaults
    const IdentityRegistry = await hre.ethers.getContractAt("IdentityRegistryUpgradeable", identityAddress);

    const agentsToCreate = [
        { name: "ClawAlpha-01", personality: "Aggressive" },
        { name: "AetherGuardian", personality: "Conservative" },
        { name: "NexusPrime", personality: "Balanced" }
    ];

    console.log("\n🤖 Processing Agents...");

    for (let i = 0; i < agentsToCreate.length; i++) {
        const a = agentsToCreate[i];
        console.log(`\nAgent: ${a.name}`);

        // Try to find if a token exists for this "index" or name (we'll just register new ones to be sure we have clean IDs)
        console.log(`- Registering agent identity...`);
        const regTx = await IdentityRegistry["register(string)"](`ipfs://molfi-${a.name.toLowerCase()}`);
        const regReceipt = await regTx.wait();

        const registeredEvent = regReceipt.logs.find(
            (log) => log.topics[0] === IdentityRegistry.interface.getEvent("Registered").topicHash
        );
        const decoded = IdentityRegistry.interface.decodeEventLog("Registered", registeredEvent.data, registeredEvent.topics);
        const agentId = decoded.agentId;
        console.log(`- Agent ID: ${agentId}`);

        // Deploy Vault
        console.log(`- Deploying Vault via Factory...`);
        const deployTx = await factory.deployVault(agentId, a.name, a.name.substring(0, 4).toUpperCase());
        const deployReceipt = await deployTx.wait();

        const vaultEvent = deployReceipt.logs.find(
            (log) => log.topics[0] === factory.interface.getEvent("VaultDeployed").topicHash
        );
        const vaultAddress = factory.interface.decodeEventLog("VaultDeployed", vaultEvent.data, vaultEvent.topics).vaultAddress;
        console.log(`- Vault Address: ${vaultAddress}`);

        // Link in Registry
        console.log(`- Linking Vault to Agent ID...`);
        await (await IdentityRegistry.setAgentVault(agentId, vaultAddress)).wait();
        console.log("✅ Vault Linked Sucessfully.");
    }

    console.log("\n" + "=".repeat(40));
    console.log("🎉 ALL AGENTS HAVE VAULTS NOW");
    console.log("USDC:", usdcAddress);
    console.log("Factory:", factoryAddress);
    console.log("=".repeat(40));
}

main().catch((error) => {
    console.error("FATAL ERROR:", error);
    process.exit(1);
});
