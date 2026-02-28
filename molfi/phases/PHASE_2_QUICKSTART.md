# 🚀 PHASE 2 - QUICK START GUIDE

## Immediate Actions to Begin

### Step 1: Generate Deployment Private Key (5 min)

```bash
cd /Users/jaibajrang/Desktop/Projects/moltiverse/Molfi

# Generate a new private key for deployment
node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
```

**Save this key securely!** Add to `.env.local`:
```bash
DEPLOYER_PRIVATE_KEY=0x... # paste the generated key
```

### Step 2: Install Hardhat Dependencies (10 min)

```bash
npm install --save-dev \
  hardhat \
  @nomicfoundation/hardhat-toolbox \
  @nomicfoundation/hardhat-verify \
  @openzeppelin/contracts-upgradeable \
  @openzeppelin/hardhat-upgrades \
  dotenv
```

### Step 3: Copy ERC-8004 Contracts (5 min)

```bash
# Create contracts directory
mkdir -p contracts

# Copy contracts from erc-8004-contracts
cp ../erc-8004-contracts/contracts/IdentityRegistryUpgradeable.sol contracts/
cp ../erc-8004-contracts/contracts/ReputationRegistryUpgradeable.sol contracts/
cp ../erc-8004-contracts/contracts/ValidationRegistryUpgradeable.sol contracts/
cp ../erc-8004-contracts/contracts/ERC1967Proxy.sol contracts/
cp ../erc-8004-contracts/contracts/MinimalUUPS.sol contracts/
```

### Step 4: Create Hardhat Config (10 min)

Create `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    monadTestnet: {
      url: "https://testnet.monad.xyz",
      chainId: 41454,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: process.env.DEPLOYER_PRIVATE_KEY 
        ? [process.env.DEPLOYER_PRIVATE_KEY] 
        : [],
    },
  },
  etherscan: {
    apiKey: {
      monadTestnet: "no-api-key-needed",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "monadTestnet",
        chainId: 41454,
        urls: {
          apiURL: "https://monad-testnet.socialscan.io/api",
          browserURL: "https://monad-testnet.socialscan.io",
        },
      },
    ],
  },
};

export default config;
```

### Step 5: Get Monad Testnet Tokens (15 min)

1. Get your deployer address:
```bash
# Install ethers if needed
npm install ethers

# Get address from private key
node -e "const ethers = require('ethers'); const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY); console.log('Deployer Address:', wallet.address)"
```

2. Request testnet tokens:
   - Visit Monad testnet faucet (check Monad Discord/docs)
   - Paste your deployer address
   - Wait for tokens to arrive

3. Verify balance:
```bash
npx hardhat run scripts/check-balance.ts --network monadTestnet
```

### Step 6: Create Deployment Scripts (20 min)

Create `scripts/deploy-all.ts`:

```typescript
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("🚀 Deploying ERC-8004 contracts to Monad Testnet...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON\n");

  // Deploy IdentityRegistry
  console.log("📝 Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistryUpgradeable");
  const identityRegistry = await upgrades.deployProxy(IdentityRegistry, [], {
    initializer: "initialize",
  });
  await identityRegistry.waitForDeployment();
  const identityAddress = await identityRegistry.getAddress();
  console.log("✅ IdentityRegistry deployed to:", identityAddress);

  // Deploy ReputationRegistry
  console.log("\n📊 Deploying ReputationRegistry...");
  const ReputationRegistry = await ethers.getContractFactory("ReputationRegistryUpgradeable");
  const reputationRegistry = await upgrades.deployProxy(
    ReputationRegistry,
    [identityAddress],
    { initializer: "initialize" }
  );
  await reputationRegistry.waitForDeployment();
  const reputationAddress = await reputationRegistry.getAddress();
  console.log("✅ ReputationRegistry deployed to:", reputationAddress);

  // Deploy ValidationRegistry
  console.log("\n🔍 Deploying ValidationRegistry...");
  const ValidationRegistry = await ethers.getContractFactory("ValidationRegistryUpgradeable");
  const validationRegistry = await upgrades.deployProxy(
    ValidationRegistry,
    [identityAddress],
    { initializer: "initialize" }
  );
  await validationRegistry.waitForDeployment();
  const validationAddress = await validationRegistry.getAddress();
  console.log("✅ ValidationRegistry deployed to:", validationAddress);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("-------------------");
  console.log("IdentityRegistry:   ", identityAddress);
  console.log("ReputationRegistry: ", reputationAddress);
  console.log("ValidationRegistry: ", validationAddress);
  console.log("\nAdd these to your .env.local:");
  console.log("----------------------------");
  console.log(`NEXT_PUBLIC_IDENTITY_REGISTRY=${identityAddress}`);
  console.log(`NEXT_PUBLIC_REPUTATION_REGISTRY=${reputationAddress}`);
  console.log(`NEXT_PUBLIC_VALIDATION_REGISTRY=${validationAddress}`);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

Create `scripts/check-balance.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "MON");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Step 7: Deploy Contracts! (10 min)

```bash
# Deploy to Monad Testnet
npx hardhat run scripts/deploy-all.ts --network monadTestnet

# Save the output addresses!
```

### Step 8: Add Monad to RainbowKit (15 min)

Update `src/lib/wagmi.ts`:

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define Monad Testnet
export const monadTestnet = defineChain({
  id: 41454,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet.monad.xyz'] },
    public: { http: ['https://testnet.monad.xyz'] },
  },
  blockExplorers: {
    default: { 
      name: 'Monad Explorer', 
      url: 'https://monad-testnet.socialscan.io' 
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Molfi Protocol',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [
    monadTestnet, // Add Monad first!
    sepolia,
    mainnet, 
    polygon, 
    optimism, 
    arbitrum, 
    base
  ],
  ssr: true,
});
```

### Step 9: Create Contract Addresses Config (5 min)

Create `src/lib/contracts.ts`:

```typescript
export const CONTRACTS = {
  monadTestnet: {
    identityRegistry: process.env.NEXT_PUBLIC_IDENTITY_REGISTRY || '',
    reputationRegistry: process.env.NEXT_PUBLIC_REPUTATION_REGISTRY || '',
    validationRegistry: process.env.NEXT_PUBLIC_VALIDATION_REGISTRY || '',
  },
  sepolia: {
    identityRegistry: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
    reputationRegistry: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
    validationRegistry: '', // Add if needed
  },
} as const;

export function getContractAddress(
  chainId: number,
  contract: 'identityRegistry' | 'reputationRegistry' | 'validationRegistry'
): string {
  switch (chainId) {
    case 41454: // Monad Testnet
      return CONTRACTS.monadTestnet[contract];
    case 11155111: // Sepolia
      return CONTRACTS.sepolia[contract];
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
}
```

### Step 10: Test Everything! (10 min)

```bash
# Start dev server
npm run dev

# Visit http://localhost:3001
# 1. Connect wallet
# 2. Switch to Monad Testnet
# 3. Visit /setup page
# 4. Try registering an agent
```

---

## 📋 Checklist

- [ ] Private key generated and saved
- [ ] Hardhat dependencies installed
- [ ] ERC-8004 contracts copied
- [ ] `hardhat.config.ts` created
- [ ] Monad testnet tokens received
- [ ] Deployment scripts created
- [ ] Contracts deployed to Monad Testnet
- [ ] Contract addresses saved in `.env.local`
- [ ] Monad Testnet added to RainbowKit
- [ ] `src/lib/contracts.ts` created
- [ ] Dev server running
- [ ] Wallet connects to Monad Testnet
- [ ] Ready to build enhanced /setup UI!

---

## 🆘 Troubleshooting

### "Insufficient funds" error
- Make sure you have Monad testnet tokens
- Check balance with `scripts/check-balance.ts`
- Request more from faucet if needed

### "Network not found" error
- Verify Monad RPC URL is correct
- Check `hardhat.config.ts` network configuration
- Try alternative RPC if available

### "Contract deployment failed"
- Check gas price settings
- Ensure deployer has enough MON
- Review contract code for errors
- Check Hardhat console for details

### RainbowKit doesn't show Monad
- Verify chain definition in `wagmi.ts`
- Check chain ID is correct (41454)
- Clear browser cache
- Restart dev server

---

## 📚 Next Steps

After completing this quick start:

1. **Copy ABIs** - Copy contract ABIs to `src/abis/`
2. **Create Hooks** - Build wagmi hooks for contract interactions
3. **Build UI** - Create the enhanced /setup page
4. **IPFS Integration** - Set up Pinata or NFT.Storage
5. **Test Flow** - Register a test agent end-to-end

See `PHASE_2_PLAN.md` for full details!

---

**Let's ship Phase 2! 🚀💜**
