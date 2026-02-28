const { ethers } = require("ethers");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const rpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC || "https://rpc-testnet.monadinfra.com";
const provider = new ethers.JsonRpcProvider(rpcUrl);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PINATA_JWT = process.env.PINATA_JWT;

async function uploadToIPFS(metadata) {
    console.log(`📤 Uploading metadata for ${metadata.name} to Pinata...`);
    try {
        const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            pinataContent: metadata,
            pinataMetadata: {
                name: `molfi-agent-${metadata.name.toLowerCase()}.json`
            }
        }, {
            headers: {
                'Authorization': `Bearer ${PINATA_JWT}`,
                'Content-Type': 'application/json'
            }
        });
        const url = `ipfs://${res.data.IpfsHash}`;
        console.log(`✅ Uploaded: ${url}`);
        return url;
    } catch (err) {
        console.error("❌ Pinata Upload Error:", err.response?.data || err.message);
        return `ipfs://fallback-${Date.now()}`;
    }
}

async function deployContract(name, artifactPath, wallet, args = []) {
    console.log(`📡 Deploying ${name}...`);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`✅ ${name} at: ${address}`);
    return { contract, address, abi: artifact.abi, artifact };
}

async function main() {
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    const wallet = new ethers.Wallet(pk, provider);
    console.log("🚀 STARTING GENESIS v2 (PINATA + SUPABASE)");
    console.log("Deployer:", wallet.address);

    const contractsDir = './artifacts/contracts';

    // 1. Core Contracts
    const { address: usdcAddress } = await deployContract("MockUSDC", path.join(contractsDir, 'MockUSDC.sol/MockUSDC.json'), wallet);

    // Identity Registry Proxy
    const { address: regImplAddress, artifact: regArtifact } = await deployContract("IdentityRegistry Impl", path.join(contractsDir, 'IdentityRegistryUpgradeable.sol/IdentityRegistryUpgradeable.json'), wallet);
    const regInterface = new ethers.Interface(regArtifact.abi);
    const { address: regProxyAddress } = await deployContract("IdentityRegistry Proxy", path.join(contractsDir, 'ERC1967Proxy.sol/ERC1967Proxy.json'), wallet, [regImplAddress, regInterface.encodeFunctionData("initialize", [])]);
    const registry = new ethers.Contract(regProxyAddress, regArtifact.abi, wallet);

    // Oracle & DEX
    const { contract: oracle, address: oracleAddress } = await deployContract("ChainlinkOracle", path.join(contractsDir, 'oracles/ChainlinkOracle.sol/ChainlinkOracle.json'), wallet);
    await (await oracle.setPriceFeed("BTC/USDT", "0x0c76859E85727683Eeba0C70Bc2e0F5781337818")).wait();
    await (await oracle.setPriceFeed("ETH/USDT", "0x0c76859E85727683Eeba0C70Bc2e0F5781337818")).wait();

    const { address: dexAddress } = await deployContract("MolfiPerpDEX", path.join(contractsDir, 'dex/MolfiPerpDEX.sol/MolfiPerpDEX.json'), wallet, [oracleAddress, usdcAddress]);

    // Vaults
    const { address: vaultImplAddress } = await deployContract("Vault Impl", path.join(contractsDir, 'MolfiAgentVault.sol/MolfiAgentVault.json'), wallet);
    const { address: factoryAddress, contract: factory } = await deployContract("Vault Factory", path.join(contractsDir, 'MolfiVaultFactory.sol/MolfiVaultFactory.json'), wallet, [vaultImplAddress, regProxyAddress, dexAddress, usdcAddress]);

    const agentsData = [
        { name: "ClawAlpha-01", personality: "Aggressive", strategy: "High-Frequency Momentum", bio: "Optimized for parallel execution on Monad." },
        { name: "AetherGuardian", personality: "Conservative", strategy: "Delta-Neutral Arbitrage", bio: "Protecting capital with multi-shard risk analysis." },
        { name: "NexusPrime", personality: "Balanced", strategy: "Cross-Asset Liquidity Provision", bio: "The primary liquidity hub for the Molfi Network." }
    ];

    console.log("\n🧹 Cleaning Supabase AIAgent Table...");
    await supabase.from('TradeSignal').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('AIAgent').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log("\n🤖 Provisioning Agents...");
    for (let i = 0; i < agentsData.length; i++) {
        const agent = agentsData[i];

        // 1. Create Metadata & Upload to Pinata
        const metadata = {
            name: agent.name,
            description: agent.bio,
            image: `https://api.dicebear.com/7.x/bottts/svg?seed=${agent.name}`,
            attributes: [
                { trait_type: "Personality", value: agent.personality },
                { trait_type: "Strategy", value: agent.strategy },
                { trait_type: "Version", value: "2.0" }
            ]
        };
        const ipfsUri = await uploadToIPFS(metadata);

        // 2. Register On-Chain
        const regTx = await registry.getFunction("register(string)")(ipfsUri);
        const regReceipt = await regTx.wait();
        const registeredEvent = regReceipt.logs.find(log => log.topics[0] === registry.interface.getEvent("Registered").topicHash);
        const decoded = registry.interface.decodeEventLog("Registered", registeredEvent.data, registeredEvent.topics);
        const agentId = Number(decoded.agentId);

        // 3. Deploy Vault
        const deployTx = await factory.deployVault(agentId, agent.name, agent.name.substring(0, 4).toUpperCase());
        const deployReceipt = await deployTx.wait();
        const vaultEvent = deployReceipt.logs.find(log => log.topics[0] === factory.interface.getEvent("VaultDeployed").topicHash);
        const vaultAddress = factory.interface.decodeEventLog("VaultDeployed", vaultEvent.data, vaultEvent.topics).vaultAddress;

        // 4. Link & Activate
        await (await registry.setAgentVault(agentId, vaultAddress)).wait();

        // 5. Seed Supabase
        console.log(`💾 Seeding ${agent.name} to Supabase...`);
        const { error } = await supabase.from('AIAgent').insert({
            agentId: agentId,
            name: agent.name,
            personality: agent.personality,
            ownerAddress: wallet.address,
            vaultAddress: vaultAddress
        });
        if (error) console.error(`❌ DB Error for ${agent.name}:`, error.message);
        else console.log(`✅ ${agent.name} fully live.`);
    }

    // Update .env.local 
    let env = fs.readFileSync('.env.local', 'utf8');
    const updates = { 'NEXT_PUBLIC_IDENTITY_REGISTRY': regProxyAddress, 'NEXT_PUBLIC_MOLFIPERP_DEX': dexAddress, 'NEXT_PUBLIC_USDC': usdcAddress, 'NEXT_PUBLIC_VAULT_FACTORY': factoryAddress };
    for (const [k, v] of Object.entries(updates)) {
        env = env.replace(new RegExp(`${k}=.*`), `${k}=${v}`);
    }
    fs.writeFileSync('.env.local', env);

    console.log("\n" + "=".repeat(60));
    console.log("🌌 GENESIS v2 COMPLETE — THE NETWORK IS ALIVE");
    console.log("=".repeat(60));
}

main().catch(console.error);
