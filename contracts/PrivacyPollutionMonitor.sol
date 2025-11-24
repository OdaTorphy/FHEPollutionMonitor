// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, externalEuint64, euint64, ebool, euint32, euint8 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract EnhancedPrivacyPollutionMonitor is SepoliaConfig, ReentrancyGuard, Pausable {

    address public owner;
    uint32 public totalMonitoringStations;
    uint32 public currentReportId;
    uint256 public constant MAX_TIMEOUT = 7 days;
    uint256 public constant GATEWAY_CALLBACK_TIMEOUT = 1 hours;
    uint256 public platformFees;

    // Privacy protection constants
    uint256 private constant PRIVACY_MULTIPLIER = 7919; // Large prime for obfuscation
    uint256 private constant NOISE_AMPLITUDE = 1000;

    struct MonitoringStation {
        string location;
        address operator;
        bool isActive;
        uint256 registrationTime;
        uint32 lastReading;
        uint256 lastUpdateTime;
        uint256 totalStaked;
    }

    struct PrivacyPollutionReport {
        uint32 stationId;
        euint64 encryptedPollutionLevel;
        euint8 encryptedPollutantType;
        euint64 encryptedSeverity;
        address reporter;
        uint256 timestamp;
        bool isVerified;
        uint32 reportId;
        uint256 stakeAmount;
        uint256 decryptionRequestId;
        uint256 timeoutDeadline;
        bool decryptionFailed;
        bool refundClaimed;
    }

    struct AlertThreshold {
        uint32 criticalLevel;
        uint32 warningLevel;
        bool isSet;
    }

    struct GatewayRequest {
        uint256 requestId;
        uint32 reportId;
        address requester;
        uint256 timestamp;
        bool completed;
        bool failed;
    }

    struct AuditLog {
        address actor;
        string action;
        uint256 timestamp;
        uint256 reportId;
        bytes32 dataHash;
    }

    mapping(uint32 => MonitoringStation) public stations;
    mapping(uint32 => PrivacyPollutionReport) public pollutionReports;
    mapping(uint8 => AlertThreshold) public pollutantThresholds;
    mapping(address => bool) public authorizedOperators;
    mapping(uint32 => uint32[]) public stationReports;
    mapping(uint256 => string) internal reportIdByRequestId;
    mapping(uint256 => GatewayRequest) public gatewayRequests;
    mapping(address => uint256) public userStakes;
    AuditLog[] public auditTrail;

    event StationRegistered(uint32 indexed stationId, string location, address operator);
    event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter);
    event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp);
    event ThresholdUpdated(uint8 indexed pollutantType, address updatedBy);
    event ReportVerified(uint32 indexed reportId, address verifier);
    event StationDeactivated(uint32 indexed stationId, address deactivatedBy);

    // Enhanced events for gateway and security features
    event DecryptionRequested(uint32 indexed reportId, uint256 indexed requestId, address requester);
    event DecryptionCompleted(uint32 indexed reportId, uint64 pollutionLevel, uint8 pollutantType, uint64 severity);
    event DecryptionFailed(uint32 indexed reportId, uint256 indexed requestId, string reason);
    event RefundProcessed(uint32 indexed reportId, address indexed user, uint256 amount);
    event TimeoutTriggered(uint32 indexed reportId, uint256 timeoutDeadline);
    event GatewayCallbackExecuted(uint256 indexed requestId, bool success);
    event SecurityAudit(address indexed actor, string action, uint256 timestamp);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedOperators[msg.sender] || msg.sender == owner, "Not authorized operator");
        _;
    }

    modifier stationExists(uint32 _stationId) {
        require(_stationId > 0 && _stationId <= totalMonitoringStations, "Station does not exist");
        _;
    }

    modifier activeStation(uint32 _stationId) {
        require(stations[_stationId].isActive, "Station is not active");
        _;
    }

    modifier validStake(uint256 _amount) {
        require(_amount >= 0.001 ether, "Minimum stake required");
        require(_amount <= 10 ether, "Maximum stake exceeded");
        _;
    }

    modifier notPaused() {
        require(!paused(), "Contract is paused");
        _;
    }

    // Audit log helper
    function _logAudit(address _actor, string memory _action, uint256 _reportId, bytes32 _dataHash) internal {
        auditTrail.push(AuditLog({
            actor: _actor,
            action: _action,
            timestamp: block.timestamp,
            reportId: _reportId,
            dataHash: _dataHash
        }));
        emit SecurityAudit(_actor, _action, block.timestamp);
    }

    // Privacy protection helpers
    function _applyPrivacyNoise(uint256 _value) internal pure returns (uint256) {
        return _value * PRIVACY_MULTIPLIER;
    }

    function _removePrivacyNoise(uint256 _noisyValue) internal pure returns (uint256) {
        return _noisyValue / PRIVACY_MULTIPLIER;
    }

    // Check for timeout conditions
    modifier checkTimeout(uint32 _reportId) {
        require(pollutionReports[_reportId].timeoutDeadline == 0 ||
                block.timestamp <= pollutionReports[_reportId].timeoutDeadline,
                "Operation timed out");
        _;
    }

    constructor() payable {
        owner = msg.sender;
        totalMonitoringStations = 0;
        currentReportId = 0;
        authorizedOperators[msg.sender] = true;
        platformFees = 0;

        // Log initial deployment
        _logAudit(msg.sender, "CONTRACT_DEPLOYED", 0, keccak256("deploy"));
    }

    function registerMonitoringStation(
        string memory _location,
        address _operator
    ) external onlyOwner notPaused returns (uint32) {
        require(_operator != address(0), "Invalid operator address");
        require(bytes(_location).length > 0, "Location cannot be empty");

        totalMonitoringStations++;
        uint32 stationId = totalMonitoringStations;

        stations[stationId] = MonitoringStation({
            location: _location,
            operator: _operator,
            isActive: true,
            registrationTime: block.timestamp,
            lastReading: 0,
            lastUpdateTime: block.timestamp,
            totalStaked: 0
        });

        authorizedOperators[_operator] = true;

        // Log the action for audit
        bytes32 dataHash = keccak256(abi.encodePacked(stationId, _location, _operator));
        _logAudit(msg.sender, "STATION_REGISTERED", stationId, dataHash);

        emit StationRegistered(stationId, _location, _operator);
        return stationId;
    }

    function submitPollutionReport(
        uint32 _stationId,
        externalEuint64 _encryptedPollutionLevel,
        externalEuint8 _encryptedPollutantType,
        externalEuint64 _encryptedSeverity,
        bytes calldata _levelProof,
        bytes calldata _typeProof,
        bytes calldata _severityProof
    ) external payable onlyAuthorized stationExists(_stationId) activeStation(_stationId)
      nonReentrant validStake(msg.value) notPaused {

        require(msg.value >= 0.001 ether, "Insufficient stake for report");

        currentReportId++;

        // Convert external encrypted values to internal FHE values with validation
        euint64 pollutionLevel = FHE.fromExternal(_encryptedPollutionLevel, _levelProof);
        euint8 pollutantType = FHE.fromExternal(_encryptedPollutantType, _typeProof);
        euint64 severity = FHE.fromExternal(_encryptedSeverity, _severityProof);

        // Create report with FHE values
        pollutionReports[currentReportId] = PrivacyPollutionReport({
            stationId: _stationId,
            encryptedPollutionLevel: pollutionLevel,
            encryptedPollutantType: pollutantType,
            encryptedSeverity: severity,
            reporter: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            reportId: currentReportId,
            stakeAmount: msg.value,
            decryptionRequestId: 0,
            timeoutDeadline: block.timestamp + MAX_TIMEOUT,
            decryptionFailed: false,
            refundClaimed: false
        });

        // Update station info
        stations[_stationId].lastUpdateTime = block.timestamp;
        stations[_stationId].totalStaked += msg.value;
        stationReports[_stationId].push(currentReportId);

        // Track user stake for refund mechanisms
        userStakes[msg.sender] += msg.value;

        // Allow gateway access to encrypted values
        FHE.allowThis(pollutionLevel);
        FHE.allowThis(pollutantType);
        FHE.allowThis(severity);

        // Log audit trail
        bytes32 dataHash = keccak256(abi.encodePacked(currentReportId, _stationId, msg.sender));
        _logAudit(msg.sender, "REPORT_SUBMITTED", currentReportId, dataHash);

        emit PollutionReported(currentReportId, _stationId, msg.sender);

        // Schedule decryption request via gateway
        _scheduleDecryption(currentReportId);
    }

    // Internal function to schedule decryption via gateway
    function _scheduleDecryption(uint32 _reportId) internal {
        PrivacyPollutionReport storage report = pollutionReports[_reportId];

        // Prepare ciphertexts for gateway decryption
        bytes32[] memory ciphertexts = new bytes32[](3);
        ciphertexts[0] = FHE.toBytes32(report.encryptedPollutionLevel);
        ciphertexts[1] = FHE.toBytes32(report.encryptedPollutantType);
        ciphertexts[2] = FHE.toBytes32(report.encryptedSeverity);

        // Request decryption through gateway
        uint256 requestId = FHE.requestDecryption(
            ciphertexts,
            this.gatewayDecryptionCallback.selector
        );

        report.decryptionRequestId = requestId;
        reportIdByRequestId[requestId] = string(abi.encodePacked(_reportId));

        // Store gateway request info
        gatewayRequests[requestId] = GatewayRequest({
            requestId: requestId,
            reportId: _reportId,
            requester: report.reporter,
            timestamp: block.timestamp,
            completed: false,
            failed: false
        });

        emit DecryptionRequested(_reportId, requestId, report.reporter);
    }

    // Gateway decryption callback - handles async decryption completion
    function gatewayDecryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) external nonReentrant {
        // Verify the decryption signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        // Extract report ID from the mapping
        string memory reportIdStr = reportIdByRequestId[requestId];
        require(bytes(reportIdStr).length > 0, "Invalid request ID");

        uint32 reportId = abi.decode(reportIdStr, (uint32));
        PrivacyPollutionReport storage report = pollutionReports[reportId];
        require(report.decryptionRequestId == requestId, "Request ID mismatch");

        // Decode the cleartexts
        (uint64 pollutionLevel, uint8 pollutantType, uint64 severity) =
            abi.decode(cleartexts, (uint64, uint8, uint64));

        // Update report with decrypted values
        report.isVerified = true;

        // Apply privacy protection to prevent price leakage
        uint64 noisyLevel = uint64(_applyPrivacyNoise(pollutionLevel));
        uint64 noisySeverity = uint64(_applyPrivacyNoise(severity));

        // Update station with noisy data for external queries
        stations[report.stationId].lastReading = uint32(noisyLevel);

        // Update gateway request status
        GatewayRequest storage gatewayRequest = gatewayRequests[requestId];
        gatewayRequest.completed = true;
        gatewayRequest.failed = false;

        // Check for threshold alerts with noisy values
        _checkThresholdAlert(report.stationId, pollutantType, noisyLevel);

        // Log successful decryption
        bytes32 dataHash = keccak256(abi.encodePacked(reportId, pollutionLevel, pollutantType, severity));
        _logAudit(msg.sender, "DECRYPTION_SUCCESS", reportId, dataHash);

        emit DecryptionCompleted(reportId, pollutionLevel, pollutantType, severity);
        emit GatewayCallbackExecuted(requestId, true);
    }

    // Refund mechanism for failed decrypts and timeouts
    function claimRefund(uint32 _reportId) external nonReentrant checkTimeout(_reportId) {
        PrivacyPollutionReport storage report = pollutionReports[_reportId];
        require(report.reporter == msg.sender, "Only reporter can claim refund");
        require(!report.refundClaimed, "Refund already claimed");

        bool canRefund = false;
        string memory reason = "";

        // Check for timeout
        if (block.timestamp > report.timeoutDeadline) {
            canRefund = true;
            reason = "Timeout exceeded";
            report.decryptionFailed = true;
        }

        // Check for decryption failure
        if (report.decryptionFailed) {
            canRefund = true;
            reason = "Decryption failed";
        }

        // Check if gateway request has been pending too long
        if (report.decryptionRequestId > 0) {
            GatewayRequest storage gatewayRequest = gatewayRequests[report.decryptionRequestId];
            if (!gatewayRequest.completed &&
                block.timestamp > gatewayRequest.timestamp + GATEWAY_CALLBACK_TIMEOUT) {
                canRefund = true;
                reason = "Gateway timeout";
                gatewayRequest.failed = true;
                report.decryptionFailed = true;
            }
        }

        require(canRefund, "No refund conditions met");

        // Mark refund as claimed
        report.refundClaimed = true;

        // Calculate refund amount (stake minus platform fee)
        uint256 platformFee = (report.stakeAmount * 5) / 1000; // 0.5% platform fee
        uint256 refundAmount = report.stakeAmount - platformFee;
        platformFees += platformFee;

        // Update user stake
        require(userStakes[msg.sender] >= report.stakeAmount, "Invalid stake amount");
        userStakes[msg.sender] -= report.stakeAmount;

        // Transfer refund
        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        // Log refund
        bytes32 dataHash = keccak256(abi.encodePacked(_reportId, refundAmount, reason));
        _logAudit(msg.sender, "REFUND_CLAIMED", _reportId, dataHash);

        emit RefundProcessed(_reportId, msg.sender, refundAmount);
    }

    function setAlertThreshold(
        uint8 _pollutantType,
        uint32 _criticalLevel,
        uint32 _warningLevel
    ) external onlyOwner notPaused {
        require(_criticalLevel > _warningLevel, "Critical level must be higher than warning level");

        pollutantThresholds[_pollutantType] = AlertThreshold({
            criticalLevel: _criticalLevel,
            warningLevel: _warningLevel,
            isSet: true
        });

        // Log threshold update
        bytes32 dataHash = keccak256(abi.encodePacked(_pollutantType, _criticalLevel, _warningLevel));
        _logAudit(msg.sender, "THRESHOLD_UPDATED", 0, dataHash);

        emit ThresholdUpdated(_pollutantType, msg.sender);
    }

    function _checkThresholdAlert(
        uint32 _stationId,
        uint8 _pollutantType,
        uint64 _level
    ) internal {
        AlertThreshold storage threshold = pollutantThresholds[_pollutantType];

        if (threshold.isSet) {
            if (_level >= threshold.criticalLevel || _level >= threshold.warningLevel) {
                emit AlertTriggered(_stationId, _pollutantType, block.timestamp);
            }
        }
    }

    // Emergency functions
    function pause() external onlyOwner {
        _pause();
        _logAudit(msg.sender, "CONTRACT_PAUSED", 0, keccak256("pause"));
    }

    function unpause() external onlyOwner {
        _unpause();
        _logAudit(msg.sender, "CONTRACT_UNPAUSED", 0, keccak256("unpause"));
    }

    function withdrawPlatformFees(address _to) external onlyOwner {
        require(platformFees > 0, "No fees to withdraw");
        uint256 amount = platformFees;
        platformFees = 0;

        (bool success, ) = payable(_to).call{value: amount}("");
        require(success, "Withdrawal failed");

        emit PlatformFeesWithdrawn(_to, amount);
    }


    function verifyReport(uint32 _reportId) external onlyOwner notPaused {
        require(_reportId > 0 && _reportId <= currentReportId, "Report does not exist");
        require(!pollutionReports[_reportId].isVerified, "Report not verified yet");

        // Manual verification for special cases
        pollutionReports[_reportId].isVerified = true;

        // Log verification
        bytes32 dataHash = keccak256(abi.encodePacked(_reportId, "MANUAL_VERIFY"));
        _logAudit(msg.sender, "REPORT_VERIFIED_MANUAL", _reportId, dataHash);

        emit ReportVerified(_reportId, msg.sender);
    }

    function deactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId) {
        require(stations[_stationId].isActive, "Station already inactive");

        stations[_stationId].isActive = false;

        // Log deactivation
        bytes32 dataHash = keccak256(abi.encodePacked(_stationId));
        _logAudit(msg.sender, "STATION_DEACTIVATED", _stationId, dataHash);

        emit StationDeactivated(_stationId, msg.sender);
    }

    function reactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId) {
        require(!stations[_stationId].isActive, "Station already active");

        stations[_stationId].isActive = true;

        // Log reactivation
        bytes32 dataHash = keccak256(abi.encodePacked(_stationId));
        _logAudit(msg.sender, "STATION_REACTIVATED", _stationId, dataHash);
    }

    function addAuthorizedOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Invalid operator address");
        require(!authorizedOperators[_operator], "Operator already authorized");

        authorizedOperators[_operator] = true;

        // Log authorization
        bytes32 dataHash = keccak256(abi.encodePacked(_operator));
        _logAudit(msg.sender, "OPERATOR_ADDED", 0, dataHash);
    }

    function removeAuthorizedOperator(address _operator) external onlyOwner {
        require(_operator != owner, "Cannot remove owner");
        require(authorizedOperators[_operator], "Operator not authorized");

        authorizedOperators[_operator] = false;

        // Log removal
        bytes32 dataHash = keccak256(abi.encodePacked(_operator));
        _logAudit(msg.sender, "OPERATOR_REMOVED", 0, dataHash);
    }

    function getStationInfo(uint32 _stationId) external view stationExists(_stationId) returns (
        string memory location,
        address operator,
        bool isActive,
        uint256 registrationTime,
        uint256 lastUpdateTime,
        uint256 totalReports,
        uint256 totalStaked
    ) {
        MonitoringStation storage station = stations[_stationId];
        return (
            station.location,
            station.operator,
            station.isActive,
            station.registrationTime,
            station.lastUpdateTime,
            stationReports[_stationId].length,
            station.totalStaked
        );
    }

    function getReportInfo(uint32 _reportId) external view returns (
        uint32 stationId,
        address reporter,
        uint256 timestamp,
        bool isVerified,
        uint32 reportId,
        uint256 stakeAmount,
        uint256 decryptionRequestId,
        uint256 timeoutDeadline,
        bool decryptionFailed,
        bool refundClaimed
    ) {
        require(_reportId > 0 && _reportId <= currentReportId, "Report does not exist");

        PrivacyPollutionReport storage report = pollutionReports[_reportId];
        return (
            report.stationId,
            report.reporter,
            report.timestamp,
            report.isVerified,
            report.reportId,
            report.stakeAmount,
            report.decryptionRequestId,
            report.timeoutDeadline,
            report.decryptionFailed,
            report.refundClaimed
        );
    }

    function getStationReportIds(uint32 _stationId) external view stationExists(_stationId) returns (uint32[] memory) {
        return stationReports[_stationId];
    }

    function getCurrentStatus() external view returns (
        uint32 totalStations,
        uint32 totalReports,
        address contractOwner,
        uint256 totalPlatformFees,
        bool contractPaused
    ) {
        return (
            totalMonitoringStations,
            currentReportId,
            owner,
            platformFees,
            paused()
        );
    }

    // Enhanced view functions for gateway and timeout management
    function getGatewayRequestStatus(uint256 _requestId) external view returns (
        uint256 requestId,
        uint32 reportId,
        address requester,
        uint256 timestamp,
        bool completed,
        bool failed
    ) {
        GatewayRequest storage request = gatewayRequests[_requestId];
        return (
            request.requestId,
            request.reportId,
            request.requester,
            request.timestamp,
            request.completed,
            request.failed
        );
    }

    function canClaimRefund(uint32 _reportId) external view returns (bool canRefund, string memory reason) {
        if (_reportId == 0 || _reportId > currentReportId) {
            return (false, "Report does not exist");
        }

        PrivacyPollutionReport storage report = pollutionReports[_reportId];
        if (report.reporter != msg.sender) {
            return (false, "Not the reporter");
        }

        if (report.refundClaimed) {
            return (false, "Refund already claimed");
        }

        // Check timeout
        if (block.timestamp > report.timeoutDeadline) {
            return (true, "Timeout exceeded");
        }

        // Check decryption failure
        if (report.decryptionFailed) {
            return (true, "Decryption failed");
        }

        // Check gateway timeout
        if (report.decryptionRequestId > 0) {
            GatewayRequest storage gatewayRequest = gatewayRequests[report.decryptionRequestId];
            if (!gatewayRequest.completed &&
                block.timestamp > gatewayRequest.timestamp + GATEWAY_CALLBACK_TIMEOUT) {
                return (true, "Gateway timeout");
            }
        }

        return (false, "No refund conditions met");
    }

    function getAuditLog(uint256 _index) external view returns (
        address actor,
        string memory action,
        uint256 timestamp,
        uint256 reportId,
        bytes32 dataHash
    ) {
        require(_index < auditTrail.length, "Index out of bounds");
        AuditLog storage log = auditTrail[_index];
        return (
            log.actor,
            log.action,
            log.timestamp,
            log.reportId,
            log.dataHash
        );
    }

    function getAuditLogLength() external view returns (uint256) {
        return auditTrail.length;
    }

    function getUserStake(address _user) external view returns (uint256) {
        return userStakes[_user];
    }
}