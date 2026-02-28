import { ethers, upgrades } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 MOLFI GENESIS DEPLOYMENT: PROTOCOL + DEX + ORACLE");
    console.log("=".repeat(70) + "\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "MON\n");

    // 1. Deploy IdentityRegistry (Core)
    console.log("📝 Deploying IdentityRegistry...");
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistryUpgradeable");
    const identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
        initializer: "initialize",
    });
    await identityRegistry.waitForDeployment();
    const identityAddress = await identityRegistry.getAddress();
    console.log("✅ IdentityRegistry:", identityAddress);

    // 2. Deploy ReputationRegistry
    console.log("\n📊 Deploying ReputationRegistry...");
    const ReputationRegistry = await ethers.getContractFactory("ReputationRegistryUpgradeable");
    const reputationRegistry = await upgrades.deployProxy(
        ReputationRegistry,
        [identityAddress],
        { initializer: "initialize" }
    );
    await reputationRegistry.waitForDeployment();
    const reputationAddress = await reputationRegistry.getAddress();
    console.log("✅ ReputationRegistry:", reputationAddress);

    // 3. Deploy ChainlinkOracle
    console.log("\n📡 Deploying ChainlinkOracle...");
    const ChainlinkOracle = await ethers.getContractFactory("ChainlinkOracle");
    const oracle = await ChainlinkOracle.deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("✅ ChainlinkOracle:", oracleAddress);

    // 4. Configure Price Feeds for Monad Testnet
    console.log("\n⚙️  Configuring Price Feeds...");
    const BTC_USD_FEED = "0x2Cd9D7E85494F68F5aF08EF96d6FD5e8F71B4d31";
    const ETH_USD_FEED = "0x0c76859E85727683Eeba0C70Bc2e0F5781337818";

    await oracle.setPriceFeed("BTC/USDT", BTC_USD_FEED);
    await oracle.setPriceFeed("ETH/USDT", ETH_USD_FEED);
    console.log("✅ BTC/USDT and ETH/USDT feeds configured.");

    // 5. Deploy MolfiPerpDEX
    console.log("\n💱 Deploying MolfiPerpDEX...");
    const MolfiPerpDEX = await ethers.getContractFactory("MolfiPerpDEX");
    const perpDex = await MolfiPerpDEX.deploy(oracleAddress, "0x486bF5FEc77A9A2f1b044B1678eD5B7CECc32A39");
    await perpDex.waitForDeployment();
    const perpDexAddress = await perpDex.getAddress();
    console.log("✅ MolfiPerpDEX:", perpDexAddress);

    // Save Deployment Data
    const deploymentData = {
        network: "monadTestnet",
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            identityRegistry: identityAddress,
            reputationRegistry: reputationAddress,
            chainlinkOracle: oracleAddress,
            molfiPerpDex: perpDexAddress
        }
    };

    fs.writeFileSync("deployment-monad-testnet.json", JSON.stringify(deploymentData, null, 2));

    // Create src/lib/contracts/addresses.json for frontend
    const webData = {
        10143: {
            identityRegistry: identityAddress,
            reputationRegistry: reputationAddress,
            chainlinkOracle: oracleAddress,
            perpDex: perpDexAddress
        }
    };

    if (!fs.existsSync("src/lib/contracts")) {
        fs.mkdirSync("src/lib/contracts", { recursive: true });
    }
    fs.writeFileSync("src/lib/contracts/addresses.json", JSON.stringify(webData, null, 2));

    console.log("\n" + "=".repeat(70));
    console.log("🎉 GENESIS DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70) + "\n");
}

main().catch(console.error);
