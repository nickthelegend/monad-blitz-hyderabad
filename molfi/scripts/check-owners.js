
const hre = require("hardhat");

async function main() {
    const vaults = [
        "0x88CD78e98b11D70bABD6eb737E9e5Aa9011cC1f0",
        "0x5A2Cd917Aec4d8d94e89CAcD5790941BC22253Ea",
        "0x623a662c25Ed33C7e575DB726041dC3834b337A9"
    ];

    for (const v of vaults) {
        try {
            const vault = await hre.ethers.getContractAt("MolfiAgentVault", v);
            const owner = await vault.owner();
            console.log(`Vault ${v} owner: ${owner}`);
        } catch (e) {
            console.log(`Vault ${v} error: ${e.message}`);
        }
    }
}

main();
