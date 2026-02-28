const { ethers } = require("ethers");
require("dotenv").config({ path: ".env.local" });

const rpcUrl = "https://testnet-rpc.monad.xyz";
const provider = new ethers.JsonRpcProvider(rpcUrl);

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    const wallet = new ethers.Wallet(pk, provider);

    const usdcAddress = process.env.NEXT_PUBLIC_USDC;
    // We'll use ClawAlpha-01's vault
    const vaultAddress = "0x0DFcF75F9F11b158E6CAc4E1f7C580A4F2612DBf";

    console.log("💰 FUNDING DEMO - ERC4626 FLOW");
    console.log("Usdc:", usdcAddress);
    console.log("Vault (ClawAlpha-01):", vaultAddress);

    const usdc = new ethers.Contract(usdcAddress, [
        "function approve(address, uint256) returns (bool)",
        "function balanceOf(address) view returns (uint256)",
        "function mint(address, uint256)"
    ], wallet);

    const vault = new ethers.Contract(vaultAddress, [
        "function deposit(uint256, address) returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function convertToAssets(uint256) view returns (uint256)",
        "function totalSupply() view returns (uint256)"
    ], wallet);

    // 1. Give ourselves 1000 USDC if needed
    console.log("\n1. Minting 1000 Test USDC...");
    const amount = ethers.parseEther("1000");
    await (await usdc.mint(wallet.address, amount)).wait();
    console.log("✅ USDC Balance:", ethers.formatEther(await usdc.balanceOf(wallet.address)));

    // 2. Approve Vault
    console.log("\n2. Approving Vault to spend USDC...");
    await (await usdc.approve(vaultAddress, amount)).wait();
    console.log("✅ Approved.");

    // 3. Deposit into Vault
    console.log("\n3. Depositing 500 USDC into ClawAlpha-01...");
    const depositAmount = ethers.parseEther("500");
    const depositTx = await vault.deposit(depositAmount, wallet.address);
    await depositTx.wait();
    console.log("✅ Deposit complete.");

    // 4. Verify Shares
    const shares = await vault.balanceOf(wallet.address);
    const assets = await vault.convertToAssets(shares);
    console.log("\n📊 VAULT SHARES HELD:");
    console.log(`Shares: ${ethers.formatEther(shares)} CLAW`);
    console.log(`Equivalent Assets (NAV): ${ethers.formatEther(assets)} USDC`);
    console.log("-----------------------------------------");
    console.log("The ERC4626 implementation ensures that asClawAlpha-01 makes profit,");
    console.log("the value of your shares increases automatically.");
}

main().catch(console.error);
