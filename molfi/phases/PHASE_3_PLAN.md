# 🎯 PHASE 3 - UI POLISH & EXPLORER

## Overview

Phase 3 focuses on polishing existing pages, implementing the agent explorer, and ensuring contract registration works end-to-end.

---

## 📋 Tasks

### TASK 3.1: Fix /arena Layout & Design
**Objective:** Redesign arena page with better layout and premium aesthetics

**Requirements:**
- Modern card-based layout
- Better spacing and hierarchy
- Purple theme consistency
- Responsive grid
- Improved stats display
- Better bot cards

**Files to Modify:**
- `src/app/arena/page.tsx`

**Estimated Time:** 30 minutes

---

### TASK 3.2: Enhance /profile Page
**Objective:** Improve profile page layout and add agent management

**Requirements:**
- Better header section
- Improved stats cards
- Agent list with cards
- Recent activity table redesign
- Add agent management actions
- Purple theme refinement

**Files to Modify:**
- `src/app/profile/page.tsx`

**Estimated Time:** 30 minutes

---

### TASK 3.3: Create /explorer Page
**Objective:** Build comprehensive agent explorer showing all registered agents

**Requirements:**
- Total agents count
- Total trades (wins/losses)
- Total profit/loss
- Agent grid with all registered agents
- Filter by status (active/inactive)
- Sort by various metrics
- Integration with IdentityRegistry contract
- Integration with ReputationRegistry contract
- Real-time stats

**Features:**
- Global stats dashboard
- Agent cards with performance
- Win/loss ratios
- Profit/loss tracking
- Reputation scores
- Trade history

**Files to Create:**
- `src/app/explorer/page.tsx`
- `src/hooks/useExplorerStats.ts`
- `src/hooks/useAgentPerformance.ts`

**Estimated Time:** 1 hour

---

### TASK 3.4: Implement Contract Registration
**Objective:** Ensure agent registration works end-to-end

**Requirements:**
- Deploy contracts to Monad Testnet
- Update contract addresses in config
- Test registration flow
- Verify IPFS upload
- Confirm on-chain registration
- Test event emission
- Verify agent ID assignment

**Steps:**
1. Deploy all contracts
2. Update .env.local
3. Test registration wizard
4. Verify transaction
5. Check agent in explorer

**Files to Modify:**
- `src/lib/contracts.ts` (update addresses)
- `.env.local` (add addresses)

**Estimated Time:** 30 minutes (deployment) + testing

---

### TASK 3.5: Add Performance Tracking
**Objective:** Track and display agent performance (trades, wins, losses, P&L)

**Requirements:**
- Performance data structure
- Win/loss tracking
- Profit/loss calculation
- Integration with ReputationRegistry
- Display on agent cards
- Display in explorer
- Display on profile

**Features:**
- Total trades count
- Win rate percentage
- Total profit/loss
- Recent performance
- Historical data

**Files to Create:**
- `src/lib/performance.ts`
- `src/hooks/useAgentPerformance.ts`

**Files to Modify:**
- `src/components/AgentCard.tsx`
- `src/app/agents/[id]/page.tsx`
- `src/app/explorer/page.tsx`

**Estimated Time:** 45 minutes

---

### TASK 3.6: Update Navbar
**Objective:** Add Explorer link to navigation

**Requirements:**
- Add Explorer link
- Update mobile menu
- Maintain consistency

**Files to Modify:**
- `src/components/Navbar.tsx`

**Estimated Time:** 5 minutes

---

## 🎯 Success Criteria

### UI/UX
- [ ] Arena page has modern layout
- [ ] Profile page is polished
- [ ] Explorer page is comprehensive
- [ ] All pages use purple theme
- [ ] Responsive on all devices

### Functionality
- [ ] Agent registration works end-to-end
- [ ] Agents appear in explorer
- [ ] Performance stats display correctly
- [ ] Win/loss tracking works
- [ ] Profit/loss calculation accurate

### Integration
- [ ] Contracts deployed
- [ ] Registration confirmed on-chain
- [ ] Events emitted correctly
- [ ] Data fetched from contracts
- [ ] IPFS metadata accessible

---

## 📊 Timeline

| Task | Duration | Priority |
|------|----------|----------|
| 3.1 Arena Layout | 30 min | High |
| 3.2 Profile Enhancement | 30 min | High |
| 3.3 Explorer Page | 1 hour | Critical |
| 3.4 Contract Registration | 30 min | Critical |
| 3.5 Performance Tracking | 45 min | High |
| 3.6 Navbar Update | 5 min | Low |

**Total Estimated Time:** ~3 hours

---

## 🔗 Dependencies

### External
- Monad Testnet RPC
- Pinata API (for IPFS)
- Contract deployment

### Internal
- Phase 2 completion
- All hooks created
- All contracts ready

---

## 📝 Notes

- Focus on polish and user experience
- Ensure all data is real (from contracts)
- Mock data only as fallback
- Comprehensive error handling
- Loading states for all async operations

---

**Phase 3: UI Polish & Explorer** 🎨🔍
