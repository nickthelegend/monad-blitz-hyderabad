# 🧪 PHASE 2 - TESTING GUIDE

## Overview

This guide covers testing all Phase 2 features including smart contracts, UI components, and end-to-end workflows.

---

## 📋 Pre-Testing Checklist

### Environment Setup
- [ ] Node.js installed (v18+)
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` configured with all required variables
- [ ] Wallet with Monad testnet tokens
- [ ] Pinata API keys configured

### Required Environment Variables
```bash
# Wallet Connect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Deployment
DEPLOYER_PRIVATE_KEY=0x...

# IPFS (Pinata)
NEXT_PUBLIC_PINATA_API_KEY=your_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_secret_key

# Contract Addresses (after deployment)
NEXT_PUBLIC_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_REPUTATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATOR_CONTRACT=0x...
```

---

## 🔧 Smart Contract Testing

### 1. Local Hardhat Testing

**Start local node:**
```bash
npx hardhat node
```

**Deploy to local network:**
```bash
npx hardhat run scripts/deploy-all.ts --network localhost
```

**Expected Output:**
- ✅ IdentityRegistry deployed
- ✅ ReputationRegistry deployed
- ✅ ValidationRegistry deployed
- ✅ All addresses logged
- ✅ deployment-localhost.json created

### 2. Monad Testnet Deployment

**Check deployer balance:**
```bash
npx hardhat run scripts/check-balance.ts --network monadTestnet
```

**Expected Output:**
```
Address: 0x...
Balance: X.XX MON
```

**Deploy contracts:**
```bash
npx hardhat run scripts/deploy-all.ts --network monadTestnet
```

**Expected Output:**
- ✅ All 3 registries deployed
- ✅ Addresses logged
- ✅ Explorer links provided
- ✅ deployment-monad-testnet.json created

**Deploy validator:**
```bash
npx hardhat run scripts/deploy-validator.ts --network monadTestnet
```

**Expected Output:**
- ✅ MolfiAgentValidator deployed
- ✅ Test validation passed
- ✅ Validation score calculated

### 3. Contract Verification

**Verify on explorer:**
```bash
npx hardhat verify --network monadTestnet <CONTRACT_ADDRESS>
```

**Manual Verification:**
1. Visit https://monad-testnet.socialscan.io
2. Search for contract address
3. Verify deployment transaction
4. Check contract code (if verified)

---

## 🎨 UI Component Testing

### 1. Development Server

**Start dev server:**
```bash
npm run dev
```

**Expected:**
- ✅ Server starts on http://localhost:3001
- ✅ No compilation errors
- ✅ Hot reload working

### 2. Page Testing

#### Home Page (/)
- [ ] Page loads without errors
- [ ] Purple theme applied
- [ ] Navbar visible
- [ ] Connect wallet button works
- [ ] Responsive on mobile

#### Agents Marketplace (/agents)
- [ ] Page loads without errors
- [ ] Stats bar displays correctly
- [ ] Search bar functional
- [ ] Filter buttons work (All, Fund Managers, Traders, Analysts)
- [ ] Risk profile filter works
- [ ] Sort dropdown works
- [ ] Agent cards display correctly
- [ ] Hover effects work
- [ ] Click navigates to detail page
- [ ] Responsive grid layout

#### Agent Detail (/agents/[id])
- [ ] Page loads with agent data
- [ ] Stats display correctly
- [ ] Performance metrics shown
- [ ] Strategy details visible
- [ ] Agent info sidebar complete
- [ ] Quick actions buttons present
- [ ] Back link works
- [ ] Responsive layout

#### Setup Page (/setup)
- [ ] Wallet connection check works
- [ ] Network validation works (Monad Testnet)
- [ ] Step 1: Introduction displays
- [ ] Step 2: Agent details form works
  - [ ] Name input (3-50 chars)
  - [ ] Description textarea (10-500 chars)
  - [ ] Agent type selection
  - [ ] Character counters work
- [ ] Step 3: Strategy configuration
  - [ ] Risk profile selection
  - [ ] Target assets multi-select
  - [ ] Leverage slider (1x-50x)
  - [ ] Trading style dropdown
- [ ] Step 4: Metadata
  - [ ] Agent wallet input
  - [ ] API endpoint input
  - [ ] Social links inputs
- [ ] Step 5: Review & Register
  - [ ] Summary displays all data
  - [ ] Register button works
  - [ ] Loading states show
  - [ ] Success screen displays
  - [ ] Explorer link works

#### Profile Page (/profile)
- [ ] Wallet connection check works
- [ ] Agent Manager header displays
- [ ] Stats show correctly
- [ ] My Agents section visible
- [ ] Recent Activity table displays
- [ ] Purple theme throughout

---

## 🔗 Integration Testing

### 1. Wallet Connection

**Test Steps:**
1. Visit any page
2. Click "Connect Wallet"
3. Select wallet (MetaMask, etc.)
4. Approve connection

**Expected:**
- ✅ Wallet connects successfully
- ✅ Address displays in navbar
- ✅ Balance shows (if configured)
- ✅ Chain displays correctly

### 2. Network Switching

**Test Steps:**
1. Connect wallet
2. Switch to different network
3. Visit /setup page
4. Should see "Wrong Network" message
5. Switch back to Monad Testnet

**Expected:**
- ✅ Network detection works
- ✅ Wrong network message shows
- ✅ Switching back enables functionality

### 3. Agent Registration Flow

**Test Steps:**
1. Connect wallet to Monad Testnet
2. Visit /setup
3. Complete all 5 steps:
   - Enter agent name
   - Enter description
   - Select agent type
   - Configure strategy
   - Add metadata
4. Review summary
5. Click "Register Agent"
6. Approve transaction in wallet
7. Wait for confirmation

**Expected:**
- ✅ Form validation works
- ✅ Progress indicator updates
- ✅ Navigation between steps works
- ✅ IPFS upload succeeds
- ✅ Transaction submits
- ✅ Confirmation screen shows
- ✅ Transaction hash displayed
- ✅ Explorer link works

### 4. IPFS Integration

**Test Steps:**
1. Complete registration form
2. Click "Register Agent"
3. Monitor console for IPFS upload

**Expected:**
- ✅ Metadata created correctly
- ✅ Upload to Pinata succeeds
- ✅ IPFS URI returned (ipfs://...)
- ✅ Metadata fetchable from gateway

### 5. Contract Interaction

**Test Steps:**
1. Register an agent
2. Check transaction on explorer
3. Verify contract call
4. Check event logs

**Expected:**
- ✅ Transaction confirmed
- ✅ IdentityRegistry.register() called
- ✅ AgentRegistered event emitted
- ✅ Token ID assigned

---

## 🐛 Error Handling Testing

### 1. Network Errors

**Test Cases:**
- [ ] No wallet installed
- [ ] Wallet locked
- [ ] Wrong network
- [ ] Insufficient gas
- [ ] RPC timeout

### 2. Form Validation

**Test Cases:**
- [ ] Empty name
- [ ] Name too short (<3 chars)
- [ ] Name too long (>50 chars)
- [ ] Empty description
- [ ] Description too short (<10 chars)
- [ ] No agent type selected
- [ ] No risk profile selected

### 3. Transaction Errors

**Test Cases:**
- [ ] User rejects transaction
- [ ] Insufficient funds
- [ ] Gas estimation fails
- [ ] Transaction reverts
- [ ] Network congestion

### 4. IPFS Errors

**Test Cases:**
- [ ] Invalid API keys
- [ ] Upload timeout
- [ ] Invalid metadata format
- [ ] Fetch fails

---

## 📊 Performance Testing

### 1. Page Load Times

**Metrics to Check:**
- Home page: < 2s
- Agents page: < 2s
- Setup page: < 2s
- Profile page: < 2s

### 2. Transaction Times

**Expected Times:**
- IPFS upload: 2-5s
- Transaction submission: 1-2s
- Confirmation: 10-30s (depending on network)

### 3. Responsiveness

**Test Devices:**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## ✅ Acceptance Criteria

### Smart Contracts
- [x] All contracts deploy successfully
- [x] Validator contract works
- [x] Contracts verified on explorer
- [ ] Registration function works
- [ ] Feedback function works
- [ ] Reputation calculation works

### UI/UX
- [x] All pages load without errors
- [x] Purple theme consistent
- [x] Responsive design works
- [x] Forms validate correctly
- [x] Loading states show
- [x] Error messages clear

### Integration
- [ ] Wallet connection works
- [ ] Network switching works
- [ ] IPFS upload works
- [ ] Contract calls succeed
- [ ] Transactions confirm
- [ ] Events emitted correctly

### Documentation
- [x] README updated
- [x] API documentation
- [x] Deployment guide
- [x] Testing guide
- [x] User guide

---

## 🚨 Known Issues

### Current Limitations
1. **Mock Data:** Agent marketplace uses mock data until contracts deployed
2. **IPFS:** Requires Pinata API keys
3. **Monad Testnet:** May have RPC instability
4. **Validation:** On-chain validation pending deployment

### Workarounds
1. Use local Hardhat network for testing
2. Use public IPFS gateways for reading
3. Have backup RPC URLs
4. Use client-side validation

---

## 📝 Test Results Template

```markdown
## Test Run: [Date]

### Environment
- Network: Monad Testnet / Localhost
- Wallet: MetaMask / Other
- Browser: Chrome / Firefox / Safari

### Contract Deployment
- [ ] IdentityRegistry: [Address]
- [ ] ReputationRegistry: [Address]
- [ ] ValidationRegistry: [Address]
- [ ] Validator: [Address]

### UI Tests
- [ ] Home Page: PASS / FAIL
- [ ] Agents Page: PASS / FAIL
- [ ] Setup Page: PASS / FAIL
- [ ] Profile Page: PASS / FAIL

### Integration Tests
- [ ] Wallet Connection: PASS / FAIL
- [ ] Network Switching: PASS / FAIL
- [ ] Agent Registration: PASS / FAIL
- [ ] IPFS Upload: PASS / FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Additional observations]
```

---

## 🎯 Next Steps After Testing

1. **Fix Critical Bugs:** Address any blocking issues
2. **Deploy to Mainnet:** If testnet successful
3. **User Acceptance Testing:** Get feedback from users
4. **Performance Optimization:** Based on metrics
5. **Security Audit:** Before mainnet launch

---

**Happy Testing! 🧪💜**
