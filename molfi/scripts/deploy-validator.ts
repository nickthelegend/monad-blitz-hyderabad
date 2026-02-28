import { ethers } from "hardhat";

async function main() {
    console.log("\n" + "=".repeat(70));
    console.log("🔍 DEPLOYING MOLFI AGENT VALIDATOR");
    console.log("=".repeat(70) + "\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deployer address:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(balance), "MON\n");

    // Deploy MolfiAgentValidator
    console.log("🔍 Deploying MolfiAgentValidator...");
    const MolfiAgentValidator = await ethers.getContractFactory("MolfiAgentValidator");
    const validator = await MolfiAgentValidator.deploy();
    await validator.waitForDeployment();
    const validatorAddress = await validator.getAddress();
    console.log("✅ MolfiAgentValidator deployed to:", validatorAddress);

    // Test the validator
    console.log("\n📊 Testing validator...");
    const testScore = await validator.validateMetadata(
        "TestAgent",
        "A test agent for validation",
        true,
        true
    );
    console.log("Test validation score:", testScore.toString());

    const status = await validator.getValidationStatus(testScore);
    console.log("Validation status:", status);

    console.log("\n" + "=".repeat(70));
    console.log("🎉 VALIDATOR DEPLOYMENT COMPLETE!");
    console.log("=".repeat(70));
    console.log("\n📋 Validator Address:", validatorAddress);
    console.log("\n🔗 Explorer Link:");
    console.log(`https://monad-testnet.socialscan.io/address/${validatorAddress}`);
    console.log("\n📝 Add to .env.local:");
    console.log(`NEXT_PUBLIC_VALIDATOR_CONTRACT=${validatorAddress}`);
    console.log("\n" + "=".repeat(70) + "\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        process.exit(1);
    });
