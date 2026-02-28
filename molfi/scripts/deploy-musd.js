const hre = require("hardhat");

async function main() {
    console.log("Deploying mUSD.dev token...");

    const signers = await hre.ethers.getSigners();
    console.log("Signers found:", signers.length);
    if (signers.length > 0) {
        console.log("Deployer address:", signers[0].address);
    } else {
        console.log("No signers found. Check hardhat.config.ts");
        return;
    }
    const deployer = signers[0];

    const MUSDDev = await hre.ethers.getContractFactory("MUSDDev", deployer);
    const musd = await MUSDDev.deploy();

    await musd.waitForDeployment();

    const address = await musd.getAddress();
    console.log("mUSD.dev deployed to:", address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
