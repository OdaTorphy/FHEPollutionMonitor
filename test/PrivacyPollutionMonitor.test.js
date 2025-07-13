const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivacyPollutionMonitor", function () {
  let privacyPollutionMonitor;
  let owner;
  let operator1;
  let operator2;
  let unauthorized;

  beforeEach(async function () {
    [owner, operator1, operator2, unauthorized] = await ethers.getSigners();

    const PrivacyPollutionMonitor = await ethers.getContractFactory("PrivacyPollutionMonitor");
    privacyPollutionMonitor = await PrivacyPollutionMonitor.deploy();
    await privacyPollutionMonitor.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await privacyPollutionMonitor.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero stations and reports", async function () {
      const status = await privacyPollutionMonitor.getCurrentStatus();
      expect(status.totalStations).to.equal(0);
      expect(status.totalReports).to.equal(0);
    });

    it("Should authorize owner as operator", async function () {
      expect(await privacyPollutionMonitor.authorizedOperators(owner.address)).to.be.true;
    });
  });

  describe("Station Registration", function () {
    it("Should register a monitoring station", async function () {
      const location = "Downtown Air Quality Station";

      await expect(privacyPollutionMonitor.registerMonitoringStation(location, operator1.address))
        .to.emit(privacyPollutionMonitor, "StationRegistered")
        .withArgs(1, location, operator1.address);

      const stationInfo = await privacyPollutionMonitor.getStationInfo(1);
      expect(stationInfo.location).to.equal(location);
      expect(stationInfo.operator).to.equal(operator1.address);
      expect(stationInfo.isActive).to.be.true;
    });

    it("Should authorize operator during registration", async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
      expect(await privacyPollutionMonitor.authorizedOperators(operator1.address)).to.be.true;
    });

    it("Should increment station count", async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Station 1", operator1.address);
      await privacyPollutionMonitor.registerMonitoringStation("Station 2", operator2.address);

      const status = await privacyPollutionMonitor.getCurrentStatus();
      expect(status.totalStations).to.equal(2);
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).registerMonitoringStation("Test", operator1.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Pollution Reporting", function () {
    beforeEach(async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
    });

    it("Should submit a pollution report", async function () {
      const stationId = 1;
      const pollutionLevel = 75;
      const pollutantType = 1;
      const severity = 50;

      await expect(
        privacyPollutionMonitor.connect(operator1).submitPollutionReport(
          stationId, pollutionLevel, pollutantType, severity
        )
      ).to.emit(privacyPollutionMonitor, "PollutionReported")
        .withArgs(1, stationId, operator1.address);
    });

    it("Should update station last reading", async function () {
      const pollutionLevel = 85;

      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, pollutionLevel, 1, 60);

      const stationInfo = await privacyPollutionMonitor.getStationInfo(1);
      expect(stationInfo.lastReading).to.equal(pollutionLevel);
    });

    it("Should increment report count", async function () {
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 80, 2, 55);

      const status = await privacyPollutionMonitor.getCurrentStatus();
      expect(status.totalReports).to.equal(2);
    });

    it("Should store report information", async function () {
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 75, 1, 50);

      const reportInfo = await privacyPollutionMonitor.getReportInfo(1);
      expect(reportInfo.stationId).to.equal(1);
      expect(reportInfo.reporter).to.equal(operator1.address);
      expect(reportInfo.isVerified).to.be.false;
    });

    it("Should revert if station doesn't exist", async function () {
      await expect(
        privacyPollutionMonitor.connect(operator1).submitPollutionReport(999, 75, 1, 50)
      ).to.be.revertedWith("Station does not exist");
    });

    it("Should revert if station is inactive", async function () {
      await privacyPollutionMonitor.deactivateStation(1);

      await expect(
        privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 75, 1, 50)
      ).to.be.revertedWith("Station is not active");
    });

    it("Should revert if not authorized operator", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).submitPollutionReport(1, 75, 1, 50)
      ).to.be.revertedWith("Not authorized operator");
    });
  });

  describe("Alert Thresholds", function () {
    it("Should set alert threshold", async function () {
      const pollutantType = 1;
      const criticalLevel = 100;
      const warningLevel = 50;

      await expect(
        privacyPollutionMonitor.setAlertThreshold(pollutantType, criticalLevel, warningLevel)
      ).to.emit(privacyPollutionMonitor, "ThresholdUpdated")
        .withArgs(pollutantType, owner.address);

      const threshold = await privacyPollutionMonitor.pollutantThresholds(pollutantType);
      expect(threshold.criticalLevel).to.equal(criticalLevel);
      expect(threshold.warningLevel).to.equal(warningLevel);
      expect(threshold.isSet).to.be.true;
    });

    it("Should revert if critical level not higher than warning", async function () {
      await expect(
        privacyPollutionMonitor.setAlertThreshold(1, 50, 100)
      ).to.be.revertedWith("Critical level must be higher than warning level");
    });

    it("Should trigger alert when threshold exceeded", async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
      await privacyPollutionMonitor.setAlertThreshold(1, 100, 50);

      await expect(
        privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 120, 1, 80)
      ).to.emit(privacyPollutionMonitor, "AlertTriggered")
        .withArgs(1, 1, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).setAlertThreshold(1, 100, 50)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Report Verification", function () {
    beforeEach(async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 75, 1, 50);
    });

    it("Should verify a report", async function () {
      await expect(privacyPollutionMonitor.verifyReport(1))
        .to.emit(privacyPollutionMonitor, "ReportVerified")
        .withArgs(1, owner.address);

      const reportInfo = await privacyPollutionMonitor.getReportInfo(1);
      expect(reportInfo.isVerified).to.be.true;
    });

    it("Should revert if report doesn't exist", async function () {
      await expect(
        privacyPollutionMonitor.verifyReport(999)
      ).to.be.revertedWith("Report does not exist");
    });

    it("Should revert if already verified", async function () {
      await privacyPollutionMonitor.verifyReport(1);

      await expect(
        privacyPollutionMonitor.verifyReport(1)
      ).to.be.revertedWith("Report already verified");
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).verifyReport(1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Station Management", function () {
    beforeEach(async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
    });

    it("Should deactivate a station", async function () {
      await expect(privacyPollutionMonitor.deactivateStation(1))
        .to.emit(privacyPollutionMonitor, "StationDeactivated")
        .withArgs(1, owner.address);

      const stationInfo = await privacyPollutionMonitor.getStationInfo(1);
      expect(stationInfo.isActive).to.be.false;
    });

    it("Should reactivate a station", async function () {
      await privacyPollutionMonitor.deactivateStation(1);
      await privacyPollutionMonitor.reactivateStation(1);

      const stationInfo = await privacyPollutionMonitor.getStationInfo(1);
      expect(stationInfo.isActive).to.be.true;
    });

    it("Should revert deactivation if not owner", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).deactivateStation(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should revert if station doesn't exist", async function () {
      await expect(
        privacyPollutionMonitor.deactivateStation(999)
      ).to.be.revertedWith("Station does not exist");
    });
  });

  describe("Operator Management", function () {
    it("Should add authorized operator", async function () {
      await privacyPollutionMonitor.addAuthorizedOperator(operator1.address);
      expect(await privacyPollutionMonitor.authorizedOperators(operator1.address)).to.be.true;
    });

    it("Should remove authorized operator", async function () {
      await privacyPollutionMonitor.addAuthorizedOperator(operator1.address);
      await privacyPollutionMonitor.removeAuthorizedOperator(operator1.address);

      expect(await privacyPollutionMonitor.authorizedOperators(operator1.address)).to.be.false;
    });

    it("Should not remove owner as operator", async function () {
      await expect(
        privacyPollutionMonitor.removeAuthorizedOperator(owner.address)
      ).to.be.revertedWith("Cannot remove owner");
    });

    it("Should revert if not called by owner", async function () {
      await expect(
        privacyPollutionMonitor.connect(unauthorized).addAuthorizedOperator(operator1.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await privacyPollutionMonitor.registerMonitoringStation("Test Station", operator1.address);
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 75, 1, 50);
      await privacyPollutionMonitor.connect(operator1).submitPollutionReport(1, 80, 2, 55);
    });

    it("Should get station report IDs", async function () {
      const reportIds = await privacyPollutionMonitor.getStationReportIds(1);
      expect(reportIds.length).to.equal(2);
      expect(reportIds[0]).to.equal(1);
      expect(reportIds[1]).to.equal(2);
    });

    it("Should get current contract status", async function () {
      const status = await privacyPollutionMonitor.getCurrentStatus();
      expect(status.totalStations).to.equal(1);
      expect(status.totalReports).to.equal(2);
      expect(status.contractOwner).to.equal(owner.address);
    });

    it("Should get station information", async function () {
      const info = await privacyPollutionMonitor.getStationInfo(1);
      expect(info.location).to.equal("Test Station");
      expect(info.operator).to.equal(operator1.address);
      expect(info.isActive).to.be.true;
      expect(info.totalReports).to.equal(2);
    });

    it("Should get report information", async function () {
      const info = await privacyPollutionMonitor.getReportInfo(1);
      expect(info.stationId).to.equal(1);
      expect(info.reporter).to.equal(operator1.address);
      expect(info.isVerified).to.be.false;
      expect(info.reportId).to.equal(1);
    });
  });
});
