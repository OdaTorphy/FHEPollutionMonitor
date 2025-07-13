const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🔍 Starting contract verification process...\n");

  const network = hre.network.name;

  // Check if network supports verification
  if (network === "hardhat" || network === "localhost") {
    console.log("⚠️  Contract verification is not supported on local networks.");
    console.log("Please deploy to a testnet or mainnet for verification.\n");
    process.exit(0);
  }

  console.log(`📋 Network: ${network}\n`);

  // Load deployment information
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found!");
    console.error(`Expected file: ${deploymentFile}`);
    console.error("\nPlease deploy the contract first using:");
    console.error(`   npm run deploy\n`);
    process.exit(1);
  }

  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("📝 Verification Information:");
  console.log("═══════════════════════════════════════");
  console.log(`Contract: ${deploymentInfo.contractName}`);
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deploymentInfo.deployer}`);
  console.log("═══════════════════════════════════════\n");

  // Check if Etherscan API key is set
  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ ETHERSCAN_API_KEY not found in environment variables!");
    console.error("Please add it to your .env file:\n");
    console.error("ETHERSCAN_API_KEY=your_api_key_here\n");
    process.exit(1);
  }

  try {
    console.log("🔄 Verifying contract on Etherscan...");
    console.log("This may take a few moments...\n");

    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
      contract: "contracts/PrivacyPollutionMonitor.sol:PrivacyPollutionMonitor"
    });

    console.log("\n✅ Contract verified successfully!\n");

    // Generate and display Etherscan link
    const explorerUrl = network === "sepolia"
      ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
      : network === "mainnet"
      ? `https://etherscan.io/address/${contractAddress}#code`
      : `Unknown network`;

    console.log("═══════════════════════════════════════");
    console.log(`🔗 View verified contract:`);
    console.log(`   ${explorerUrl}`);
    console.log("═══════════════════════════════════════\n");

    // Update deployment info with verification status
    deploymentInfo.verified = true;
    deploymentInfo.verifiedAt = new Date().toISOString();
    deploymentInfo.verifiedUrl = explorerUrl;

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info updated with verification status\n");

    console.log("🎉 Verification completed successfully!\n");

  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("ℹ️  Contract is already verified on Etherscan!\n");

      const explorerUrl = network === "sepolia"
        ? `https://sepolia.etherscan.io/address/${contractAddress}#code`
        : `https://etherscan.io/address/${contractAddress}#code`;

      console.log(`🔗 View contract: ${explorerUrl}\n`);
      process.exit(0);
    } else {
      console.error("❌ Verification failed:");
      console.error(error.message);
      console.error("\nTroubleshooting:");
      console.error("1. Ensure the contract is deployed and transaction is confirmed");
      console.error("2. Check your ETHERSCAN_API_KEY in .env file");
      console.error("3. Wait a few moments and try again");
      console.error("4. Verify manually using:");
      console.error(`   npx hardhat verify --network ${network} ${contractAddress}\n`);
      process.exit(1);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification process failed:");
    console.error(error);
    process.exit(1);
  });
