const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment process...\n");

  // Get network information
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();

  console.log("📋 Deployment Information:");
  console.log("═══════════════════════════════════════");
  console.log(`Network: ${network}`);
  console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("═══════════════════════════════════════\n");

  // Deploy contract
  console.log("📦 Deploying PrivacyPollutionMonitor contract...");
  const PrivacyPollutionMonitor = await hre.ethers.getContractFactory("PrivacyPollutionMonitor");
  const contract = await PrivacyPollutionMonitor.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!\n");

  // Display deployment results
  console.log("📝 Deployment Results:");
  console.log("═══════════════════════════════════════");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Transaction Hash: ${contract.deploymentTransaction().hash}`);
  console.log(`Block Number: ${contract.deploymentTransaction().blockNumber || 'Pending'}`);
  console.log(`Gas Used: ${contract.deploymentTransaction().gasLimit.toString()}`);
  console.log("═══════════════════════════════════════\n");

  // Generate Etherscan link
  const explorerUrl = network === "sepolia"
    ? `https://sepolia.etherscan.io/address/${contractAddress}`
    : network === "mainnet"
    ? `https://etherscan.io/address/${contractAddress}`
    : `Local deployment - No explorer link`;

  console.log(`🔗 Etherscan Link: ${explorerUrl}\n`);

  // Save deployment information
  const deploymentInfo = {
    network: network,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    contractName: "PrivacyPollutionMonitor",
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentHash: contract.deploymentTransaction().hash,
    blockNumber: contract.deploymentTransaction().blockNumber,
    timestamp: new Date().toISOString(),
    explorerUrl: explorerUrl,
    compiler: {
      version: "0.8.24",
      optimizer: true,
      runs: 200
    }
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment info to file
  const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`💾 Deployment info saved to: ${deploymentFile}\n`);

  // Wait for block confirmations before verification
  if (network === "sepolia" || network === "mainnet") {
    console.log("⏳ Waiting for 5 block confirmations before verification...");
    await contract.deploymentTransaction().wait(5);
    console.log("✅ Block confirmations completed!\n");

    console.log("📝 To verify the contract on Etherscan, run:");
    console.log(`   npx hardhat verify --network ${network} ${contractAddress}\n`);
    console.log("   Or use the verify script:");
    console.log(`   npm run verify\n`);
  }

  console.log("🎉 Deployment completed successfully!");
  console.log("═══════════════════════════════════════\n");

  // Display next steps
  console.log("📌 Next Steps:");
  console.log("1. Verify the contract: npm run verify");
  console.log("2. Interact with the contract: npm run interact");
  console.log("3. Run simulation: npm run simulate\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
