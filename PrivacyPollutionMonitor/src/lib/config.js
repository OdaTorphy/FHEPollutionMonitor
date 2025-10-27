// Smart Contract Configuration
export const CONTRACT_CONFIG = {
  address: "0xc61a1997F87156dfC96CA14E66fA9E3A02D36358",
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
  abi: [
    "function owner() public view returns (address)",
    "function totalMonitoringStations() public view returns (uint32)",
    "function currentReportId() public view returns (uint32)",
    "function registerMonitoringStation(string memory _location, address _operator) external returns (uint32)",
    "function submitPollutionReport(uint32 _stationId, uint32 _pollutionLevel, uint8 _pollutantType, uint32 _severity) external",
    "function setAlertThreshold(uint8 _pollutantType, uint32 _criticalLevel, uint32 _warningLevel) external",
    "function verifyReport(uint32 _reportId) external",
    "function getStationInfo(uint32 _stationId) external view returns (string memory location, address operator, bool isActive, uint256 registrationTime, uint256 lastUpdateTime, uint256 totalReports)",
    "function getReportInfo(uint32 _reportId) external view returns (uint32 stationId, address reporter, uint256 timestamp, bool isVerified, uint32 reportId)",
    "function getCurrentStatus() external view returns (uint32 totalStations, uint32 totalReports, address contractOwner)",
    "function authorizedOperators(address) public view returns (bool)",
    "event StationRegistered(uint32 indexed stationId, string location, address operator)",
    "event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter)",
    "event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp)",
    "event ReportVerified(uint32 indexed reportId, address verifier)"
  ]
};

// Pollutant Type Mapping
export const POLLUTANT_TYPES = {
  1: "PM2.5",
  2: "PM10",
  3: "Sulfur Dioxide",
  4: "Nitrogen Oxides",
  5: "Ozone",
  6: "Heavy Metals",
  7: "Chemical Substances",
  8: "Other"
};

export const POLLUTANT_OPTIONS = Object.entries(POLLUTANT_TYPES).map(([value, label]) => ({
  value: Number(value),
  label
}));

// Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 1,
  MODERATE: 2,
  HIGH: 3,
  CRITICAL: 4
};

export const SEVERITY_OPTIONS = [
  { value: SEVERITY_LEVELS.LOW, label: 'Low', color: '#27ae60' },
  { value: SEVERITY_LEVELS.MODERATE, label: 'Moderate', color: '#f39c12' },
  { value: SEVERITY_LEVELS.HIGH, label: 'High', color: '#e67e22' },
  { value: SEVERITY_LEVELS.CRITICAL, label: 'Critical', color: '#e74c3c' }
];
