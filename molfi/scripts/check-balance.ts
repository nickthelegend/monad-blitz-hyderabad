import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);

    console.log("=".repeat(60));
    console.log("DEPLOYER WALLET INFO");
    console.log("=".repeat(60));
    console.log("Address:", deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH/MON");
    console.log("=".repeat(60));

    if (balance === 0n) {
        console.log("\n⚠️  WARNING: Balance is 0!");
        console.log("Please fund this address before deploying contracts.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
