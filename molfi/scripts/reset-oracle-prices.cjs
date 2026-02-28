/**
 * Reset oracle prices one-at-a-time (avoids batch gas issues)
 *
 * Usage: node scripts/reset-oracle-prices.cjs
 */
const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");

const RPC = "https://testnet-rpc.monad.xyz";
const BINANCE_MAP = { 'BTCUSDT': 'BTC/USD', 'ETHUSDT': 'ETH/USD', 'LINKUSDT': 'LINK/USD' };

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const oracleAddr = process.env.NEXT_PUBLIC_MOLFI_ORACLE;

    const artifactPath = path.join(__dirname, "../artifacts/contracts/oracles/MolfiOracle.sol/MolfiOracle.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const oracle = new ethers.Contract(oracleAddr, artifact.abi, wallet);

    console.log("Oracle:", oracleAddr);
    console.log("Wallet:", wallet.address);

    // Check current max deviation
    const currentDev = await oracle.maxDeviation();
    console.log("Current maxDeviation:", currentDev.toString(), "bps");
    console.log("");

    // 1. Set max deviation to 50%
    console.log("Setting max deviation to 50%...");
    const tx1 = await oracle.setMaxDeviation(5000, { gasLimit: 200000 });
    await tx1.wait();
    console.log("  ✅ Done\n");

    // 2. Fetch Binance prices
    console.log("Fetching Binance prices...");
    const symbols = Object.keys(BINANCE_MAP);
    const url = `https://api.binance.com/api/v3/ticker/price?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
    const res = await fetch(url);
    const data = await res.json();

    const priceMap = {};
    for (const item of data) {
        const pair = BINANCE_MAP[item.symbol];
        if (pair) {
            priceMap[pair] = parseFloat(item.price);
            console.log(`  ${pair}: $${item.price}`);
        }
    }
    console.log("");

    // 3. Update one at a time
    for (const [pair, price] of Object.entries(priceMap)) {
        console.log(`Updating ${pair} → $${price}...`);
        try {
            const priceWei = ethers.parseUnits(price.toFixed(8), 18);
            const tx = await oracle.updatePrice(pair, priceWei, { gasLimit: 300000 });
            console.log(`  Tx: ${tx.hash}`);
            const receipt = await tx.wait();
            console.log(`  ✅ Gas: ${receipt.gasUsed.toString()} | Status: ${receipt.status}`);
        } catch (err) {
            console.log(`  ❌ Failed: ${err.message.substring(0, 150)}`);

            // If deviation error, try with static encoding
            if (err.message.includes('deviation') || err.message.includes('reverted')) {
                console.log("  Attempting raw transaction...");
                try {
                    const iface = new ethers.Interface(artifact.abi);
                    const calldata = iface.encodeFunctionData("updatePrice", [pair, ethers.parseUnits(price.toFixed(8), 18)]);
                    console.log("  Calldata length:", calldata.length);

                    const rawTx = {
                        to: oracleAddr,
                        data: calldata,
                        gasLimit: 500000,
                    };
                    const tx = await wallet.sendTransaction(rawTx);
                    const receipt = await tx.wait();
                    console.log(`  ✅ Raw tx success! Gas: ${receipt.gasUsed}, Status: ${receipt.status}`);
                } catch (e2) {
                    console.log(`  ❌ Raw tx also failed: ${e2.message.substring(0, 150)}`);
                }
            }
        }
    }

    // 4. Restore deviation to 10%
    console.log("\nSetting max deviation back to 10%...");
    const tx3 = await oracle.setMaxDeviation(1000, { gasLimit: 200000 });
    await tx3.wait();
    console.log("  ✅ Done\n");

    // 5. Final state
    console.log("=== Final Prices ===");
    try {
        const [pairs, prices, timestamps] = await oracle.getAllPrices();
        for (let i = 0; i < pairs.length; i++) {
            console.log(`  ${pairs[i]}: $${ethers.formatUnits(prices[i], 18)}`);
        }
    } catch (e) {
        // Fallback: read one by one
        for (const pair of Object.keys(priceMap)) {
            try {
                const [p, t, s] = await oracle.getPriceUnsafe(pair);
                console.log(`  ${pair}: $${ethers.formatUnits(p, 18)} (stale: ${s})`);
            } catch (e2) {
                console.log(`  ${pair}: ❌ ${e2.message.substring(0, 80)}`);
            }
        }
    }

    console.log("\n✅ Done. Now run: node scripts/oracle-bot.cjs");
}

main().catch(console.error);
