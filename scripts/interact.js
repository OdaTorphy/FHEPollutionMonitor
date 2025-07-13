const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function loadContract() {
  const network = hre.network.name;
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentFile = path.join(deploymentsDir, `${network}-deployment.json`);

  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`No deployment found for network: ${network}`);
  }

  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;

  const PrivacyPollutionMonitor = await hre.ethers.getContractFactory("PrivacyPollutionMonitor");
  const contract = PrivacyPollutionMonitor.attach(contractAddress);

  return { contract, contractAddress, network };
}

async function displayMenu() {
  console.log("\n╔═══════════════════════════════════════════════════════╗");
  console.log("║     Privacy Pollution Monitor - Interaction Menu      ║");
  console.log("╚═══════════════════════════════════════════════════════╝\n");
  console.log("1.  Register Monitoring Station");
  console.log("2.  Submit Pollution Report");
  console.log("3.  Set Alert Threshold");
  console.log("4.  Verify Report");
  console.log("5.  Deactivate Station");
  console.log("6.  Reactivate Station");
  console.log("7.  Add Authorized Operator");
  console.log("8.  Remove Authorized Operator");
  console.log("9.  View Station Information");
  console.log("10. View Report Information");
  console.log("11. View Station Report IDs");
  console.log("12. View Current Status");
  console.log("13. View Contract Information");
  console.log("0.  Exit\n");
}

async function registerStation(contract) {
  console.log("\n📍 Register Monitoring Station");
  console.log("═══════════════════════════════════════");

  const location = await question("Enter station location: ");
  const operator = await question("Enter operator address: ");

  console.log("\n⏳ Registering station...");
  const tx = await contract.registerMonitoringStation(location, operator);
  const receipt = await tx.wait();

  const event = receipt.logs.find(log => {
    try {
      return contract.interface.parseLog(log).name === "StationRegistered";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsedEvent = contract.interface.parseLog(event);
    console.log(`\n✅ Station registered successfully!`);
    console.log(`   Station ID: ${parsedEvent.args.stationId}`);
    console.log(`   Location: ${parsedEvent.args.location}`);
    console.log(`   Operator: ${parsedEvent.args.operator}`);
    console.log(`   Transaction: ${receipt.hash}`);
  }
}

async function submitReport(contract) {
  console.log("\n📊 Submit Pollution Report");
  console.log("═══════════════════════════════════════");

  const stationId = await question("Enter station ID: ");
  const pollutionLevel = await question("Enter pollution level (0-1000): ");
  const pollutantType = await question("Enter pollutant type (0-255): ");
  const severity = await question("Enter severity (0-1000): ");

  console.log("\n⏳ Submitting report...");
  const tx = await contract.submitPollutionReport(
    parseInt(stationId),
    parseInt(pollutionLevel),
    parseInt(pollutantType),
    parseInt(severity)
  );
  const receipt = await tx.wait();

  console.log(`\n✅ Report submitted successfully!`);
  console.log(`   Transaction: ${receipt.hash}`);
}

async function setThreshold(contract) {
  console.log("\n⚠️  Set Alert Threshold");
  console.log("═══════════════════════════════════════");

  const pollutantType = await question("Enter pollutant type (0-255): ");
  const criticalLevel = await question("Enter critical level: ");
  const warningLevel = await question("Enter warning level: ");

  console.log("\n⏳ Setting threshold...");
  const tx = await contract.setAlertThreshold(
    parseInt(pollutantType),
    parseInt(criticalLevel),
    parseInt(warningLevel)
  );
  const receipt = await tx.wait();

  console.log(`\n✅ Threshold set successfully!`);
  console.log(`   Transaction: ${receipt.hash}`);
}

async function verifyReport(contract) {
  console.log("\n✓ Verify Report");
  console.log("═══════════════════════════════════════");

  const reportId = await question("Enter report ID: ");

  console.log("\n⏳ Verifying report...");
  const tx = await contract.verifyReport(parseInt(reportId));
  const receipt = await tx.wait();

  console.log(`\n✅ Report verified successfully!`);
  console.log(`   Transaction: ${receipt.hash}`);
}

async function viewStationInfo(contract) {
  console.log("\n📍 View Station Information");
  console.log("═══════════════════════════════════════");

  const stationId = await question("Enter station ID: ");

  const info = await contract.getStationInfo(parseInt(stationId));

  console.log("\n📋 Station Details:");
  console.log(`   Location: ${info.location}`);
  console.log(`   Operator: ${info.operator}`);
  console.log(`   Active: ${info.isActive}`);
  console.log(`   Registration Time: ${new Date(Number(info.registrationTime) * 1000).toLocaleString()}`);
  console.log(`   Last Update: ${new Date(Number(info.lastUpdateTime) * 1000).toLocaleString()}`);
  console.log(`   Total Reports: ${info.totalReports}`);
}

async function viewReportInfo(contract) {
  console.log("\n📊 View Report Information");
  console.log("═══════════════════════════════════════");

  const reportId = await question("Enter report ID: ");

  const info = await contract.getReportInfo(parseInt(reportId));

  console.log("\n📋 Report Details:");
  console.log(`   Report ID: ${info.reportId}`);
  console.log(`   Station ID: ${info.stationId}`);
  console.log(`   Reporter: ${info.reporter}`);
  console.log(`   Timestamp: ${new Date(Number(info.timestamp) * 1000).toLocaleString()}`);
  console.log(`   Verified: ${info.isVerified}`);
}

async function viewCurrentStatus(contract) {
  console.log("\n📊 Current Contract Status");
  console.log("═══════════════════════════════════════");

  const status = await contract.getCurrentStatus();

  console.log(`   Total Stations: ${status.totalStations}`);
  console.log(`   Total Reports: ${status.totalReports}`);
  console.log(`   Contract Owner: ${status.contractOwner}`);
}

async function viewContractInfo(contract, contractAddress, network) {
  console.log("\n📝 Contract Information");
  console.log("═══════════════════════════════════════");
  console.log(`   Network: ${network}`);
  console.log(`   Contract Address: ${contractAddress}`);

  const explorerUrl = network === "sepolia"
    ? `https://sepolia.etherscan.io/address/${contractAddress}`
    : `Local deployment`;

  console.log(`   Explorer: ${explorerUrl}`);
}

async function main() {
  console.log("🔄 Loading contract...\n");

  const { contract, contractAddress, network } = await loadContract();
  const [signer] = await hre.ethers.getSigners();

  console.log("✅ Contract loaded successfully!");
  console.log(`   Network: ${network}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Your Address: ${signer.address}\n`);

  let exit = false;

  while (!exit) {
    await displayMenu();
    const choice = await question("Select an option: ");

    try {
      switch (choice.trim()) {
        case "1":
          await registerStation(contract);
          break;
        case "2":
          await submitReport(contract);
          break;
        case "3":
          await setThreshold(contract);
          break;
        case "4":
          await verifyReport(contract);
          break;
        case "5":
          const stationId5 = await question("Enter station ID to deactivate: ");
          const tx5 = await contract.deactivateStation(parseInt(stationId5));
          await tx5.wait();
          console.log("✅ Station deactivated!");
          break;
        case "6":
          const stationId6 = await question("Enter station ID to reactivate: ");
          const tx6 = await contract.reactivateStation(parseInt(stationId6));
          await tx6.wait();
          console.log("✅ Station reactivated!");
          break;
        case "7":
          const operator7 = await question("Enter operator address to add: ");
          const tx7 = await contract.addAuthorizedOperator(operator7);
          await tx7.wait();
          console.log("✅ Operator authorized!");
          break;
        case "8":
          const operator8 = await question("Enter operator address to remove: ");
          const tx8 = await contract.removeAuthorizedOperator(operator8);
          await tx8.wait();
          console.log("✅ Operator removed!");
          break;
        case "9":
          await viewStationInfo(contract);
          break;
        case "10":
          await viewReportInfo(contract);
          break;
        case "11":
          const stationId11 = await question("Enter station ID: ");
          const reports = await contract.getStationReportIds(parseInt(stationId11));
          console.log(`\n📋 Report IDs: ${reports.join(", ")}`);
          break;
        case "12":
          await viewCurrentStatus(contract);
          break;
        case "13":
          await viewContractInfo(contract, contractAddress, network);
          break;
        case "0":
          exit = true;
          console.log("\n👋 Goodbye!\n");
          break;
        default:
          console.log("\n❌ Invalid option. Please try again.");
      }
    } catch (error) {
      console.error("\n❌ Error:", error.message);
    }
  }

  rl.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:");
    console.error(error);
    rl.close();
    process.exit(1);
  });
