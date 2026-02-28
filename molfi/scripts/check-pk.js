import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) {
        console.error("No private key found");
        return;
    }
    const provider = new ethers.JsonRpcProvider("https://monad-testnet.api.onfinality.io/public");
    const wallet = new ethers.Wallet(pk, provider);
    console.log("Wallet address:", wallet.address);
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log("Balance:", ethers.formatEther(balance), "MON");
    } catch (e) {
        console.error("Error fetching balance:", e.message);
    }
}
main();
