# 🚀 QUICK DEPLOYMENT GUIDE

## Ready to Deploy in 5 Steps!

### Step 1: Generate Key (30 seconds)
```bash
cd /Users/jaibajrang/Desktop/Projects/moltiverse/Molfi
npx ts-node scripts/generate-key.ts
```

**Output will show:**
- Private key (save this!)
- Public address (fund this!)

### Step 2: Save Key (30 seconds)
Create `.env.local` in Molfi directory:
```bash
DEPLOYER_PRIVATE_KEY=0x...  # Paste from Step 1

# Existing (keep these)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

### Step 3: Get Testnet Tokens (5-10 minutes)
1. Copy your public address from Step 1
2. Visit Monad testnet faucet
   - Check Monad Discord: https://discord.gg/monad
   - Or Monad Docs for faucet link
3. Paste address and request tokens
4. Wait for confirmation

### Step 4: Verify Balance (10 seconds)
```bash
npx hardhat run scripts/check-balance.ts --network monadTestnet
```

**Should show:**
```
Deployer Address: 0x...
Balance: 1.0 MON  (or whatever you got from faucet)
```

### Step 5: Deploy! (2-3 minutes)
```bash
npx hardhat run scripts/deploy-all.ts --network monadTestnet
```

**This will:**
1. Deploy IdentityRegistry
2. Deploy ReputationRegistry
3. Deploy ValidationRegistry
4. Save addresses to `deployment-monad-testnet.json`
5. Show you what to add to `.env.local`

### Step 6: Update .env.local (30 seconds)
Add the contract addresses from deployment output:
```bash
NEXT_PUBLIC_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_REPUTATION_REGISTRY=0x...
NEXT_PUBLIC_VALIDATION_REGISTRY=0x...
```

---

## ✅ Done!

Your contracts are deployed! 🎉

**Next:**
- Verify on explorer: https://monad-testnet.socialscan.io
- Continue to Task 2.2 (Add Monad to RainbowKit)
- Build the enhanced /setup UI

---

## 🆘 Troubleshooting

### "Cannot find module 'hardhat'"
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### "Insufficient funds"
- Check balance: `npx hardhat run scripts/check-balance.ts --network monadTestnet`
- Get more tokens from faucet
- Make sure you're using the right address

### "Network not found"
- Check `hardhat.config.ts` has monadTestnet configured
- Verify RPC URL: https://testnet.monad.xyz
- Try alternative RPC if available

### "Private key not found"
- Make sure `.env.local` exists
- Check `DEPLOYER_PRIVATE_KEY` is set
- Verify the key starts with `0x`

---

## 📋 Checklist

- [ ] Generated private key
- [ ] Saved to .env.local
- [ ] Got testnet tokens
- [ ] Verified balance > 0
- [ ] Deployed contracts
- [ ] Updated .env.local with addresses
- [ ] Verified on explorer

---

**Total Time: ~10-15 minutes** (mostly waiting for faucet)

**Ready to ship! 🚀💜**
