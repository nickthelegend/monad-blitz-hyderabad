/**
 * Redeploy vault infrastructure with new mUSD.dev token
 * 
 * This script:
 * 1. Deploys a new MolfiAgentVault implementation
 * 2. Deploys a new MolfiVaultFactory pointing to mUSD.dev
 * 3. Deploys a vault proxy for agent ID 1
 * 4. Prints all new addresses
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const RPC = "https://testnet-rpc.monad.xyz";
const MUSD_ADDRESS = "0x486bF5FEc77A9A2f1b044B1678eD5B7CECc32A39";

// Existing contracts that stay the same
const IDENTITY_REGISTRY = process.env.NEXT_PUBLIC_IDENTITY_REGISTRY;
const PERP_DEX = process.env.NEXT_PUBLIC_MOLFIPERP_DEX;

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY not set");

    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(pk, provider);

    console.log("Deployer:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "MON");
    console.log("");

    // --- 1. Deploy MolfiAgentVault implementation ---
    console.log("📦 [1/3] Deploying MolfiAgentVault implementation...");
    const vaultArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MolfiAgentVault.sol/MolfiAgentVault.json"), "utf8")
    );
    const vaultFactory = new ethers.ContractFactory(vaultArtifact.abi, vaultArtifact.bytecode, wallet);
    const vaultImpl = await vaultFactory.deploy();
    await vaultImpl.waitForDeployment();
    const vaultImplAddr = await vaultImpl.getAddress();
    console.log("✅ MolfiAgentVault implementation:", vaultImplAddr);
    console.log("");

    // --- 2. Deploy MolfiVaultFactory ---
    console.log("📦 [2/3] Deploying MolfiVaultFactory...");
    console.log("   Identity Registry:", IDENTITY_REGISTRY);
    console.log("   PerpDEX:", PERP_DEX);
    console.log("   mUSD.dev:", MUSD_ADDRESS);

    const factoryArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MolfiVaultFactory.sol/MolfiVaultFactory.json"), "utf8")
    );
    const ff = new ethers.ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, wallet);
    const factory = await ff.deploy(vaultImplAddr, IDENTITY_REGISTRY, PERP_DEX, MUSD_ADDRESS);
    await factory.waitForDeployment();
    const factoryAddr = await factory.getAddress();
    console.log("✅ MolfiVaultFactory:", factoryAddr);
    console.log("");

    // --- 3. Deploy a vault for Agent #1 ---
    console.log("📦 [3/3] Deploying vault for Agent #1 via factory...");
    const factoryContract = new ethers.Contract(factoryAddr, factoryArtifact.abi, wallet);
    const tx = await factoryContract.deployVault(1, "MolFi Agent #1 Vault", "mVault-1");
    const receipt = await tx.wait();

    // Parse VaultDeployed event
    let vaultProxyAddr = null;
    for (const log of receipt.logs) {
        try {
            const parsed = factoryContract.interface.parseLog({ topics: log.topics, data: log.data });
            if (parsed && parsed.name === "VaultDeployed") {
                vaultProxyAddr = parsed.args.vaultAddress;
                break;
            }
        } catch { }
    }

    if (!vaultProxyAddr) {
        console.log("⚠️ Could not parse VaultDeployed event, checking tx logs...");
        console.log("   Tx hash:", receipt.hash);
    } else {
        console.log("✅ Agent #1 Vault (proxy):", vaultProxyAddr);
    }

    // --- Verify the vault's asset ---
    if (vaultProxyAddr) {
        const verifyContract = new ethers.Contract(vaultProxyAddr, ["function asset() view returns (address)"], provider);
        const asset = await verifyContract.asset();
        console.log("");
        console.log("🔍 Vault asset():", asset);
        console.log("   Expected mUSD.dev:", MUSD_ADDRESS);
        console.log("   Match:", asset.toLowerCase() === MUSD_ADDRESS.toLowerCase() ? "✅ YES" : "❌ NO");
    }

    // --- Summary ---
    console.log("\n" + "=".repeat(60));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`NEXT_PUBLIC_VAULT_FACTORY=${factoryAddr}`);
    if (vaultProxyAddr) {
        console.log(`Agent #1 Vault Address=${vaultProxyAddr}`);
    }
    console.log(`Vault Implementation=${vaultImplAddr}`);
    console.log("=".repeat(60));
    console.log("\n⚠️  Update .env.local with the new NEXT_PUBLIC_VAULT_FACTORY");
    if (vaultProxyAddr) {
        console.log("⚠️  Update the agent's vaultAddress in Supabase to:", vaultProxyAddr);
    }
}

main().catch(err => {
    console.error("❌ Deployment failed:", err.message);
    process.exit(1);
});
