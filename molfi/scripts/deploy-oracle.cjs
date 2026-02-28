/**
 * Deploy MolfiOracle to Monad Testnet
 * Uses raw ethers.js + compiled artifact (no Hardhat runtime)
 *
 * Prerequisites:
 *   npx hardhat compile
 *
 * Usage:
 *   node scripts/deploy-oracle.cjs
 */
const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");

const RPC = "https://testnet-rpc.monad.xyz";

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) {
        console.error("❌ DEPLOYER_PRIVATE_KEY not set in .env.local");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(pk, provider);

    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║         MolfiOracle Deployment                   ║");
    console.log("╚══════════════════════════════════════════════════╝");
    console.log("");
    console.log("  Deployer:", wallet.address);

    const balance = await provider.getBalance(wallet.address);
    console.log("  Balance: ", ethers.formatEther(balance), "MON");

    if (balance === 0n) {
        console.error("❌ No MON balance! Get testnet MON from the faucet first.");
        process.exit(1);
    }
    console.log("");

    // ── Load compiled artifact ───────────────────────────────────────
    const artifactPath = path.join(
        __dirname,
        "../artifacts/contracts/oracles/MolfiOracle.sol/MolfiOracle.json"
    );

    if (!fs.existsSync(artifactPath)) {
        console.error("❌ Artifact not found. Run `npx hardhat compile` first.");
        process.exit(1);
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    console.log("  Artifact loaded ✓");
    console.log("  Bytecode size:", Math.floor(artifact.bytecode.length / 2), "bytes");
    console.log("");

    // ── Deploy ───────────────────────────────────────────────────────
    console.log("Step 1: Deploying MolfiOracle contract...");

    try {
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

        // Estimate gas first
        const deployTx = await factory.getDeployTransaction();
        const gasEstimate = await provider.estimateGas({ ...deployTx, from: wallet.address });
        console.log("  Gas estimate:", gasEstimate.toString());

        const contract = await factory.deploy({
            gasLimit: gasEstimate * 120n / 100n, // 20% buffer
        });

        console.log("  Tx hash:", contract.deploymentTransaction().hash);
        console.log("  Waiting for confirmation...");

        await contract.waitForDeployment();
        const oracleAddr = await contract.getAddress();
        console.log("  ✅ Deployed at:", oracleAddr);
        console.log("");

        // ── Seed initial prices ──────────────────────────────────────
        console.log("Step 2: Seeding initial prices...");

        const oracle = new ethers.Contract(oracleAddr, artifact.abi, wallet);

        const pairs = ["BTC/USD", "ETH/USD", "LINK/USD"];
        const seedPrices = [
            ethers.parseUnits("97000", 18),
            ethers.parseUnits("2700", 18),
            ethers.parseUnits("18", 18),
        ];

        const tx = await oracle.updatePrices(pairs, seedPrices, { gasLimit: 500000 });
        console.log("  Tx hash:", tx.hash);
        await tx.wait();
        console.log("  ✅ Prices seeded");
        console.log("");

        // ── Verify ───────────────────────────────────────────────────
        console.log("Step 3: Verifying prices...");
        for (const pair of pairs) {
            const [price, updatedAt, isStale] = await oracle.getPriceUnsafe(pair);
            console.log(`  ${pair}: $${ethers.formatUnits(price, 18)} (stale: ${isStale})`);
        }

        // ── Summary ──────────────────────────────────────────────────
        console.log("");
        console.log("══════════════════════════════════════════════════");
        console.log("✅ DEPLOYMENT COMPLETE");
        console.log("");
        console.log("Add this to your .env.local:");
        console.log(`NEXT_PUBLIC_MOLFI_ORACLE=${oracleAddr}`);
        console.log("");
        console.log("Then start the oracle bot:");
        console.log("  node scripts/oracle-bot.cjs");
        console.log("══════════════════════════════════════════════════");

    } catch (err) {
        console.error("");
        console.error("❌ Deployment failed!");
        console.error("  Error:", err.message);

        if (err.message.includes("reverted")) {
            console.error("  → The transaction reverted. This usually means:");
            console.error("    - The contract bytecode is too large");
            console.error("    - Constructor execution failed");
            console.error("    - Insufficient gas");
        }

        if (err.transaction) {
            console.error("  Tx data:", JSON.stringify(err.transaction, null, 2).substring(0, 500));
        }

        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal:", err.message || err);
    process.exit(1);
});
