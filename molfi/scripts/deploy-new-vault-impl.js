
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("Upgrading MolfiAgentVault implementation...");

    // This script assumes you have a deployment-monad-testnet.json with the vault factory address
    // OR we can just deploy a new implementation and let the factory use it.

    const MolfiAgentVault = await ethers.getContractFactory("MolfiAgentVault");

    // Deploying new implementation
    const vaultImpl = await MolfiAgentVault.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddress = await vaultImpl.getAddress();

    console.log(`New Vault Implementation deployed at: ${vaultImplAddress}`);
    console.log("You can now upgrade your existing proxies to this implementation.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
