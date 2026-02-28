/**
 * Deploy vaults for remaining agents via the new factory
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const RPC = "https://testnet-rpc.monad.xyz";
const FACTORY_ADDR = "0x47f9859aeF69e41D9024E3f7714840149336C2Ec";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(pk, provider);

    const factoryArtifact = JSON.parse(
        fs.readFileSync(path.join(__dirname, "../artifacts/contracts/MolfiVaultFactory.sol/MolfiVaultFactory.json"), "utf8")
    );
    const factory = new ethers.Contract(FACTORY_ADDR, factoryArtifact.abi, wallet);

    // Deploy for agents 0 and 2
    const agents = [
        { id: 0, name: "ClawAlpha-01" },
        { id: 2, name: "NexusPrime" },
    ];

    for (const agent of agents) {
        console.log(`\n📦 Deploying vault for Agent #${agent.id} (${agent.name})...`);

        const tx = await factory.deployVault(agent.id, `MolFi ${agent.name} Vault`, `mVault-${agent.id}`);
        const receipt = await tx.wait();

        let vaultAddr = null;
        for (const log of receipt.logs) {
            try {
                const parsed = factory.interface.parseLog({ topics: log.topics, data: log.data });
                if (parsed && parsed.name === "VaultDeployed") {
                    vaultAddr = parsed.args.vaultAddress;
                    break;
                }
            } catch { }
        }

        if (vaultAddr) {
            console.log(`✅ Vault deployed: ${vaultAddr}`);

            // Update Supabase
            const { error } = await supabase
                .from("AIAgent")
                .update({ vaultAddress: vaultAddr })
                .eq("agentId", agent.id);

            if (error) {
                console.log(`⚠️ Supabase update failed: ${error.message}`);
            } else {
                console.log(`✅ Supabase updated for Agent #${agent.id}`);
            }
        } else {
            console.log("⚠️ Could not parse vault address from event");
        }
    }

    console.log("\n✅ All agents updated!");
}

main().catch(err => {
    console.error("❌ Error:", err.message);
});
