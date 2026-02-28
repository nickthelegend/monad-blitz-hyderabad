const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "MON");

    // 1. Identity Registry
    console.log("\n📦 Deploying IdentityRegistry...");
    const IdentityRegistry = await hre.ethers.getContractFactory("IdentityRegistryUpgradeable");
    const registry = await hre.ethers.deployContract("IdentityRegistryUpgradeable");
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ IdentityRegistry:", registryAddress);

    // Initialize (it's UUPS)
    // Actually, hre.ethers.deployContract just deploys the implementation if it's not handled by a proxy plugin
    // But IdentityRegistryUpgradeable has an initialize() function.
    // I should use the proxy or just initialize the implementation for testing if I want to be cheap.
    // Better: deploy a regular version if I'm tight on MON.
}

main().catch(console.error);
