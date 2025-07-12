// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// FHE库将在实际部署时配置
// import { FHE, euint32, ebool, euint8 } from "@fhevm/solidity/lib/FHE.sol";
// import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivacyPollutionMonitor {

    address public owner;
    uint32 public totalMonitoringStations;
    uint32 public currentReportId;

    struct MonitoringStation {
        string location;
        address operator;
        bool isActive;
        uint256 registrationTime;
        uint32 lastReading;
        uint256 lastUpdateTime;
    }

    struct PrivacyPollutionReport {
        uint32 stationId;
        uint32 encryptedPollutionLevel;
        uint8 encryptedPollutantType;
        uint32 encryptedSeverity;
        address reporter;
        uint256 timestamp;
        bool isVerified;
        uint32 reportId;
    }

    struct AlertThreshold {
        uint32 criticalLevel;
        uint32 warningLevel;
        bool isSet;
    }

    mapping(uint32 => MonitoringStation) public stations;
    mapping(uint32 => PrivacyPollutionReport) public pollutionReports;
    mapping(uint8 => AlertThreshold) public pollutantThresholds;
    mapping(address => bool) public authorizedOperators;
    mapping(uint32 => uint32[]) public stationReports;

    event StationRegistered(uint32 indexed stationId, string location, address operator);
    event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter);
    event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp);
    event ThresholdUpdated(uint8 indexed pollutantType, address updatedBy);
    event ReportVerified(uint32 indexed reportId, address verifier);
    event StationDeactivated(uint32 indexed stationId, address deactivatedBy);

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

    constructor() {
        owner = msg.sender;
        totalMonitoringStations = 0;
        currentReportId = 0;
        authorizedOperators[msg.sender] = true;
    }

    function registerMonitoringStation(
        string memory _location,
        address _operator
    ) external onlyOwner returns (uint32) {
        totalMonitoringStations++;
        uint32 stationId = totalMonitoringStations;

        stations[stationId] = MonitoringStation({
            location: _location,
            operator: _operator,
            isActive: true,
            registrationTime: block.timestamp,
            lastReading: 0,
            lastUpdateTime: block.timestamp
        });

        authorizedOperators[_operator] = true;

        emit StationRegistered(stationId, _location, _operator);
        return stationId;
    }

    function submitPollutionReport(
        uint32 _stationId,
        uint32 _pollutionLevel,
        uint8 _pollutantType,
        uint32 _severity
    ) external onlyAuthorized stationExists(_stationId) activeStation(_stationId) {

        currentReportId++;

        pollutionReports[currentReportId] = PrivacyPollutionReport({
            stationId: _stationId,
            encryptedPollutionLevel: _pollutionLevel,
            encryptedPollutantType: _pollutantType,
            encryptedSeverity: _severity,
            reporter: msg.sender,
            timestamp: block.timestamp,
            isVerified: false,
            reportId: currentReportId
        });

        stations[_stationId].lastReading = _pollutionLevel;
        stations[_stationId].lastUpdateTime = block.timestamp;
        stationReports[_stationId].push(currentReportId);

        emit PollutionReported(currentReportId, _stationId, msg.sender);

        _checkThresholdAlert(_stationId, _pollutantType, _pollutionLevel);
    }

    function setAlertThreshold(
        uint8 _pollutantType,
        uint32 _criticalLevel,
        uint32 _warningLevel
    ) external onlyOwner {
        require(_criticalLevel > _warningLevel, "Critical level must be higher than warning level");

        pollutantThresholds[_pollutantType] = AlertThreshold({
            criticalLevel: _criticalLevel,
            warningLevel: _warningLevel,
            isSet: true
        });

        emit ThresholdUpdated(_pollutantType, msg.sender);
    }

    function _checkThresholdAlert(
        uint32 _stationId,
        uint8 _pollutantType,
        uint32 _level
    ) internal {
        AlertThreshold storage threshold = pollutantThresholds[_pollutantType];

        if (threshold.isSet) {
            if (_level >= threshold.criticalLevel || _level >= threshold.warningLevel) {
                emit AlertTriggered(_stationId, _pollutantType, block.timestamp);
            }
        }
    }


    function verifyReport(uint32 _reportId) external onlyOwner {
        require(_reportId > 0 && _reportId <= currentReportId, "Report does not exist");
        require(!pollutionReports[_reportId].isVerified, "Report already verified");

        pollutionReports[_reportId].isVerified = true;

        emit ReportVerified(_reportId, msg.sender);
    }

    function deactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId) {
        stations[_stationId].isActive = false;

        emit StationDeactivated(_stationId, msg.sender);
    }

    function reactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId) {
        stations[_stationId].isActive = true;
    }

    function addAuthorizedOperator(address _operator) external onlyOwner {
        authorizedOperators[_operator] = true;
    }

    function removeAuthorizedOperator(address _operator) external onlyOwner {
        require(_operator != owner, "Cannot remove owner");
        authorizedOperators[_operator] = false;
    }

    function getStationInfo(uint32 _stationId) external view stationExists(_stationId) returns (
        string memory location,
        address operator,
        bool isActive,
        uint256 registrationTime,
        uint256 lastUpdateTime,
        uint256 totalReports
    ) {
        MonitoringStation storage station = stations[_stationId];
        return (
            station.location,
            station.operator,
            station.isActive,
            station.registrationTime,
            station.lastUpdateTime,
            stationReports[_stationId].length
        );
    }

    function getReportInfo(uint32 _reportId) external view returns (
        uint32 stationId,
        address reporter,
        uint256 timestamp,
        bool isVerified,
        uint32 reportId
    ) {
        require(_reportId > 0 && _reportId <= currentReportId, "Report does not exist");

        PrivacyPollutionReport storage report = pollutionReports[_reportId];
        return (
            report.stationId,
            report.reporter,
            report.timestamp,
            report.isVerified,
            report.reportId
        );
    }

    function getStationReportIds(uint32 _stationId) external view stationExists(_stationId) returns (uint32[] memory) {
        return stationReports[_stationId];
    }

    function getCurrentStatus() external view returns (
        uint32 totalStations,
        uint32 totalReports,
        address contractOwner
    ) {
        return (
            totalMonitoringStations,
            currentReportId,
            owner
        );
    }
}