/**
 * Deploy MolfiOracle to Monad Testnet
 *
 * Usage:
 *   npx hardhat run scripts/deploy-oracle.ts --network monadTestnet
 */
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MolfiOracle with:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MON");

    // ── Deploy Oracle ────────────────────────────────────────────────
    const OracleFactory = await ethers.getContractFactory("MolfiOracle");
    const oracle = await OracleFactory.deploy();
    await oracle.waitForDeployment();

    const oracleAddr = await oracle.getAddress();
    console.log("✅ MolfiOracle deployed at:", oracleAddr);

    // ── Seed initial prices so PerpDEX doesn't revert ────────────────
    console.log("\nSeeding initial prices...");

    const pairs = ["BTC/USD", "ETH/USD", "LINK/USD"];
    // Prices in 18 decimals
    const seedPrices = [
        ethers.parseUnits("97000", 18),  // BTC
        ethers.parseUnits("2700", 18),   // ETH
        ethers.parseUnits("18", 18),     // LINK
    ];

    const tx = await oracle.updatePrices(pairs, seedPrices);
    await tx.wait();
    console.log("✅ Seeded prices:", pairs.join(", "));

    // ── Verify prices read back correctly ────────────────────────────
    for (const pair of pairs) {
        const price = await oracle.getLatestPrice(pair);
        console.log(`   ${pair}: $${ethers.formatUnits(price, 18)}`);
    }

    // ── Print env variable to add ────────────────────────────────────
    console.log("\n══════════════════════════════════════════════════");
    console.log("Add this to your .env.local:");
    console.log(`NEXT_PUBLIC_MOLFI_ORACLE=${oracleAddr}`);
    console.log("══════════════════════════════════════════════════");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
