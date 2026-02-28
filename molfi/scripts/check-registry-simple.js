const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const identityAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "0xB159E0c8093081712c92e274DbFEa5A97A80cA30";
    console.log("🔍 Querying Identity Registry at:", identityAddress);

    const code = await hre.ethers.provider.getCode(identityAddress);
    if (code === "0x") {
        console.log("❌ NO CODE AT THIS ADDRESS.");
        return;
    }

    const IdentityRegistry = await hre.ethers.getContractAt("IdentityRegistryUpgradeable", identityAddress);

    let output = "--- Registered Agents ---\n";
    let found = 0;

    // Brute force check up to 10
    for (let i = 0; i < 10; i++) {
        try {
            const owner = await IdentityRegistry.ownerOf(i);
            const vault = await IdentityRegistry.getAgentVault(i).catch(() => "0x0");
            const wallet = await IdentityRegistry.getAgentWallet(i).catch(() => "0x0");

            output += `Agent #${i}:\n`;
            output += `  Owner:  ${owner}\n`;
            output += `  Vault:  ${vault}\n`;
            output += `  Wallet: ${wallet}\n`;
            output += "-----------------------\n";
            found++;
        } catch (e) {
            // Revert usually means not minted
        }
    }

    if (found === 0) {
        output += "No agents found in first 10 IDs.\n";
    }

    console.log(output);
}

main().catch(console.error);
