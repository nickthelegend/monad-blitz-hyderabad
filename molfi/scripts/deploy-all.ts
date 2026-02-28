import pkg from "hardhat";
const { ethers, upgrades } = pkg;
import * as fs from "fs";

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 DEPLOYING ERC-8004 CONTRACTS TO MONAD TESTNET");
    console.log("=".repeat(70) + "\n");

    // Get deployer
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "MON\n");

    if (balance === 0n) {
        throw new Error("❌ Deployer has no balance! Please fund the address first.");
    }

    // Deploy IdentityRegistry
    console.log("📝 Deploying IdentityRegistry...");
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistryUpgradeable");
    const identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
        initializer: "initialize",
    });
    await identityRegistry.waitForDeployment();
    const identityAddress = await identityRegistry.getAddress();
    console.log("✅ IdentityRegistry deployed to:", identityAddress);

    // Deploy ReputationRegistry
    console.log("\n📊 Deploying ReputationRegistry...");
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistryUpgradeable");
    const reputationRegistry = await upgrades.deployProxy(
        ReputationRegistry,
        [identityAddress],
        { initializer: "initialize" }
    );
    await reputationRegistry.waitForDeployment();
    const reputationAddress = await reputationRegistry.getAddress();
    console.log("✅ ReputationRegistry deployed to:", reputationAddress);

    // Deploy ValidationRegistry
    console.log("\n🔍 Deploying ValidationRegistry...");
    const ValidationRegistry = await ethers.getContractFactory("ValidationRegistryUpgradeable");
    const validationRegistry = await upgrades.deployProxy(
        ValidationRegistry,
        [identityAddress],
        { initializer: "initialize" }
    );
    await validationRegistry.waitForDeployment();
    const validationAddress = await validationRegistry.getAddress();
    console.log("✅ ValidationRegistry deployed to:", validationAddress);

    // Save deployment info
    const deploymentInfo = {
        network: "monadTestnet",
        chainId: 10143,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            identityRegistry: identityAddress,
            reputationRegistry: reputationAddress,
            validationRegistry: validationAddress,
        },
    };

    fs.writeFileSync(
        "deployment-monad-testnet.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n📋 Contract Addresses:");
    console.log("-------------------");
    console.log("IdentityRegistry:   ", identityAddress);
    console.log("ReputationRegistry: ", reputationAddress);
    console.log("ValidationRegistry: ", validationAddress);

    console.log("\n🔗 Explorer Links:");
    console.log("-------------------");
    console.log("IdentityRegistry:   ", `https://monad-testnet.socialscan.io/address/${identityAddress}`);
    console.log("ReputationRegistry: ", `https://monad-testnet.socialscan.io/address/${reputationAddress}`);
    console.log("ValidationRegistry: ", `https://monad-testnet.socialscan.io/address/${validationAddress}`);

    console.log("\n📝 Add these to your .env.local:");
    console.log("----------------------------");
    console.log(`NEXT_PUBLIC_IDENTITY_REGISTRY=${identityAddress}`);
    console.log(`NEXT_PUBLIC_REPUTATION_REGISTRY=${reputationAddress}`);
    console.log(`NEXT_PUBLIC_VALIDATION_REGISTRY=${validationAddress}`);

    console.log("\n💾 Deployment info saved to: deployment-monad-testnet.json");
    console.log("\n" + "=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        process.exit(1);
    });
