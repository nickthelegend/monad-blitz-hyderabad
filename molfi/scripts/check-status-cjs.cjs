const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    console.log("PK length:", pk ? pk.length : "undefined");
    if (!pk) return;

    const rpc = "https://testnet-rpc.monad.xyz";
    const provider = new ethers.JsonRpcProvider(rpc);

    try {
        const wallet = new ethers.Wallet(pk, provider);
        console.log("Wallet address:", wallet.address);
        const balance = await provider.getBalance(wallet.address);
        console.log("Balance:", ethers.formatEther(balance), "MON");
    } catch (e) {
        console.error("Error:", e.message);
    }
}
main();
