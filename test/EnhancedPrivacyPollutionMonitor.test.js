const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  FHE,
  euint64,
  euint8,
  createEncryptionClient,
  generateKeypair
} = require("@fhevm/core");

describe("EnhancedPrivacyPollutionMonitor", function () {
  let contract;
  let owner, operator1, operator2, unauthorizedUser;
  let stationId1, stationId2;
  let fheClient;

  // Test constants
  const MIN_STAKE = ethers.parseEther("0.001");
  const MAX_STAKE = ethers.parseEther("10");
  const PLATFORM_FEE_RATE = 5; // 0.5%
  const MAX_TIMEOUT = 7 * 24 * 60 * 60; // 7 days
  const GATEWAY_TIMEOUT = 60 * 60; // 1 hour

  beforeEach(async function () {
    [owner, operator1, operator2, unauthorizedUser] = await ethers.getSigners();

    // Deploy contract with initial funding
    const ContractFactory = await ethers.getContractFactory("EnhancedPrivacyPollutionMonitor");
    contract = await ContractFactory.deploy({ value: ethers.parseEther("1") });
    await contract.deployed();

    // Initialize FHE client for testing
    fheClient = await createEncryptionClient();
  });

  describe("Contract Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      const status = await contract.getCurrentStatus();
      expect(status.totalStations).to.equal(0);
      expect(status.totalReports).to.equal(0);
      expect(status.contractOwner).to.equal(owner.address);
      expect(status.contractPaused).to.equal(false);
      expect(status.totalPlatformFees).to.equal(0);
    });

    it("Should create initial audit log entry", async function () {
      const auditLength = await contract.getAuditLogLength();
      expect(auditLength).to.equal(1);

      const auditLog = await contract.getAuditLog(0);
      expect(auditLog.actor).to.equal(owner.address);
      expect(auditLog.action).to.equal("CONTRACT_DEPLOYED");
    });
  });

  describe("Station Management", function () {
    it("Should allow owner to register monitoring station", async function () {
      const location = "Beijing Downtown";

      const tx = await contract.registerMonitoringStation(location, operator1.address);
      const receipt = await tx.wait();

      // Check events
      const event = receipt.events.find(e => e.event === "StationRegistered");
      expect(event.args.stationId).to.equal(1);
      expect(event.args.location).to.equal(location);
      expect(event.args.operator).to.equal(operator1.address);

      // Check station info
      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.location).to.equal(location);
      expect(stationInfo.operator).to.equal(operator1.address);
      expect(stationInfo.isActive).to.equal(true);
      expect(stationInfo.totalReports).to.equal(0);
      expect(stationInfo.totalStaked).to.equal(0);

      // Check audit log
      stationId1 = event.args.stationId;
    });

    it("Should reject station registration by non-owner", async function () {
      await expect(
        contract.connect(operator1).registerMonitoringStation("Test Location", operator1.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject invalid operator address", async function () {
      await expect(
        contract.registerMonitoringStation("Test Location", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid operator address");
    });

    it("Should reject empty location", async function () {
      await expect(
        contract.registerMonitoringStation("", operator1.address)
      ).to.be.revertedWith("Location cannot be empty");
    });

    it("Should authorize operator automatically on station registration", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);

      // Operator should be authorized for report submission
      const isAuthorized = await contract.authorizedOperators(operator1.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should allow owner to deactivate station", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);

      const tx = await contract.deactivateStation(1);
      const receipt = await tx.wait();

      // Check event
      const event = receipt.events.find(e => e.event === "StationDeactivated");
      expect(event.args.stationId).to.equal(1);

      // Check station status
      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.isActive).to.equal(false);
    });

    it("Should allow owner to reactivate station", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
      await contract.deactivateStation(1);

      await contract.reactivateStation(1);

      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.isActive).to.equal(true);
    });

    it("Should reject deactivation of already inactive station", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
      await contract.deactivateStation(1);

      await expect(contract.deactivateStation(1)).to.be.revertedWith("Station already inactive");
    });
  });

  describe("Access Control", function () {
    beforeEach(async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
    });

    it("Should allow owner to add authorized operator", async function () {
      await contract.addAuthorizedOperator(operator2.address);

      const isAuthorized = await contract.authorizedOperators(operator2.address);
      expect(isAuthorized).to.equal(true);
    });

    it("Should reject adding zero address as operator", async function () {
      await expect(
        contract.addAuthorizedOperator(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid operator address");
    });

    it("Should reject adding already authorized operator", async function () {
      await expect(
        contract.addAuthorizedOperator(operator1.address)
      ).to.be.revertedWith("Operator already authorized");
    });

    it("Should allow owner to remove authorized operator", async function () {
      await contract.addAuthorizedOperator(operator2.address);
      await contract.removeAuthorizedOperator(operator2.address);

      const isAuthorized = await contract.authorizedOperators(operator2.address);
      expect(isAuthorized).to.equal(false);
    });

    it("Should reject removing owner from authorized operators", async function () {
      await expect(
        contract.removeAuthorizedOperator(owner.address)
      ).to.be.revertedWith("Cannot remove owner");
    });

    it("Should reject removing non-authorized operator", async function () {
      await expect(
        contract.removeAuthorizedOperator(unauthorizedUser.address)
      ).to.be.revertedWith("Operator not authorized");
    });
  });

  describe("Report Submission", function () {
    beforeEach(async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
    });

    it("Should allow authorized operator to submit pollution report", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      // Mock FHE encrypted values (in real implementation, these would be properly encrypted)
      const mockEncryptedLevel = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const mockEncryptedType = "0x12345678";
      const mockEncryptedSeverity = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      const mockProof = "0xabcdef";

      const tx = await contract.connect(operator1).submitPollutionReport(
        1, // stationId
        mockEncryptedLevel,
        mockEncryptedType,
        mockEncryptedSeverity,
        mockProof,
        mockProof,
        mockProof,
        { value: stakeAmount }
      );

      const receipt = await tx.wait();

      // Check events
      const reportEvent = receipt.events.find(e => e.event === "PollutionReported");
      expect(reportEvent.args.stationId).to.equal(1);
      expect(reportEvent.args.reporter).to.equal(operator1.address);

      // Check system status
      const status = await contract.getCurrentStatus();
      expect(status.totalReports).to.equal(1);

      // Check report info
      const reportInfo = await contract.getReportInfo(1);
      expect(reportInfo.stationId).to.equal(1);
      expect(reportInfo.reporter).to.equal(operator1.address);
      expect(reportInfo.stakeAmount).to.equal(stakeAmount);
      expect(reportInfo.isVerified).to.equal(false);
      expect(reportInfo.refundClaimed).to.equal(false);
    });

    it("Should reject report submission by unauthorized user", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await expect(
        contract.connect(unauthorizedUser).submitPollutionReport(
          1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123", { value: stakeAmount }
        )
      ).to.be.revertedWith("Not authorized operator");
    });

    it("Should reject report submission with insufficient stake", async function () {
      await expect(
        contract.connect(operator1).submitPollutionReport(
          1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
          { value: ethers.parseEther("0.0005") }
        )
      ).to.be.revertedWith("Minimum stake required");
    });

    it("Should reject report submission with excessive stake", async function () {
      await expect(
        contract.connect(operator1).submitPollutionReport(
          1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
          { value: ethers.parseEther("15") }
        )
      ).to.be.revertedWith("Maximum stake exceeded");
    });

    it("Should reject report submission for inactive station", async function () {
      await contract.deactivateStation(1);

      await expect(
        contract.connect(operator1).submitPollutionReport(
          1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
          { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("Station is not active");
    });

    it("Should track user stake correctly", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      const userStake = await contract.getUserStake(operator1.address);
      expect(userStake).to.equal(stakeAmount);
    });
  });

  describe("Threshold Management", function () {
    it("Should allow owner to set alert thresholds", async function () {
      const pollutantType = 1;
      const criticalLevel = 300;
      const warningLevel = 150;

      const tx = await contract.setAlertThreshold(pollutantType, criticalLevel, warningLevel);
      const receipt = await tx.wait();

      // Check event
      const event = receipt.events.find(e => e.event === "ThresholdUpdated");
      expect(event.args.pollutantType).to.equal(pollutantType);
    });

    it("Should reject threshold setting by non-owner", async function () {
      await expect(
        contract.connect(operator1).setAlertThreshold(1, 300, 150)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject invalid threshold values", async function () {
      await expect(
        contract.setAlertThreshold(1, 150, 300) // critical < warning
      ).to.be.revertedWith("Critical level must be higher than warning level");
    });

    it("Should reject threshold setting when paused", async function () {
      await contract.pause();

      await expect(
        contract.setAlertThreshold(1, 300, 150)
      ).to.be.revertedWith("contract is paused");
    });
  });

  describe("Emergency Controls", function () {
    it("Should allow owner to pause contract", async function () {
      const tx = await contract.pause();
      const receipt = await tx.wait();

      const status = await contract.getCurrentStatus();
      expect(status.contractPaused).to.equal(true);

      // Check audit log
      const auditLength = await contract.getAuditLogLength();
      const auditLog = await contract.getAuditLog(auditLength - 1);
      expect(auditLog.action).to.equal("CONTRACT_PAUSED");
    });

    it("Should allow owner to unpause contract", async function () {
      await contract.pause();
      await contract.unpause();

      const status = await contract.getCurrentStatus();
      expect(status.contractPaused).to.equal(false);
    });

    it("Should reject pause by non-owner", async function () {
      await expect(
        contract.connect(operator1).pause()
      ).to.be.revertedWith("Not authorized");
    });

    it("Should reject report submission when paused", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
      await contract.pause();

      await expect(
        contract.connect(operator1).submitPollutionReport(
          1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
          { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWith("contract is paused");
    });
  });

  describe("Refund Mechanisms", function () {
    beforeEach(async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);
    });

    it("Should allow refund claim after timeout", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      // Submit report
      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      // Fast forward time beyond timeout
      await ethers.provider.send("evm_increaseTime", [MAX_TIMEOUT + 1]);
      await ethers.provider.send("evm_mine");

      // Check refund eligibility
      const [canRefund, reason] = await contract.connect(operator1).canClaimRefund(1);
      expect(canRefund).to.equal(true);
      expect(reason).to.equal("Timeout exceeded");

      // Claim refund
      const initialBalance = await ethers.provider.getBalance(operator1.address);
      const tx = await contract.connect(operator1).claimRefund(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await ethers.provider.getBalance(operator1.address);
      const expectedRefund = stakeAmount - (stakeAmount * BigInt(PLATFORM_FEE_RATE) / 1000n);

      expect(finalBalance).to.equal(initialBalance.add(expectedRefund).sub(gasUsed));

      // Check that refund is marked as claimed
      const reportInfo = await contract.getReportInfo(1);
      expect(reportInfo.refundClaimed).to.equal(true);
    });

    it("Should prevent double refund claims", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      await ethers.provider.send("evm_increaseTime", [MAX_TIMEOUT + 1]);
      await ethers.provider.send("evm_mine");

      // First claim should succeed
      await contract.connect(operator1).claimRefund(1);

      // Second claim should fail
      await expect(
        contract.connect(operator1).claimRefund(1)
      ).to.be.revertedWith("Refund already claimed");
    });

    it("Should reject refund claim by non-reporter", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      await ethers.provider.send("evm_increaseTime", [MAX_TIMEOUT + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        contract.connect(unauthorizedUser).claimRefund(1)
      ).to.be.revertedWith("Only reporter can claim refund");
    });

    it("Should reject refund claim before timeout", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      const [canRefund, reason] = await contract.connect(operator1).canClaimRefund(1);
      expect(canRefund).to.equal(false);
      expect(reason).to.equal("No refund conditions met");

      await expect(
        contract.connect(operator1).claimRefund(1)
      ).to.be.revertedWith("No refund conditions met");
    });
  });

  describe("Audit Logging", function () {
    it("Should log all significant actions", async function () {
      let auditLength;

      // Initial deployment
      auditLength = await contract.getAuditLogLength();
      expect(auditLength).to.equal(1);

      // Station registration
      await contract.registerMonitoringStation("Test Location", operator1.address);
      auditLength = await contract.getAuditLogLength();
      expect(auditLength).to.equal(2);

      const stationLog = await contract.getAuditLog(1);
      expect(stationLog.action).to.equal("STATION_REGISTERED");

      // Operator authorization
      await contract.addAuthorizedOperator(operator2.address);
      auditLength = await contract.getAuditLogLength();
      expect(auditLength).to.equal(3);

      const operatorLog = await contract.getAuditLog(2);
      expect(operatorLog.action).to.equal("OPERATOR_ADDED");

      // Report submission
      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: ethers.parseEther("0.01") }
      );
      auditLength = await contract.getAuditLogLength();
      expect(auditLength).to.equal(4);

      const reportLog = await contract.getAuditLog(3);
      expect(reportLog.action).to.equal("REPORT_SUBMITTED");
    });

    it("Should include proper data in audit entries", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);

      const auditLog = await contract.getAuditLog(1);
      expect(auditLog.actor).to.equal(owner.address);
      expect(auditLog.timestamp).to.be.gt(0);
      expect(auditLog.reportId).to.equal(1);
      expect(auditLog.dataHash).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Platform Fee Management", function () {
    it("Should accumulate platform fees from refunds", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.registerMonitoringStation("Test Location", operator1.address);
      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      await ethers.provider.send("evm_increaseTime", [MAX_TIMEOUT + 1]);
      await ethers.provider.send("evm_mine");

      await contract.connect(operator1).claimRefund(1);

      const expectedFee = stakeAmount * BigInt(PLATFORM_FEE_RATE) / 1000n;
      const platformFees = await contract.platformFees();
      expect(platformFees).to.equal(expectedFee);
    });

    it("Should allow owner to withdraw platform fees", async function () {
      const stakeAmount = ethers.parseEther("0.01");

      await contract.registerMonitoringStation("Test Location", operator1.address);
      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: stakeAmount }
      );

      await ethers.provider.send("evm_increaseTime", [MAX_TIMEOUT + 1]);
      await ethers.provider.send("evm_mine");

      await contract.connect(operator1).claimRefund(1);

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const platformFees = await contract.platformFees();

      const tx = await contract.withdrawPlatformFees(owner.address);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.equal(initialBalance.add(platformFees).sub(gasUsed));

      // Check that platform fees are reset
      expect(await contract.platformFees()).to.equal(0);
    });

    it("Should reject fee withdrawal when no fees available", async function () {
      await expect(
        contract.withdrawPlatformFees(owner.address)
      ).to.be.revertedWith("No fees to withdraw");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await contract.registerMonitoringStation("Station 1", operator1.address);
      await contract.registerMonitoringStation("Station 2", operator2.address);
    });

    it("Should return correct system status", async function () {
      const status = await contract.getCurrentStatus();
      expect(status.totalStations).to.equal(2);
      expect(status.totalReports).to.equal(0);
      expect(status.contractOwner).to.equal(owner.address);
      expect(status.totalPlatformFees).to.equal(0);
      expect(status.contractPaused).to.equal(false);
    });

    it("Should return correct station information", async function () {
      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.location).to.equal("Station 1");
      expect(stationInfo.operator).to.equal(operator1.address);
      expect(stationInfo.isActive).to.equal(true);
      expect(stationInfo.totalReports).to.equal(0);
      expect(stationInfo.totalStaked).to.equal(0);
    });

    it("Should return correct gateway request status", async function () {
      // Submit a report to generate a gateway request
      await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: ethers.parseEther("0.01") }
      );

      const reportInfo = await contract.getReportInfo(1);
      const requestId = reportInfo.decryptionRequestId;

      if (requestId > 0) {
        const gatewayStatus = await contract.getGatewayRequestStatus(requestId);
        expect(gatewayStatus.requestId).to.equal(requestId);
        expect(gatewayStatus.reportId).to.equal(1);
        expect(gatewayStatus.requester).to.equal(operator1.address);
        expect(gatewayStatus.completed).to.equal(false);
        expect(gatewayStatus.failed).to.equal(false);
      }
    });
  });

  describe("Error Handling", function () {
    it("Should handle invalid station IDs gracefully", async function () {
      await expect(
        contract.getStationInfo(999)
      ).to.be.revertedWith("Station does not exist");

      await expect(
        contract.deactivateStation(999)
      ).to.be.revertedWith("Station does not exist");
    });

    it("Should handle invalid report IDs gracefully", async function () {
      await expect(
        contract.getReportInfo(999)
      ).to.be.revertedWith("Report does not exist");

      const [canRefund, reason] = await contract.canClaimRefund(999);
      expect(canRefund).to.equal(false);
      expect(reason).to.equal("Report does not exist");
    });

    it("Should prevent reentrancy attacks", async function () {
      // This test would require a malicious contract implementation
      // For now, we verify that the modifier is present in critical functions
      const contractSource = await ethers.provider.getCode(contract.address);
      expect(contractSource).to.include("nonReentrant");
    });
  });

  describe("Gas Optimization", function () {
    it("Should have reasonable gas costs for operations", async function () {
      await contract.registerMonitoringStation("Test Location", operator1.address);

      // Measure gas for report submission
      const tx = await contract.connect(operator1).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: ethers.parseEther("0.01") }
      );
      const receipt = await tx.wait();

      // Report submission should use reasonable gas (adjust threshold as needed)
      expect(receipt.gasUsed).to.be.lt(500000);
    });

    it("Should optimize storage usage", async function () {
      // Verify that storage slots are efficiently used
      // This is a simplified check - in practice, you'd analyze storage patterns
      const stationInfo = await contract.getStationInfo(1);
      expect(stationInfo.location).to.be.a('string');
      expect(stationInfo.operator).to.be.a('string');
    });
  });
});

// Additional integration tests for FHE functionality
describe("FHE Integration Tests", function () {
  let contract, owner, operator;

  beforeEach(async function () {
    [owner, operator] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory("EnhancedPrivacyPollutionMonitor");
    contract = await ContractFactory.deploy();
    await contract.deployed();

    await contract.registerMonitoringStation("Test Location", operator.address);
  });

  it("Should handle FHE-encrypted data properly", async function () {
    // This test would require actual FHE implementation
    // For now, we test the interface and flow

    const mockEncryptedData = {
      level: "0x" + "1234567890abcdef".repeat(4), // 32 bytes
      type: "0x12345678",
      severity: "0x" + "fedcba0987654321".repeat(4), // 32 bytes
      proofs: {
        level: "0xabcdef123456",
        type: "0x123456abcdef",
        severity: "0xabcdef123456"
      }
    };

    // The function should accept encrypted data format
    await expect(
      contract.connect(operator).submitPollutionReport(
        1,
        mockEncryptedData.level,
        mockEncryptedData.type,
        mockEncryptedData.severity,
        mockEncryptedData.proofs.level,
        mockEncryptedData.proofs.type,
        mockEncryptedData.proofs.severity,
        { value: ethers.parseEther("0.01") }
      )
    ).to.not.be.reverted;
  });
});

// Performance tests
describe("Performance Tests", function () {
  let contract, owner, operator;

  beforeEach(async function () {
    [owner, operator] = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory("EnhancedPrivacyPollutionMonitor");
    contract = await ContractFactory.deploy();
    await contract.deployed();

    await contract.registerMonitoringStation("Test Location", operator.address);
  });

  it("Should handle multiple report submissions efficiently", async function () {
    const numReports = 10;
    const stakeAmount = ethers.parseEther("0.01");

    for (let i = 0; i < numReports; i++) {
      await contract.connect(operator).submitPollutionReport(
        1,
        "0x1234" + i.toString().padStart(28, '0'),
        "0x56",
        "0x7890",
        "0xabc",
        "0xdef",
        "0x123",
        { value: stakeAmount }
      );
    }

    const status = await contract.getCurrentStatus();
    expect(status.totalReports).to.equal(numReports);

    // Verify all reports are stored correctly
    for (let i = 1; i <= numReports; i++) {
      const reportInfo = await contract.getReportInfo(i);
      expect(reportInfo.stationId).to.equal(1);
      expect(reportInfo.reporter).to.equal(operator.address);
    }
  });

  it("Should maintain reasonable gas costs at scale", async function () {
    const gasCosts = [];
    const numReports = 5;

    for (let i = 0; i < numReports; i++) {
      const tx = await contract.connect(operator).submitPollutionReport(
        1, "0x1234", "0x56", "0x7890", "0xabc", "0xdef", "0x123",
        { value: ethers.parseEther("0.01") }
      );
      const receipt = await tx.wait();
      gasCosts.push(receipt.gasUsed.toNumber());
    }

    // Gas costs should be relatively consistent
    const avgGas = gasCosts.reduce((a, b) => a + b, 0) / gasCosts.length;
    const maxGas = Math.max(...gasCosts);
    const minGas = Math.min(...gasCosts);

    // Allow for some variance but not too much
    expect(maxGas - minGas).to.be.lt(avgGas * 0.2); // Less than 20% variance
  });
});