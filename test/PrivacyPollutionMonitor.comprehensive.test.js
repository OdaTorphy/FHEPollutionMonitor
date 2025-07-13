const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PrivacyPollutionMonitor - Comprehensive Test Suite", function () {
  // Fixture for contract deployment
  async function deployContractFixture() {
    const [owner, operator1, operator2, operator3, unauthorized] = await ethers.getSigners();

    const PrivacyPollutionMonitor = await ethers.getContractFactory("PrivacyPollutionMonitor");
    const contract = await PrivacyPollutionMonitor.deploy();
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    return { contract, contractAddress, owner, operator1, operator2, operator3, unauthorized };
  }

  describe("1. Deployment and Initialization (5 tests)", function () {
    it("Should deploy successfully with valid address", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should set the deployer as owner", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize totalMonitoringStations to zero", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.totalMonitoringStations()).to.equal(0);
    });

    it("Should initialize currentReportId to zero", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.currentReportId()).to.equal(0);
    });

    it("Should authorize owner as operator automatically", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);
      expect(await contract.authorizedOperators(owner.address)).to.be.true;
    });
  });

  describe("2. Station Registration (8 tests)", function () {
    it("Should register a new monitoring station", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);
      const location = "Downtown Air Quality Station";

      await expect(contract.registerMonitoringStation(location, operator1.address))
        .to.emit(contract, "StationRegistered")
        .withArgs(1, location, operator1.address);
    });

    it("Should store station information correctly", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);
      const location = "Industrial Zone Monitor";

      await contract.registerMonitoringStation(location, operator1.address);

      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.location).to.equal(location);
      expect(stationInfo.operator).to.equal(operator1.address);
      expect(stationInfo.isActive).to.be.true;
      expect(stationInfo.totalReports).to.equal(0);
    });

    it("Should increment station count correctly", async function () {
      const { contract, operator1, operator2 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Station 1", operator1.address);
      expect(await contract.totalMonitoringStations()).to.equal(1);

      await contract.registerMonitoringStation("Station 2", operator2.address);
      expect(await contract.totalMonitoringStations()).to.equal(2);
    });

    it("Should authorize operator during station registration", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      expect(await contract.authorizedOperators(operator1.address)).to.be.false;

      await contract.registerMonitoringStation("Test Station", operator1.address);

      expect(await contract.authorizedOperators(operator1.address)).to.be.true;
    });

    it("Should allow registering multiple stations with same operator", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Station 1", operator1.address);
      await contract.registerMonitoringStation("Station 2", operator1.address);

      expect(await contract.totalMonitoringStations()).to.equal(2);
    });

    it("Should allow registering stations with different operators", async function () {
      const { contract, operator1, operator2, operator3 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Station 1", operator1.address);
      await contract.registerMonitoringStation("Station 2", operator2.address);
      await contract.registerMonitoringStation("Station 3", operator3.address);

      expect(await contract.totalMonitoringStations()).to.equal(3);
    });

    it("Should revert when non-owner tries to register station", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await expect(
        contract.connect(unauthorized).registerMonitoringStation("Unauthorized Station", operator1.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should set registration timestamp correctly", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      const stationInfo = await contract.getStationInfo(1);
      const blockTimestamp = (await ethers.provider.getBlock("latest")).timestamp;

      expect(Number(stationInfo.registrationTime)).to.be.closeTo(blockTimestamp, 5);
    });
  });

  describe("3. Pollution Reporting (10 tests)", function () {
    it("Should submit pollution report successfully", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 75, 1, 50)
      ).to.emit(contract, "PollutionReported")
        .withArgs(1, 1, operator1.address);
    });

    it("Should increment report ID for each report", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      expect(await contract.currentReportId()).to.equal(1);

      await contract.connect(operator1).submitPollutionReport(1, 80, 2, 55);
      expect(await contract.currentReportId()).to.equal(2);
    });

    it("Should update station's last reading", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 123, 1, 50);

      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.lastReading).to.equal(123);
    });

    it("Should store report information correctly", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      const reportInfo = await contract.getReportInfo(1);
      expect(reportInfo.stationId).to.equal(1);
      expect(reportInfo.reporter).to.equal(operator1.address);
      expect(reportInfo.isVerified).to.be.false;
      expect(reportInfo.reportId).to.equal(1);
    });

    it("Should add report ID to station's report list", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      await contract.connect(operator1).submitPollutionReport(1, 80, 2, 55);

      const reportIds = await contract.getStationReportIds(1);
      expect(reportIds.length).to.equal(2);
      expect(reportIds[0]).to.equal(1);
      expect(reportIds[1]).to.equal(2);
    });

    it("Should allow owner to submit reports", async function () {
      const { contract, owner, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(owner).submitPollutionReport(1, 75, 1, 50)
      ).to.not.be.reverted;
    });

    it("Should allow authorized operator to submit reports", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 75, 1, 50)
      ).to.not.be.reverted;
    });

    it("Should revert when unauthorized user tries to submit report", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(unauthorized).submitPollutionReport(1, 75, 1, 50)
      ).to.be.revertedWith("Not authorized operator");
    });

    it("Should revert when station does not exist", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(operator1).submitPollutionReport(999, 75, 1, 50)
      ).to.be.revertedWith("Station does not exist");
    });

    it("Should revert when station is not active", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.deactivateStation(1);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 75, 1, 50)
      ).to.be.revertedWith("Station is not active");
    });
  });

  describe("4. Alert Threshold Management (7 tests)", function () {
    it("Should set alert threshold successfully", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.setAlertThreshold(1, 100, 50)
      ).to.emit(contract, "ThresholdUpdated")
        .withArgs(1, await contract.owner());
    });

    it("Should store threshold values correctly", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await contract.setAlertThreshold(1, 100, 50);

      const threshold = await contract.pollutantThresholds(1);
      expect(threshold.criticalLevel).to.equal(100);
      expect(threshold.warningLevel).to.equal(50);
      expect(threshold.isSet).to.be.true;
    });

    it("Should allow setting thresholds for multiple pollutant types", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await contract.setAlertThreshold(1, 100, 50);
      await contract.setAlertThreshold(2, 200, 100);
      await contract.setAlertThreshold(3, 1000, 800);

      expect((await contract.pollutantThresholds(1)).criticalLevel).to.equal(100);
      expect((await contract.pollutantThresholds(2)).criticalLevel).to.equal(200);
      expect((await contract.pollutantThresholds(3)).criticalLevel).to.equal(1000);
    });

    it("Should allow updating existing thresholds", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await contract.setAlertThreshold(1, 100, 50);
      await contract.setAlertThreshold(1, 150, 75);

      const threshold = await contract.pollutantThresholds(1);
      expect(threshold.criticalLevel).to.equal(150);
      expect(threshold.warningLevel).to.equal(75);
    });

    it("Should revert when critical level is not higher than warning level", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.setAlertThreshold(1, 50, 100)
      ).to.be.revertedWith("Critical level must be higher than warning level");
    });

    it("Should revert when critical level equals warning level", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.setAlertThreshold(1, 100, 100)
      ).to.be.revertedWith("Critical level must be higher than warning level");
    });

    it("Should revert when non-owner tries to set threshold", async function () {
      const { contract, unauthorized } = await loadFixture(deployContractFixture);

      await expect(
        contract.connect(unauthorized).setAlertThreshold(1, 100, 50)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("5. Alert Triggering (5 tests)", function () {
    it("Should trigger alert when pollution exceeds critical level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.setAlertThreshold(1, 100, 50);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 120, 1, 80)
      ).to.emit(contract, "AlertTriggered");
    });

    it("Should trigger alert when pollution equals critical level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.setAlertThreshold(1, 100, 50);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 100, 1, 80)
      ).to.emit(contract, "AlertTriggered");
    });

    it("Should trigger alert when pollution exceeds warning level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.setAlertThreshold(1, 100, 50);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 60, 1, 40)
      ).to.emit(contract, "AlertTriggered");
    });

    it("Should not trigger alert when pollution below warning level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.setAlertThreshold(1, 100, 50);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 30, 1, 20)
      ).to.not.emit(contract, "AlertTriggered");
    });

    it("Should not trigger alert when threshold not set", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 500, 1, 300)
      ).to.not.emit(contract, "AlertTriggered");
    });
  });

  describe("6. Report Verification (5 tests)", function () {
    it("Should verify report successfully", async function () {
      const { contract, owner, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      await expect(contract.verifyReport(1))
        .to.emit(contract, "ReportVerified")
        .withArgs(1, owner.address);
    });

    it("Should mark report as verified", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      await contract.verifyReport(1);

      const reportInfo = await contract.getReportInfo(1);
      expect(reportInfo.isVerified).to.be.true;
    });

    it("Should revert when report does not exist", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.verifyReport(999)
      ).to.be.revertedWith("Report does not exist");
    });

    it("Should revert when report already verified", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      await contract.verifyReport(1);

      await expect(
        contract.verifyReport(1)
      ).to.be.revertedWith("Report already verified");
    });

    it("Should revert when non-owner tries to verify", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      await expect(
        contract.connect(unauthorized).verifyReport(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("7. Station Management (5 tests)", function () {
    it("Should deactivate station successfully", async function () {
      const { contract, owner, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(contract.deactivateStation(1))
        .to.emit(contract, "StationDeactivated")
        .withArgs(1, owner.address);

      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.isActive).to.be.false;
    });

    it("Should reactivate station successfully", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.deactivateStation(1);
      await contract.reactivateStation(1);

      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.isActive).to.be.true;
    });

    it("Should revert deactivation if station does not exist", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.deactivateStation(999)
      ).to.be.revertedWith("Station does not exist");
    });

    it("Should revert if non-owner tries to deactivate", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(unauthorized).deactivateStation(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert if non-owner tries to reactivate", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.deactivateStation(1);

      await expect(
        contract.connect(unauthorized).reactivateStation(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("8. Operator Management (6 tests)", function () {
    it("Should add authorized operator successfully", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.addAuthorizedOperator(operator1.address);

      expect(await contract.authorizedOperators(operator1.address)).to.be.true;
    });

    it("Should remove authorized operator successfully", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.addAuthorizedOperator(operator1.address);
      await contract.removeAuthorizedOperator(operator1.address);

      expect(await contract.authorizedOperators(operator1.address)).to.be.false;
    });

    it("Should not allow removing owner as operator", async function () {
      const { contract, owner } = await loadFixture(deployContractFixture);

      await expect(
        contract.removeAuthorizedOperator(owner.address)
      ).to.be.revertedWith("Cannot remove owner");
    });

    it("Should allow adding multiple operators", async function () {
      const { contract, operator1, operator2, operator3 } = await loadFixture(deployContractFixture);

      await contract.addAuthorizedOperator(operator1.address);
      await contract.addAuthorizedOperator(operator2.address);
      await contract.addAuthorizedOperator(operator3.address);

      expect(await contract.authorizedOperators(operator1.address)).to.be.true;
      expect(await contract.authorizedOperators(operator2.address)).to.be.true;
      expect(await contract.authorizedOperators(operator3.address)).to.be.true;
    });

    it("Should revert when non-owner tries to add operator", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await expect(
        contract.connect(unauthorized).addAuthorizedOperator(operator1.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert when non-owner tries to remove operator", async function () {
      const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

      await contract.addAuthorizedOperator(operator1.address);

      await expect(
        contract.connect(unauthorized).removeAuthorizedOperator(operator1.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("9. View Functions (4 tests)", function () {
    it("Should return correct current status", async function () {
      const { contract, owner, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Station 1", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      const status = await contract.getCurrentStatus();
      expect(status.totalStations).to.equal(1);
      expect(status.totalReports).to.equal(1);
      expect(status.contractOwner).to.equal(owner.address);
    });

    it("Should return station report IDs correctly", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);
      await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      await contract.connect(operator1).submitPollutionReport(1, 80, 2, 55);
      await contract.connect(operator1).submitPollutionReport(1, 85, 3, 60);

      const reportIds = await contract.getStationReportIds(1);
      expect(reportIds.length).to.equal(3);
      expect(reportIds[0]).to.equal(1);
      expect(reportIds[1]).to.equal(2);
      expect(reportIds[2]).to.equal(3);
    });

    it("Should return empty array for station with no reports", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      const reportIds = await contract.getStationReportIds(1);
      expect(reportIds.length).to.equal(0);
    });

    it("Should revert when querying non-existent station", async function () {
      const { contract } = await loadFixture(deployContractFixture);

      await expect(
        contract.getStationInfo(999)
      ).to.be.revertedWith("Station does not exist");
    });
  });

  describe("10. Edge Cases (3 tests)", function () {
    it("Should handle maximum uint32 pollution level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      const maxUint32 = 4294967295;
      await expect(
        contract.connect(operator1).submitPollutionReport(1, maxUint32, 1, 50)
      ).to.not.be.reverted;
    });

    it("Should handle zero pollution level", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      await expect(
        contract.connect(operator1).submitPollutionReport(1, 0, 1, 0)
      ).to.not.be.reverted;
    });

    it("Should handle maximum uint8 pollutant type", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      await contract.registerMonitoringStation("Test Station", operator1.address);

      const maxUint8 = 255;
      await expect(
        contract.connect(operator1).submitPollutionReport(1, 100, maxUint8, 50)
      ).to.not.be.reverted;
    });
  });
});
