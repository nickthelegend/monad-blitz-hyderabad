const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    const rpc = "https://testnet-rpc.monad.xyz";
    const provider = new ethers.JsonRpcProvider(rpc);
    const wallet = new ethers.Wallet(pk, provider);

    console.log("Deploying with address:", wallet.address);

    // Read artifact
    const artifactPath = path.join(__dirname, "../artifacts/contracts/MUSDDev.sol/MUSDDev.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy();

    console.log("Transaction hash:", contract.deploymentTransaction().hash);
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log("mUSD.dev deployed to:", address);
}

main().catch(console.error);
