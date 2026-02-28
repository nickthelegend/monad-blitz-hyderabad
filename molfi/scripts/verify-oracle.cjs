/**
 * Verify MolfiOracle deployment and seed prices
 * Use this if deploy-oracle.cjs deployed the contract but seeding failed.
 *
 * Usage: node scripts/verify-oracle.cjs <ORACLE_ADDRESS>
 */
const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");

const RPC = "https://testnet-rpc.monad.xyz";

async function main() {
    const oracleAddr = process.argv[2] || process.env.NEXT_PUBLIC_MOLFI_ORACLE;

    if (!oracleAddr) {
        console.error("Usage: node scripts/verify-oracle.cjs <ORACLE_ADDRESS>");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC);
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    const wallet = new ethers.Wallet(pk, provider);

    console.log("Verifying MolfiOracle at:", oracleAddr);
    console.log("Caller:", wallet.address);
    console.log("");

    // Check if code exists
    const code = await provider.getCode(oracleAddr);
    if (code === "0x") {
        console.error("❌ No contract at this address!");
        process.exit(1);
    }
    console.log("✅ Contract exists (code size:", (code.length - 2) / 2, "bytes)");

    // Load ABI
    const artifactPath = path.join(
        __dirname,
        "../artifacts/contracts/oracles/MolfiOracle.sol/MolfiOracle.json"
    );
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const oracle = new ethers.Contract(oracleAddr, artifact.abi, wallet);

    // Check owner
    try {
        const owner = await oracle.owner();
        console.log("Owner:", owner);
        console.log("Is our wallet:", owner.toLowerCase() === wallet.address.toLowerCase() ? "YES ✅" : "NO ❌");
    } catch (e) {
        console.log("❌ owner() call failed:", e.message);
    }

    // Check updater permission
    try {
        const isUpdater = await oracle.updaters(wallet.address);
        console.log("Is updater:", isUpdater ? "YES ✅" : "NO ❌");
    } catch (e) {
        console.log("❌ updaters() call failed:", e.message);
    }

    // Check if any pairs exist
    try {
        const count = await oracle.getSupportedPairsCount();
        console.log("Supported pairs:", count.toString());
    } catch (e) {
        console.log("❌ getSupportedPairsCount() failed:", e.message);
    }

    console.log("");

    // Try to update a single price
    console.log("Testing updatePrice('BTC/USD', $97000)...");
    try {
        const price = ethers.parseUnits("97000", 18);
        const tx = await oracle.updatePrice("BTC/USD", price, { gasLimit: 300000 });
        console.log("  Tx hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("  ✅ Success! Gas used:", receipt.gasUsed.toString());
    } catch (e) {
        console.log("  ❌ Failed:", e.message.substring(0, 200));

        // Try with higher gas
        console.log("\n  Retrying with 1M gas...");
        try {
            const price = ethers.parseUnits("97000", 18);
            const tx = await oracle.updatePrice("BTC/USD", price, { gasLimit: 1000000 });
            console.log("  Tx hash:", tx.hash);
            const receipt = await tx.wait();
            console.log("  ✅ Success with higher gas! Used:", receipt.gasUsed.toString());
        } catch (e2) {
            console.log("  ❌ Still failed:", e2.message.substring(0, 200));
        }
    }

    // Read back
    console.log("\nReading prices from oracle...");
    try {
        const [price, updatedAt, isStale] = await oracle.getPriceUnsafe("BTC/USD");
        console.log("  BTC/USD:", ethers.formatUnits(price, 18), "| stale:", isStale);
    } catch (e) {
        console.log("  ❌ getPriceUnsafe failed:", e.message.substring(0, 150));
    }

    // Try batch update
    console.log("\nTesting batch updatePrices...");
    try {
        const pairs = ["ETH/USD", "LINK/USD"];
        const prices = [
            ethers.parseUnits("2700", 18),
            ethers.parseUnits("18", 18),
        ];
        const tx = await oracle.updatePrices(pairs, prices, { gasLimit: 500000 });
        console.log("  Tx hash:", tx.hash);
        const receipt = await tx.wait();
        console.log("  ✅ Batch update success! Gas:", receipt.gasUsed.toString());
    } catch (e) {
        console.log("  ❌ Batch update failed:", e.message.substring(0, 200));
    }

    // Final state
    console.log("\n=== Final State ===");
    try {
        const [pairs, prices, timestamps] = await oracle.getAllPrices();
        for (let i = 0; i < pairs.length; i++) {
            console.log(`  ${pairs[i]}: $${ethers.formatUnits(prices[i], 18)} (updated: ${new Date(Number(timestamps[i]) * 1000).toISOString()})`);
        }
    } catch (e) {
        console.log("  ❌ getAllPrices() failed:", e.message.substring(0, 150));
    }
}

main().catch(console.error);
