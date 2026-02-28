
const fs = require('fs');
const path = require('path');

const abiPath = path.join(__dirname, '../src/abis/MolfiAgentVault.json');
const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const adminPayoutProfit = {
    "inputs": [
        { "internalType": "address", "name": "user", "type": "address" },
        { "internalType": "uint256", "name": "sharesToBurn", "type": "uint256" },
        { "internalType": "uint256", "name": "profitAmount", "type": "uint256" }
    ],
    "name": "adminPayoutProfit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
};

// Check if already exists
if (!abi.find(x => x.name === 'adminPayoutProfit')) {
    abi.push(adminPayoutProfit);
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    console.log("✅ ABI updated successfully!");
} else {
    console.log("ℹ️ adminPayoutProfit already exists in ABI.");
}
