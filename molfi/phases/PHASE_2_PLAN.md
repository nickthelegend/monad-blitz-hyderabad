# PHASE 2: ERC-8004 AI Agent Registration & Smart Contract Deployment

## 🎯 Objective
Implement ERC-8004 compliant AI agent registration system with smart contracts deployed on Monad Testnet, enhanced UI for /setup page, and full integration with RainbowKit wallet connection.

---

## 📋 Tasks Breakdown

### **Task 2.1: Smart Contract Setup & Deployment Infrastructure**
**Priority:** HIGH | **Estimated Time:** 3-4 hours

#### Subtasks:
1. **Copy ERC-8004 Contracts to Molfi Project**
   - Create `contracts/` directory in Molfi root
   - Copy core contracts from `erc-8004-contracts`:
     - `IdentityRegistryUpgradeable.sol`
     - `ReputationRegistryUpgradeable.sol`
     - `ValidationRegistryUpgradeable.sol`
     - `ERC1967Proxy.sol`
     - Supporting contracts (MinimalUUPS, etc.)

2. **Setup Hardhat Configuration**
   - Install Hardhat dependencies:
     ```bash
     npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts-upgradeable
     ```
   - Create `hardhat.config.ts` with:
     - Monad Testnet configuration
     - Ethereum Sepolia (for testing)
     - Base Sepolia (backup)
   - Configure deployment accounts

3. **Generate Deployment Private Key**
   - Create secure private key for deployment
   - Store in `.env.local` as `DEPLOYER_PRIVATE_KEY`
   - Add to `.gitignore` for security
   - Document key management in README

4. **Create Deployment Scripts**
   - `scripts/deploy-identity-registry.ts` - Deploy IdentityRegistry
   - `scripts/deploy-reputation-registry.ts` - Deploy ReputationRegistry
   - `scripts/deploy-validation-registry.ts` - Deploy ValidationRegistry
   - `scripts/deploy-all.ts` - Deploy all contracts in sequence
   - `scripts/verify-contracts.ts` - Verify on block explorer

**Deliverables:**
- ✅ Contracts copied and organized
- ✅ Hardhat configured for Monad Testnet
- ✅ Deployment scripts ready
- ✅ Private key securely stored

---

### **Task 2.2: Monad Testnet Integration**
**Priority:** HIGH | **Estimated Time:** 2 hours

#### Subtasks:
1. **Add Monad Testnet to RainbowKit**
   - Update `src/lib/wagmi.ts`:
     ```typescript
     import { defineChain } from 'viem'
     
     const monadTestnet = defineChain({
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
         default: { name: 'Monad Explorer', url: 'https://monad-testnet.socialscan.io' },
       },
       testnet: true,
     })
     ```
   - Add to `chains` array in wagmi config

2. **Update Chain Selection UI**
   - Ensure RainbowKit shows Monad Testnet
   - Add Monad logo/branding
   - Test chain switching

3. **Configure Contract Addresses**
   - Create `src/lib/contracts.ts`:
     ```typescript
     export const CONTRACTS = {
       monadTestnet: {
         identityRegistry: '0x...', // After deployment
         reputationRegistry: '0x...',
         validationRegistry: '0x...',
       },
       // Add other chains as needed
     }
     ```

**Deliverables:**
- ✅ Monad Testnet added to RainbowKit
- ✅ Chain switching works
- ✅ Contract addresses configured

---

### **Task 2.3: Deploy Smart Contracts to Monad Testnet**
**Priority:** HIGH | **Estimated Time:** 2-3 hours

#### Subtasks:
1. **Get Monad Testnet Tokens**
   - Request testnet MON from faucet
   - Ensure deployer wallet has sufficient balance
   - Document faucet URL in README

2. **Deploy Contracts**
   - Run deployment script:
     ```bash
     npx hardhat run scripts/deploy-all.ts --network monadTestnet
     ```
   - Save deployed addresses
   - Verify deployment on Monad Explorer

3. **Verify Contracts on Block Explorer**
   - Run verification script
   - Ensure contracts are readable on explorer
   - Document contract addresses

4. **Test Contract Interactions**
   - Test `register()` function on IdentityRegistry
   - Test `giveFeedback()` on ReputationRegistry
   - Ensure all functions work as expected

**Deliverables:**
- ✅ Contracts deployed to Monad Testnet
- ✅ Addresses saved in `src/lib/contracts.ts`
- ✅ Contracts verified on explorer
- ✅ Basic functionality tested

---

### **Task 2.4: Enhanced /setup Page UI**
**Priority:** HIGH | **Estimated Time:** 4-5 hours

#### Subtasks:
1. **Design Premium Setup Flow**
   - Multi-step wizard:
     1. Connect Wallet
     2. Agent Details (Name, Description)
     3. Strategy Configuration
     4. Metadata & Services
     5. Review & Register
   - Progress indicator
   - Purple theme with glassmorphism

2. **Implement Form Components**
   - **Step 1: Wallet Connection**
     - RainbowKit ConnectButton
     - Chain verification (must be on Monad Testnet)
     - Balance check
   
   - **Step 2: Agent Details**
     - Agent Name (required, max 50 chars)
     - Description (required, max 500 chars)
     - Agent Type (Fund Manager, Trader, Analyst)
     - Avatar/Image upload (IPFS)
   
   - **Step 3: Strategy Configuration**
     - Risk Profile: Conservative / Balanced / Aggressive
     - Target Assets: ETH, BTC, SOL, etc.
     - Leverage Preference: 1x - 50x
     - Trading Style: Scalping / Swing / Long-term
   
   - **Step 4: Metadata & Services**
     - Agent Wallet Address (auto-filled, can change)
     - API Endpoint (optional)
     - Social Links (Twitter, Discord, etc.)
     - Tags/Categories
   
   - **Step 5: Review & Register**
     - Summary of all inputs
     - Estimated gas cost
     - "Register Agent" button
     - Transaction status tracking

3. **Form Validation**
   - Client-side validation for all fields
   - Real-time error messages
   - Prevent submission if invalid
   - Show helpful hints

4. **IPFS Integration**
   - Upload agent registration file to IPFS
   - Use Pinata or NFT.Storage
   - Generate `agentURI` pointing to IPFS
   - Include all metadata in JSON format

5. **Transaction Handling**
   - Use wagmi hooks for contract interaction
   - Show loading states during transaction
   - Handle transaction errors gracefully
   - Success confirmation with agent ID
   - Link to view agent on explorer

**Deliverables:**
- ✅ Multi-step registration wizard
- ✅ All form fields with validation
- ✅ IPFS integration for metadata
- ✅ Transaction handling with status updates
- ✅ Beautiful purple-themed UI

---

### **Task 2.5: Contract Integration Hooks**
**Priority:** HIGH | **Estimated Time:** 3-4 hours

#### Subtasks:
1. **Create Contract ABIs**
   - Copy ABIs from `erc-8004-contracts/abis/`
   - Save in `src/abis/`:
     - `IdentityRegistry.json`
     - `ReputationRegistry.json`
     - `ValidationRegistry.json`

2. **Create Wagmi Hooks**
   - `src/hooks/useRegisterAgent.ts`:
     ```typescript
     export function useRegisterAgent() {
       const { writeContract, data, isLoading, isSuccess, error } = useWriteContract()
       
       const register = async (agentURI: string) => {
         return writeContract({
           address: CONTRACTS.monadTestnet.identityRegistry,
           abi: IdentityRegistryABI,
           functionName: 'register',
           args: [agentURI],
         })
       }
       
       return { register, data, isLoading, isSuccess, error }
     }
     ```
   
   - `src/hooks/useAgentData.ts` - Read agent data
   - `src/hooks/useGiveFeedback.ts` - Submit feedback
   - `src/hooks/useAgentReputation.ts` - Read reputation

3. **Create Helper Functions**
   - `src/lib/ipfs.ts` - IPFS upload/download
   - `src/lib/agent-metadata.ts` - Format agent registration JSON
   - `src/lib/contract-helpers.ts` - Contract interaction utilities

4. **Error Handling**
   - User-friendly error messages
   - Transaction failure recovery
   - Network error handling
   - Gas estimation errors

**Deliverables:**
- ✅ Contract ABIs in project
- ✅ Wagmi hooks for all contract functions
- ✅ Helper functions for IPFS and metadata
- ✅ Comprehensive error handling

---

### **Task 2.6: Agent Registry & Validation Contracts**
**Priority:** MEDIUM | **Estimated Time:** 3-4 hours

#### Subtasks:
1. **Create Custom Validation Contract**
   - `contracts/MolfiAgentValidator.sol`:
     - Validates agent metadata format
     - Checks minimum requirements (name, description, strategy)
     - Verifies agent wallet ownership
     - Returns validation score (0-100)
   
2. **Implement Validation Logic**
   - On-chain validation rules:
     - Agent must have valid name (3-50 chars)
     - Description must exist
     - Strategy must be defined
     - Wallet must be verified
   - Off-chain validation (optional):
     - API endpoint health check
     - Social proof verification
     - Historical performance check

3. **Deploy Validation Contract**
   - Deploy to Monad Testnet
   - Register as validator in ValidationRegistry
   - Test validation flow

4. **Integrate Validation in UI**
   - Show validation status in /setup
   - Display validation score
   - Highlight missing requirements
   - Allow re-validation

**Deliverables:**
- ✅ Custom validation contract deployed
- ✅ Validation logic implemented
- ✅ UI shows validation status
- ✅ Agents can be validated on-chain

---

### **Task 2.7: Agent Marketplace View**
**Priority:** MEDIUM | **Estimated Time:** 4-5 hours

#### Subtasks:
1. **Create /agents Page**
   - Grid view of all registered agents
   - Filter by:
     - Risk profile
     - Strategy type
     - Reputation score
     - TVL managed
   - Sort by:
     - Newest first
     - Highest reputation
     - Best performance
     - Most deposits

2. **Agent Card Component**
   - Display:
     - Agent avatar/image
     - Name and description
     - Risk profile badge
     - Reputation score
     - Total deposits (TVL)
     - 30-day performance
     - "View Details" button
   - Purple theme with glassmorphism
   - Hover effects

3. **Agent Detail Page**
   - `/agents/[agentId]` route
   - Full agent information:
     - Complete metadata
     - Strategy details
     - Performance charts
     - Reputation history
     - Feedback from users
     - Validation status
   - "Deposit" button (for Phase 3)
   - "Give Feedback" button

4. **Real-time Data Fetching**
   - Fetch agents from IdentityRegistry
   - Load reputation from ReputationRegistry
   - Cache data for performance
   - Auto-refresh every 30 seconds

**Deliverables:**
- ✅ /agents marketplace page
- ✅ Agent card components
- ✅ Agent detail pages
- ✅ Filtering and sorting
- ✅ Real-time data updates

---

### **Task 2.8: Testing & Documentation**
**Priority:** MEDIUM | **Estimated Time:** 2-3 hours

#### Subtasks:
1. **Write Contract Tests**
   - Test agent registration flow
   - Test reputation system
   - Test validation logic
   - Test edge cases and errors

2. **Write Integration Tests**
   - Test full registration flow
   - Test wallet connection
   - Test IPFS upload
   - Test transaction submission

3. **Create Documentation**
   - `DEPLOYMENT.md` - How to deploy contracts
   - `AGENT_REGISTRATION.md` - How to register an agent
   - `CONTRACT_ADDRESSES.md` - All deployed addresses
   - Update main README with Phase 2 info

4. **User Guide**
   - Step-by-step guide for registering agents
   - Screenshots of UI
   - Troubleshooting common issues
   - FAQ section

**Deliverables:**
- ✅ Contract tests passing
- ✅ Integration tests passing
- ✅ Complete documentation
- ✅ User guide with screenshots

---

## 🗂️ File Structure

```
Molfi/
├── contracts/                          # Smart contracts
│   ├── IdentityRegistryUpgradeable.sol
│   ├── ReputationRegistryUpgradeable.sol
│   ├── ValidationRegistryUpgradeable.sol
│   ├── MolfiAgentValidator.sol        # Custom validator
│   └── ...supporting contracts
│
├── scripts/                            # Deployment scripts
│   ├── deploy-identity-registry.ts
│   ├── deploy-reputation-registry.ts
│   ├── deploy-validation-registry.ts
│   ├── deploy-all.ts
│   └── verify-contracts.ts
│
├── src/
│   ├── abis/                          # Contract ABIs
│   │   ├── IdentityRegistry.json
│   │   ├── ReputationRegistry.json
│   │   └── ValidationRegistry.json
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useRegisterAgent.ts
│   │   ├── useAgentData.ts
│   │   ├── useGiveFeedback.ts
│   │   └── useAgentReputation.ts
│   │
│   ├── lib/                           # Utilities
│   │   ├── contracts.ts               # Contract addresses
│   │   ├── ipfs.ts                    # IPFS helpers
│   │   ├── agent-metadata.ts          # Metadata formatting
│   │   └── contract-helpers.ts        # Contract utilities
│   │
│   ├── app/
│   │   ├── setup/                     # Enhanced setup page
│   │   │   └── page.tsx
│   │   ├── agents/                    # Agent marketplace
│   │   │   ├── page.tsx               # List view
│   │   │   └── [agentId]/
│   │   │       └── page.tsx           # Detail view
│   │   └── ...
│   │
│   └── components/
│       ├── agent/
│       │   ├── AgentCard.tsx
│       │   ├── AgentDetail.tsx
│       │   ├── RegistrationWizard.tsx
│       │   └── ValidationStatus.tsx
│       └── ...
│
├── hardhat.config.ts                  # Hardhat configuration
├── .env.local                         # Environment variables
├── DEPLOYMENT.md                      # Deployment guide
├── AGENT_REGISTRATION.md              # Registration guide
└── CONTRACT_ADDRESSES.md              # Deployed addresses
```

---

## 🔐 Environment Variables

Create `.env.local` with:

```bash
# Deployment
DEPLOYER_PRIVATE_KEY=0x...              # Generated private key
MONAD_TESTNET_RPC=https://testnet.monad.xyz

# IPFS (choose one)
PINATA_API_KEY=...
PINATA_SECRET_KEY=...
# OR
NFT_STORAGE_API_KEY=...

# WalletConnect (existing)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Contract Addresses (after deployment)
NEXT_PUBLIC_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_REPUTATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATION_REGISTRY=0x...
```

---

## 🎨 UI/UX Requirements

### Setup Page Flow:
1. **Step Indicator** - Show progress (1/5, 2/5, etc.)
2. **Purple Theme** - Consistent with Sora + Inter fonts
3. **Glassmorphism** - Blur effects, purple borders
4. **Smooth Transitions** - Between steps
5. **Validation Feedback** - Real-time error messages
6. **Loading States** - During IPFS upload and transaction
7. **Success Animation** - Confetti or celebration on success
8. **Mobile Responsive** - Works on all screen sizes

### Agent Marketplace:
1. **Grid Layout** - 3 columns on desktop, 1 on mobile
2. **Filter Sidebar** - Collapsible on mobile
3. **Search Bar** - Search by name or description
4. **Sort Dropdown** - Multiple sort options
5. **Infinite Scroll** - Load more agents as user scrolls
6. **Empty State** - When no agents match filters

---

## 📊 Success Criteria

- [ ] Smart contracts deployed to Monad Testnet
- [ ] Contracts verified on block explorer
- [ ] RainbowKit supports Monad Testnet
- [ ] /setup page has multi-step wizard
- [ ] Agent registration works end-to-end
- [ ] IPFS integration functional
- [ ] Agent marketplace displays all agents
- [ ] Agent detail pages show full info
- [ ] Reputation system works
- [ ] Validation contract deployed and working
- [ ] All tests passing
- [ ] Documentation complete

---

## 🚀 Deployment Checklist

### Pre-Deployment:
- [ ] Generate deployment private key
- [ ] Get Monad testnet tokens from faucet
- [ ] Configure Hardhat for Monad Testnet
- [ ] Test contracts on local network
- [ ] Review all contract code

### Deployment:
- [ ] Deploy IdentityRegistry
- [ ] Deploy ReputationRegistry
- [ ] Deploy ValidationRegistry
- [ ] Deploy MolfiAgentValidator
- [ ] Verify all contracts on explorer
- [ ] Save all contract addresses
- [ ] Test basic functions on testnet

### Post-Deployment:
- [ ] Update `.env.local` with addresses
- [ ] Update `src/lib/contracts.ts`
- [ ] Test full registration flow
- [ ] Document deployment in DEPLOYMENT.md
- [ ] Create backup of deployment info

---

## 🔗 Resources

### ERC-8004:
- Spec: `/Users/jaibajrang/Desktop/Projects/moltiverse/erc-8004-contracts/ERC8004SPEC.md`
- Contracts: `/Users/jaibajrang/Desktop/Projects/moltiverse/erc-8004-contracts/contracts/`
- Website: https://www.8004.org

### Monad:
- Testnet RPC: https://testnet.monad.xyz
- Explorer: https://monad-testnet.socialscan.io
- Faucet: (TBD - check Monad docs)
- Docs: https://docs.monad.xyz

### Tools:
- Hardhat: https://hardhat.org
- RainbowKit: https://rainbowkit.com
- Wagmi: https://wagmi.sh
- IPFS (Pinata): https://pinata.cloud
- IPFS (NFT.Storage): https://nft.storage

---

## ⏱️ Timeline Estimate

**Total Time: 23-30 hours**

- Task 2.1: Smart Contract Setup (3-4h)
- Task 2.2: Monad Integration (2h)
- Task 2.3: Contract Deployment (2-3h)
- Task 2.4: Enhanced UI (4-5h)
- Task 2.5: Contract Hooks (3-4h)
- Task 2.6: Validation (3-4h)
- Task 2.7: Marketplace (4-5h)
- Task 2.8: Testing & Docs (2-3h)

**Suggested Sprint: 3-4 days** (assuming 6-8 hours/day)

---

## 🎯 Next Steps (Phase 3)

After Phase 2 is complete:
- Implement Vault contracts for capital management
- Add deposit/withdrawal functionality
- Integrate with perpetual trading engine
- Build PnL tracking system
- Create performance analytics dashboard

---

**Ready to execute Phase 2! 🚀**
