const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

const fs = require('fs');

async function main() {
    const rpc = "https://testnet-rpc.monad.xyz";
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) throw new Error("No private key");

    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);
    console.log("Wallet:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "MON");

    // Load Artifacts
    const artifact = JSON.parse(fs.readFileSync('./artifacts/contracts/IdentityRegistryUpgradeable.sol/IdentityRegistryUpgradeable.json', 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log("Deploying Registry...");
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const addr = await contract.getAddress();
    console.log("✅ Registry:", addr);

    // Initialize
    console.log("Initializing...");
    const initTx = await contract.initialize();
    await initTx.wait();
    console.log("✅ Initialized.");

    // Update .env.local
    console.log("Updating .env.local...");
    let env = fs.readFileSync('.env.local', 'utf8');
    env = env.replace(/NEXT_PUBLIC_IDENTITY_REGISTRY=.*/, `NEXT_PUBLIC_IDENTITY_REGISTRY=${addr}`);
    fs.writeFileSync('.env.local', env);
    console.log("✅ .env.local updated.");
}

main().catch(console.error);
