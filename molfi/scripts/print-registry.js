const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const rpc = process.env.NEXT_PUBLIC_MONAD_RPC || "https://rpc-testnet.monadinfra.com";
    const provider = new ethers.JsonRpcProvider(rpc);
    const registryAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;

    console.log("🔍 Checking Registry at:", registryAddress);

    const abi = [
        "function ownerOf(uint256) view returns (address)",
        "function getAgentVault(uint256) view returns (address)"
    ];

    const contract = new ethers.Contract(registryAddress, abi, provider);

    console.log("\n--- REGISTERED MOLFIS ---");
    for (let i = 0; i < 5; i++) {
        try {
            const owner = await contract.ownerOf(i);
            const vault = await contract.getAgentVault(i);
            console.log(`AGENT #${i}:`);
            console.log(`  Owner: ${owner}`);
            console.log(`  Vault: ${vault}`);
            console.log("-----------------------------------------");
        } catch (e) {
            // Not found
        }
    }
}

main().catch(console.error);
