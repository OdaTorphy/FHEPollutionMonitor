const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

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

async function simulateFullWorkflow() {
  console.log("🎬 Starting Full Workflow Simulation");
  console.log("═══════════════════════════════════════════════════════\n");

  const { contract, contractAddress, network } = await loadContract();
  const [owner, operator1, operator2] = await hre.ethers.getSigners();

  console.log("📋 Simulation Information:");
  console.log(`   Network: ${network}`);
  console.log(`   Contract: ${contractAddress}`);
  console.log(`   Owner: ${owner.address}`);
  console.log(`   Operator 1: ${operator1.address}`);
  console.log(`   Operator 2: ${operator2.address}\n`);

  // Step 1: Register monitoring stations
  console.log("📍 Step 1: Registering Monitoring Stations");
  console.log("─────────────────────────────────────────");

  const stations = [
    { location: "Downtown Air Quality Station", operator: operator1.address },
    { location: "Industrial Zone Monitor", operator: operator2.address },
    { location: "Residential Area Sensor", operator: operator1.address }
  ];

  const stationIds = [];

  for (const station of stations) {
    const tx = await contract.registerMonitoringStation(station.location, station.operator);
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
      const stationId = Number(parsedEvent.args.stationId);
      stationIds.push(stationId);
      console.log(`✅ Registered: ${station.location}`);
      console.log(`   Station ID: ${stationId}`);
      console.log(`   Operator: ${station.operator}\n`);
    }
  }

  // Step 2: Set alert thresholds
  console.log("⚠️  Step 2: Setting Alert Thresholds");
  console.log("─────────────────────────────────────────");

  const thresholds = [
    { type: 1, name: "PM2.5", warning: 50, critical: 100 },
    { type: 2, name: "PM10", warning: 100, critical: 200 },
    { type: 3, name: "CO2", warning: 800, critical: 1000 },
    { type: 4, name: "NO2", warning: 40, critical: 80 }
  ];

  for (const threshold of thresholds) {
    const tx = await contract.setAlertThreshold(threshold.type, threshold.critical, threshold.warning);
    await tx.wait();
    console.log(`✅ Set threshold for ${threshold.name}:`);
    console.log(`   Warning: ${threshold.warning}, Critical: ${threshold.critical}\n`);
  }

  // Step 3: Submit pollution reports
  console.log("📊 Step 3: Submitting Pollution Reports");
  console.log("─────────────────────────────────────────");

  const reports = [
    { stationId: stationIds[0], level: 45, type: 1, severity: 30, desc: "Normal PM2.5 levels" },
    { stationId: stationIds[1], level: 120, type: 1, severity: 80, desc: "High PM2.5 - Alert triggered" },
    { stationId: stationIds[0], level: 95, type: 2, severity: 60, desc: "Moderate PM10 levels" },
    { stationId: stationIds[2], level: 850, type: 3, severity: 70, desc: "Elevated CO2 - Warning triggered" },
    { stationId: stationIds[1], level: 90, type: 4, severity: 85, desc: "Critical NO2 - Alert triggered" }
  ];

  const reportIds = [];

  for (let i = 0; i < reports.length; i++) {
    const report = reports[i];
    const operatorContract = i % 2 === 0 ? contract.connect(operator1) : contract.connect(operator2);

    const tx = await operatorContract.submitPollutionReport(
      report.stationId,
      report.level,
      report.type,
      report.severity
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === "PollutionReported";
      } catch (e) {
        return false;
      }
    });

    if (event) {
      const parsedEvent = contract.interface.parseLog(event);
      const reportId = Number(parsedEvent.args.reportId);
      reportIds.push(reportId);
      console.log(`✅ Report #${reportId}: ${report.desc}`);
      console.log(`   Station: ${report.stationId}, Level: ${report.level}, Type: ${report.type}\n`);
    }
  }

  // Step 4: Verify reports
  console.log("✓ Step 4: Verifying Reports");
  console.log("─────────────────────────────────────────");

  for (const reportId of reportIds.slice(0, 3)) {
    const tx = await contract.verifyReport(reportId);
    await tx.wait();
    console.log(`✅ Verified report #${reportId}\n`);
  }

  // Step 5: View station information
  console.log("📍 Step 5: Viewing Station Information");
  console.log("─────────────────────────────────────────");

  for (const stationId of stationIds) {
    const info = await contract.getStationInfo(stationId);
    console.log(`Station ID ${stationId}:`);
    console.log(`   Location: ${info.location}`);
    console.log(`   Operator: ${info.operator}`);
    console.log(`   Active: ${info.isActive}`);
    console.log(`   Total Reports: ${info.totalReports}\n`);
  }

  // Step 6: View current status
  console.log("📊 Step 6: Current Contract Status");
  console.log("─────────────────────────────────────────");

  const status = await contract.getCurrentStatus();
  console.log(`   Total Stations: ${status.totalStations}`);
  console.log(`   Total Reports: ${status.totalReports}`);
  console.log(`   Contract Owner: ${status.contractOwner}\n`);

  // Step 7: Deactivate a station
  console.log("🔴 Step 7: Deactivating Station");
  console.log("─────────────────────────────────────────");

  const tx = await contract.deactivateStation(stationIds[2]);
  await tx.wait();
  console.log(`✅ Deactivated Station ID ${stationIds[2]}\n`);

  // Verify deactivation
  const deactivatedInfo = await contract.getStationInfo(stationIds[2]);
  console.log(`   Station ${stationIds[2]} Status: ${deactivatedInfo.isActive ? "Active" : "Inactive"}\n`);

  // Final Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("🎉 Simulation Completed Successfully!");
  console.log("═══════════════════════════════════════════════════════\n");

  console.log("📊 Simulation Summary:");
  console.log(`   ✅ Registered ${stationIds.length} monitoring stations`);
  console.log(`   ✅ Set ${thresholds.length} alert thresholds`);
  console.log(`   ✅ Submitted ${reports.length} pollution reports`);
  console.log(`   ✅ Verified ${reportIds.slice(0, 3).length} reports`);
  console.log(`   ✅ Deactivated 1 station\n`);

  // Generate report file
  const simulationReport = {
    network: network,
    contractAddress: contractAddress,
    timestamp: new Date().toISOString(),
    stations: stationIds,
    reports: reportIds,
    thresholds: thresholds,
    summary: {
      totalStations: Number(status.totalStations),
      totalReports: Number(status.totalReports),
      verifiedReports: reportIds.slice(0, 3).length
    }
  };

  const reportsDir = path.join(__dirname, "..", "simulation-reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportFile = path.join(reportsDir, `simulation-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(simulationReport, null, 2));

  console.log(`💾 Simulation report saved to: ${reportFile}\n`);
}

async function main() {
  try {
    await simulateFullWorkflow();
  } catch (error) {
    console.error("\n❌ Simulation failed:");
    console.error(error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Fatal error:");
    console.error(error);
    process.exit(1);
  });
