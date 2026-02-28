# 🚀 MOLFI PHASE 2 - QUICK REFERENCE

## ✅ STATUS: 100% COMPLETE

All 8 tasks completed! Ready for deployment and testing.

---

## 📁 Key Files

### Smart Contracts
```
contracts/
├── IdentityRegistryUpgradeable.sol    # Agent registration (ERC-721)
├── ReputationRegistryUpgradeable.sol  # Feedback & reputation
├── ValidationRegistryUpgradeable.sol  # Validation system
└── MolfiAgentValidator.sol            # Custom validator
```

### Deployment Scripts
```
scripts/
├── generate-key.ts        # Generate deployment key
├── check-balance.ts       # Check wallet balance
├── deploy-all.ts          # Deploy all registries
└── deploy-validator.ts    # Deploy validator
```

### Pages
```
src/app/
├── agents/page.tsx        # Marketplace
├── agents/[id]/page.tsx   # Agent details
├── setup/page.tsx         # 5-step wizard
└── profile/page.tsx       # User profile
```

### Hooks
```
src/hooks/
├── useRegisterAgent.ts    # Register agents
├── useAgentData.ts        # Read agent data
├── useGiveFeedback.ts     # Submit feedback
├── useAgentReputation.ts  # Read reputation
└── useValidateAgent.ts    # Validate agents
```

---

## 🎯 Quick Start

### 1. Install Dependencies
```bash
cd /Users/jaibajrang/Desktop/Projects/moltiverse/Molfi
npm install
```

### 2. Configure Environment
```bash
# Create .env.local
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
DEPLOYER_PRIVATE_KEY=0x...
NEXT_PUBLIC_PINATA_API_KEY=...
NEXT_PUBLIC_PINATA_SECRET_KEY=...
```

### 3. Deploy Contracts
```bash
# Generate key
npx ts-node scripts/generate-key.ts

# Get testnet tokens from Monad faucet

# Deploy
npx hardhat run scripts/deploy-all.ts --network monadTestnet
npx hardhat run scripts/deploy-validator.ts --network monadTestnet
```

### 4. Update Addresses
```bash
# Add to .env.local
NEXT_PUBLIC_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_REPUTATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATOR_CONTRACT=0x...
```

### 5. Start Dev Server
```bash
npm run dev
# Visit http://localhost:3001
```

---

## 🎨 Features

### ✅ Agent Registration
- 5-step wizard
- Form validation
- IPFS metadata
- On-chain registration
- Transaction tracking

### ✅ Agent Marketplace
- Browse agents
- Search & filter
- Sort by metrics
- Detailed pages
- Stats & performance

### ✅ Validation System
- On-chain validator
- Scoring (0-100)
- Real-time feedback
- Client-side validation

### ✅ Web3 Integration
- RainbowKit
- Monad Testnet
- Multi-chain support
- Transaction handling

---

## 📊 Pages

| Page | URL | Status |
|------|-----|--------|
| Home | `/` | ✅ Ready |
| Marketplace | `/agents` | ✅ Ready |
| Agent Detail | `/agents/[id]` | ✅ Ready |
| Setup Wizard | `/setup` | ✅ Ready |
| Profile | `/profile` | ✅ Ready |

---

## 🔗 Networks

| Network | Chain ID | RPC |
|---------|----------|-----|
| Monad Testnet | 10143 | https://testnet.monad.xyz |
| Sepolia | 11155111 | https://rpc.sepolia.org |
| Base Sepolia | 84532 | https://sepolia.base.org |

---

## 📝 Documentation

| File | Description |
|------|-------------|
| `PHASE_2_COMPLETE.md` | Complete summary |
| `TESTING_GUIDE.md` | Testing guide |
| `DEPLOY_NOW.md` | Deployment guide |
| `PHASE_2_PLAN.md` | Full plan |
| `PHASE_2_QUICKSTART.md` | Quick start |

---

## 🧪 Testing Checklist

### Pre-Deployment
- [ ] Install dependencies
- [ ] Configure .env.local
- [ ] Get Pinata keys
- [ ] Generate deployment key
- [ ] Get testnet tokens

### Deployment
- [ ] Deploy contracts
- [ ] Verify on explorer
- [ ] Update .env.local
- [ ] Test contract calls

### UI Testing
- [ ] Test all pages
- [ ] Test wallet connection
- [ ] Test network switching
- [ ] Test registration wizard
- [ ] Test marketplace

---

## 🚨 Common Issues

### "Cannot find module 'hardhat'"
```bash
npm install --save-dev hardhat
```

### "Insufficient funds"
Get testnet tokens from Monad faucet

### "Wrong network"
Switch to Monad Testnet in wallet

### "IPFS upload failed"
Check Pinata API keys in .env.local

---

## 💡 Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Hardhat
npx hardhat node         # Start local node
npx hardhat compile      # Compile contracts
npx hardhat test         # Run tests

# Deployment
npx hardhat run scripts/deploy-all.ts --network monadTestnet
npx hardhat run scripts/deploy-validator.ts --network monadTestnet

# Verification
npx hardhat verify --network monadTestnet <ADDRESS>
```

---

## 🎯 Next Steps

1. **Get Pinata Keys** → https://pinata.cloud
2. **Deploy Contracts** → Follow DEPLOY_NOW.md
3. **Test Registration** → Visit /setup
4. **Test Marketplace** → Visit /agents
5. **Monitor Transactions** → Check explorer

---

## 📞 Resources

- **Monad Testnet:** https://testnet.monad.xyz
- **Explorer:** https://monad-testnet.socialscan.io
- **ERC-8004:** https://www.8004.org
- **RainbowKit:** https://rainbowkit.com
- **Pinata:** https://pinata.cloud

---

**Phase 2: COMPLETE! 🎉💜**

Ready to deploy and ship! 🚀
