import { randomBytes } from "crypto";
import { Wallet } from "ethers";

console.log("\n" + "=".repeat(70));
console.log("🔐 GENERATING DEPLOYMENT PRIVATE KEY");
console.log("=".repeat(70) + "\n");

// Generate random private key
const privateKey = "0x" + randomBytes(32).toString("hex");
const wallet = new Wallet(privateKey);

console.log("✅ Private Key Generated!\n");
console.log("📋 IMPORTANT: Save these securely!");
console.log("-".repeat(70));
console.log("\nPrivate Key:");
console.log(privateKey);
console.log("\nPublic Address:");
console.log(wallet.address);
console.log("\n" + "-".repeat(70));

console.log("\n📝 Add to your .env.local file:");
console.log("-".repeat(70));
console.log(`DEPLOYER_PRIVATE_KEY=${privateKey}`);
console.log("-".repeat(70));

console.log("\n⚠️  SECURITY WARNINGS:");
console.log("1. NEVER commit .env.local to git");
console.log("2. NEVER share your private key");
console.log("3. This key is for TESTNET ONLY");
console.log("4. Fund this address with testnet tokens before deploying");

console.log("\n💰 Get testnet tokens:");
console.log("Monad Testnet Faucet: (Check Monad Discord/Docs)");
console.log("Address to fund:", wallet.address);

console.log("\n" + "=".repeat(70) + "\n");
