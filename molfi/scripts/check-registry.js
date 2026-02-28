const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
    const identityAddress = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || "0xB159E0c8093081712c92e274DbFEa5A97A80cA30";
    console.log("🔍 Checking Registry at:", identityAddress);

    const code = await hre.ethers.provider.getCode(identityAddress);
    if (code === "0x") {
        console.error("❌ NO CONTRACT DETECTED at this address. Check your .env.local or deployment.");
        return;
    }

    const IdentityRegistry = await hre.ethers.getContractAt("IdentityRegistryUpgradeable", identityAddress);

    // Check first 5 IDs
    for (let i = 0; i < 5; i++) {
        try {
            // ownerOf is standard ERC721
            const owner = await IdentityRegistry.ownerOf(i).catch(() => null);
            if (!owner) {
                console.log(`Agent #${i}: Not Registered`);
                continue;
            }

            const vault = await IdentityRegistry.getAgentVault(i).catch(() => "N/A");
            const wallet = await IdentityRegistry.getAgentWallet(i).catch(() => "N/A");
            const uri = await IdentityRegistry.tokenURI(i).catch(() => "N/A");

            console.log(`✅ Agent #${i} Found!`);
            console.log(`   Owner:  ${owner}`);
            console.log(`   Vault:  ${vault}`);
            console.log(`   Wallet: ${wallet}`);
            console.log(`   URI:    ${uri}`);
            console.log("-----------------------------------------");
        } catch (err) {
            console.log(`Agent #${i}: Error - ${err.message}`);
        }
    }
}

main().catch((error) => {
    console.error("FATAL:", error);
    process.exit(1);
});
