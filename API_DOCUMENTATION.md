# Enhanced Privacy Pollution Monitor - API Documentation

## 📋 Overview

This document provides comprehensive API documentation for the Enhanced Privacy Pollution Monitor smart contract. The API combines **Fully Homomorphic Encryption (FHE)** with **Gateway Callback Architecture** for privacy-preserving environmental monitoring.

## 🔧 Smart Contract Address

- **Network**: Sepolia Testnet (for development)
- **Contract Address**: `[TO_BE_DEPLOYED]`
- **ABI**: Available in `/artifacts/contracts/PrivacyPollutionMonitor.sol/EnhancedPrivacyPollutionMonitor.json`

## 🏗️ Core Data Structures

### MonitoringStation
```solidity
struct MonitoringStation {
    string location;           // Geographic location identifier
    address operator;         // Authorized operator wallet address
    bool isActive;            // Current operational status
    uint256 registrationTime; // Unix timestamp of registration
    uint32 lastReading;       // Last reported pollution level (noisy)
    uint256 lastUpdateTime;   // Unix timestamp of last report
    uint256 totalStaked;      // Total ETH staked by this station
}
```

### PrivacyPollutionReport
```solidity
struct PrivacyPollutionReport {
    uint32 stationId;               // Source monitoring station ID
    euint64 encryptedPollutionLevel; // FHE-encrypted pollution level
    euint8 encryptedPollutantType;  // FHE-encrypted pollutant type (1-255)
    euint64 encryptedSeverity;      // FHE-encrypted severity level
    address reporter;               // Submitting operator address
    uint256 timestamp;              // Report submission timestamp
    bool isVerified;                // Gateway decryption verification
    uint32 reportId;                // Unique report identifier
    uint256 stakeAmount;            // ETH stake amount (min 0.001 ETH)
    uint256 decryptionRequestId;    // Gateway request identifier
    uint256 timeoutDeadline;        // Maximum processing time (7 days)
    bool decryptionFailed;          // Decryption failure status
    bool refundClaimed;             // Refund processing status
}
```

### GatewayRequest
```solidity
struct GatewayRequest {
    uint256 requestId;    // Unique gateway request ID
    uint32 reportId;      // Associated report ID
    address requester;    // Requesting address
    uint256 timestamp;    // Request submission time
    bool completed;       // Gateway processing completion
    bool failed;          // Gateway processing failure
}
```

## 🚀 API Functions

### 1. Station Management

#### `registerMonitoringStation`
**Registers a new monitoring station in the system.**

```solidity
function registerMonitoringStation(
    string memory _location,
    address _operator
) external onlyOwner notPaused returns (uint32 stationId)
```

**Parameters:**
- `_location` (string): Geographic location identifier
- `_operator` (address): Authorized operator wallet address

**Returns:**
- `stationId` (uint32): Unique station identifier

**Requirements:**
- Caller must be contract owner
- Contract must not be paused
- `_operator` must be valid address (not zero address)
- `_location` must be non-empty string

**Emits:**
- `StationRegistered(stationId, _location, _operator)`
- `SecurityAudit(owner, "STATION_REGISTERED", stationId, dataHash)`

**Example:**
```javascript
const stationId = await contract.registerMonitoringStation(
    "Beijing Downtown",
    "0x742d35Cc6473e4F5b73A3A2b4C2e0E1e0f9Aa1B"
);
console.log(`Station registered with ID: ${stationId}`);
```

---

#### `deactivateStation`
**Deactivates an active monitoring station.**

```solidity
function deactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId)
```

**Parameters:**
- `_stationId` (uint32): Station identifier to deactivate

**Requirements:**
- Caller must be contract owner
- Station must exist
- Station must be currently active

**Emits:**
- `StationDeactivated(_stationId, msg.sender)`
- `SecurityAudit(owner, "STATION_DEACTIVATED", _stationId, dataHash)`

---

#### `reactivateStation`
**Reactivates a deactivated monitoring station.**

```solidity
function reactivateStation(uint32 _stationId) external onlyOwner stationExists(_stationId)
```

**Parameters:**
- `_stationId` (uint32): Station identifier to reactivate

**Requirements:**
- Caller must be contract owner
- Station must exist
- Station must be currently inactive

---

### 2. Report Submission

#### `submitPollutionReport`
**Submits encrypted pollution data for processing.**

```solidity
function submitPollutionReport(
    uint32 _stationId,
    externalEuint64 _encryptedPollutionLevel,
    externalEuint8 _encryptedPollutantType,
    externalEuint64 _encryptedSeverity,
    bytes calldata _levelProof,
    bytes calldata _typeProof,
    bytes calldata _severityProof
) external payable onlyAuthorized stationExists(_stationId) activeStation(_stationId)
  nonReentrant validStake(msg.value) notPaused
```

**Parameters:**
- `_stationId` (uint32): Source station identifier
- `_encryptedPollutionLevel` (externalEuint64): FHE-encrypted pollution reading
- `_encryptedPollutantType` (externalEuint8): FHE-encrypted pollutant type (1-255)
- `_encryptedSeverity` (externalEuint64): FHE-encrypted severity level
- `_levelProof` (bytes): Cryptographic proof for pollution level
- `_typeProof` (bytes): Cryptographic proof for pollutant type
- `_severityProof` (bytes): Cryptographic proof for severity level
- `msg.value` (uint256): Stake amount (minimum 0.001 ETH)

**Requirements:**
- Caller must be authorized operator
- Station must exist and be active
- Stake must be between 0.001 and 10 ETH
- Contract must not be paused
- Valid cryptographic proofs required
- FHE client-side encryption required

**Process Flow:**
1. Validate all parameters and requirements
2. Convert external FHE values to internal encrypted values
3. Create report with timeout protection (7 days)
4. Schedule Gateway decryption request
5. Update station statistics
6. Track user stake for refund mechanisms

**Emits:**
- `PollutionReported(reportId, _stationId, msg.sender)`
- `DecryptionRequested(reportId, requestId, msg.sender)`
- `SecurityAudit(msg.sender, "REPORT_SUBMITTED", reportId, dataHash)`

**Example:**
```javascript
// Client-side encryption using ZAMA FHE SDK
const encryptedLevel = await fhe.encrypt(pollutionLevel);
const encryptedType = await fhe.encrypt(pollutantType);
const encryptedSeverity = await fhe.encrypt(severityLevel);

const tx = await contract.submitPollutionReport(
    stationId,
    encryptedLevel.handles[0],
    encryptedType.handles[0],
    encryptedSeverity.handles[0],
    encryptedLevel.inputProof,
    encryptedType.inputProof,
    encryptedSeverity.inputProof,
    { value: ethers.parseEther("0.01") }
);
```

---

### 3. Gateway Integration

#### `gatewayDecryptionCallback`
**Internal function called by Gateway after decrypting data.**

```solidity
function gatewayDecryptionCallback(
    uint256 requestId,
    bytes memory cleartexts,
    bytes memory decryptionProof
) external nonReentrant
```

**Parameters:**
- `requestId` (uint256): Gateway request identifier
- `cleartexts` (bytes): Decrypted data (pollutionLevel, pollutantType, severity)
- `decryptionProof` (bytes): Gateway cryptographic proof

**Process:**
1. Verify Gateway signatures and proofs
2. Decrypt and validate data
3. Apply privacy obfuscation (noise addition)
4. Update report verification status
5. Check and trigger alerts if needed
6. Log successful completion

**Emits:**
- `DecryptionCompleted(reportId, pollutionLevel, pollutantType, severity)`
- `GatewayCallbackExecuted(requestId, true)`
- `SecurityAudit(gateway, "DECRYPTION_SUCCESS", reportId, dataHash)`

---

### 4. Refund Mechanisms

#### `claimRefund`
**Allows users to claim refunds for failed or timed-out operations.**

```solidity
function claimRefund(uint32 _reportId) external nonReentrant checkTimeout(_reportId)
```

**Parameters:**
- `_reportId` (uint32): Report identifier for refund claim

**Refund Conditions:**
1. **Timeout Exceeded**: Processing time > 7 days
2. **Decryption Failed**: Gateway reported failure
3. **Gateway Timeout**: No response within 1 hour

**Requirements:**
- Caller must be original report submitter
- Refund must not have been claimed already
- Must meet one of the refund conditions
- Must be within timeout protection period

**Fee Structure:**
- **Platform Fee**: 0.5% of stake amount
- **Refund Amount**: Stake amount - platform fee
- **Platform Fees**: Accumulated for owner withdrawal

**Emits:**
- `RefundProcessed(_reportId, msg.sender, refundAmount)`
- `SecurityAudit(msg.sender, "REFUND_CLAIMED", _reportId, dataHash)`

**Example:**
```javascript
// Check if refund is available
const [canRefund, reason] = await contract.canClaimRefund(reportId);
if (canRefund) {
    const tx = await contract.claimRefund(reportId);
    const receipt = await tx.wait();
    console.log(`Refund claimed: ${reason}`);
}
```

---

### 5. Threshold Management

#### `setAlertThreshold`
**Configures pollution alert thresholds for specific pollutants.**

```solidity
function setAlertThreshold(
    uint8 _pollutantType,
    uint32 _criticalLevel,
    uint32 _warningLevel
) external onlyOwner notPaused
```

**Parameters:**
- `_pollutantType` (uint8): Pollutant type identifier (1-255)
- `_criticalLevel` (uint32): Critical alert threshold
- `_warningLevel` (uint32): Warning alert threshold

**Requirements:**
- Caller must be contract owner
- Contract must not be paused
- `_criticalLevel` must be > `_warningLevel`

**Alert Levels:**
- **Warning**: Environmental monitoring alert
- **Critical**: Immediate action required

**Emits:**
- `ThresholdUpdated(_pollutantType, msg.sender)`
- `SecurityAudit(owner, "THRESHOLD_UPDATED", 0, dataHash)`

---

### 6. Access Control

#### `addAuthorizedOperator`
**Adds an address to the authorized operators list.**

```solidity
function addAuthorizedOperator(address _operator) external onlyOwner
```

**Parameters:**
- `_operator` (address): Wallet address to authorize

**Requirements:**
- Caller must be contract owner
- `_operator` must be valid address
- `_operator` must not already be authorized

---

#### `removeAuthorizedOperator`
**Removes an address from the authorized operators list.**

```solidity
function removeAuthorizedOperator(address _operator) external onlyOwner
```

**Parameters:**
- `_operator` (address): Wallet address to remove

**Requirements:**
- Caller must be contract owner
- `_operator` must not be contract owner
- `_operator` must currently be authorized

---

### 7. Emergency Functions

#### `pause`
**Pauses all contract operations in emergency situations.**

```solidity
function pause() external onlyOwner
```

**Effects:**
- Stops all report submissions
- Prevents station registrations
- Maintains read access for monitoring

**Emits:** `Paused(msg.sender)`

---

#### `unpause`
**Resumes normal contract operations.**

```solidity
function unpause() external onlyOwner
```

**Effects:**
- Resumes all normal operations
- Re-enables report submissions
- Allows station management

**Emits:** `Unpaused(msg.sender)`

---

## 📊 View Functions

### Station Information

#### `getStationInfo`
```solidity
function getStationInfo(uint32 _stationId) external view stationExists(_stationId) returns (
    string memory location,
    address operator,
    bool isActive,
    uint256 registrationTime,
    uint256 lastUpdateTime,
    uint256 totalReports,
    uint256 totalStaked
)
```

**Returns:** Complete station information including statistics.

---

### Report Information

#### `getReportInfo`
```solidity
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
)
```

**Returns:** Complete report information with status.

---

#### `canClaimRefund`
```solidity
function canClaimRefund(uint32 _reportId) external view returns (bool canRefund, string memory reason)
```

**Returns:** Refund eligibility status and reason.

**Example:**
```javascript
const [canRefund, reason] = await contract.canClaimRefund(reportId);
console.log(`Refund available: ${canRefund}, Reason: ${reason}`);
```

---

### System Status

#### `getCurrentStatus`
```solidity
function getCurrentStatus() external view returns (
    uint32 totalStations,
    uint32 totalReports,
    address contractOwner,
    uint256 totalPlatformFees,
    bool contractPaused
)
```

**Returns:** Overall system status and statistics.

---

### Gateway Status

#### `getGatewayRequestStatus`
```solidity
function getGatewayRequestStatus(uint256 _requestId) external view returns (
    uint256 requestId,
    uint32 reportId,
    address requester,
    uint256 timestamp,
    bool completed,
    bool failed
)
```

**Returns:** Gateway request processing status.

---

### Audit Information

#### `getAuditLog`
```solidity
function getAuditLog(uint256 _index) external view returns (
    address actor,
    string memory action,
    uint256 timestamp,
    uint256 reportId,
    bytes32 dataHash
)
```

**Returns:** Specific audit log entry.

#### `getAuditLogLength`
```solidity
function getAuditLogLength() external view returns (uint256)
```

**Returns:** Total number of audit log entries.

---

## 🚨 Events

### Core Events

```solidity
// Station Management
event StationRegistered(uint32 indexed stationId, string location, address operator);
event StationDeactivated(uint32 indexed stationId, address deactivatedBy);

// Report Processing
event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter);
event DecryptionRequested(uint32 indexed reportId, uint256 indexed requestId, address requester);
event DecryptionCompleted(uint32 indexed reportId, uint64 pollutionLevel, uint8 pollutantType, uint64 severity);
event DecryptionFailed(uint32 indexed reportId, uint256 indexed requestId, string reason);

// Financial Operations
event RefundProcessed(uint32 indexed reportId, address indexed user, uint256 amount);
event PlatformFeesWithdrawn(address indexed to, uint256 amount);

// Security & Audit
event SecurityAudit(address indexed actor, string action, uint256 timestamp);
event GatewayCallbackExecuted(uint256 indexed requestId, bool success);
event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp);
```

---

## 🔧 Error Messages

### Common Errors
- `"Not authorized"`: Caller lacks required permissions
- `"Station does not exist"`: Invalid station ID
- `"Station is not active"`: Station is deactivated
- `"Invalid operator address"`: Zero address provided
- `"Insufficient stake for report"`: Below minimum stake (0.001 ETH)
- `"Maximum stake exceeded"`: Above maximum stake (10 ETH)
- `"Contract is paused"`: Emergency pause active
- `"Operation timed out"`: Timeout protection triggered
- `"No refund conditions met"`: Refund requirements not satisfied

### Gateway-Specific Errors
- `"Invalid request ID"`: Unknown Gateway request
- `"Request ID mismatch"`: Gateway request inconsistency
- `"Decryption failed"`: Gateway processing failure
- `"Gateway timeout"`: No Gateway response within timeout

---

## 💡 Usage Examples

### Complete Report Submission Flow

```javascript
// 1. Connect wallet and check authorization
const accounts = await web3.eth.getAccounts();
const isAuthorized = await contract.authorizedOperators(accounts[0]);

// 2. Encrypt pollution data using ZAMA FHE SDK
const pollutionData = {
    level: 150,    // AQI or pollution index
    type: 1,       // 1=PM2.5, 2=PM10, 3=NO2, etc.
    severity: 75   // 0-100 severity scale
};

const encryptedLevel = await fhe.encrypt(pollutionData.level);
const encryptedType = await fhe.encrypt(pollutionData.type);
const encryptedSeverity = await fhe.encrypt(pollutionData.severity);

// 3. Submit report with stake
const tx = await contract.submitPollutionReport(
    stationId,
    encryptedLevel.handles[0],
    encryptedType.handles[0],
    encryptedSeverity.handles[0],
    encryptedLevel.inputProof,
    encryptedType.inputProof,
    encryptedSeverity.inputProof,
    { value: ethers.parseEther("0.01") }
);

const receipt = await tx.wait();
const reportId = receipt.events[0].args.reportId;

// 4. Monitor processing status
const checkStatus = async () => {
    const report = await contract.getReportInfo(reportId);
    console.log(`Report Status: Verified=${report.isVerified}, Failed=${report.decryptionFailed}`);

    if (!report.isVerified && !report.decryptionFailed) {
        const [canRefund, reason] = await contract.canClaimRefund(reportId);
        if (canRefund) {
            console.log(`Refund available: ${reason}`);
            // await contract.claimRefund(reportId);
        }
    }
};

// Check status periodically
setInterval(checkStatus, 30000); // Every 30 seconds
```

### Monitoring Dashboard Implementation

```javascript
// Real-time monitoring dashboard
class MonitoringDashboard {
    async loadDashboard() {
        const status = await contract.getCurrentStatus();
        this.updateStats(status);

        // Load all stations
        for (let i = 1; i <= status.totalStations; i++) {
            try {
                const station = await contract.getStationInfo(i);
                this.addStationToMap(station);
            } catch (e) {
                console.log(`Station ${i} not found`);
            }
        }
    }

    async checkRefunds() {
        const reports = await this.getUserReports(userAddress);
        for (const reportId of reports) {
            const [canRefund, reason] = await contract.canClaimRefund(reportId);
            if (canRefund) {
                this.showRefundOption(reportId, reason);
            }
        }
    }

    async listenForEvents() {
        contract.on('PollutionReported', (reportId, stationId, reporter) => {
            this.updateDashboard();
        });

        contract.on('DecryptionCompleted', (reportId, level, type, severity) => {
            this.showAlert(reportId, level, type, severity);
        });

        contract.on('AlertTriggered', (stationId, pollutantType, timestamp) => {
            this.triggerNotification(stationId, pollutantType);
        });
    }
}
```

---

## 🔐 Security Best Practices

### Client-Side Security
1. **Wallet Security**: Use hardware wallets for authorized operators
2. **Key Management**: Secure storage of private keys
3. **Network Security**: Use secure RPC endpoints
4. **Data Validation**: Validate data before encryption

### Smart Contract Security
1. **Access Control**: Implement proper role-based permissions
2. **Input Validation**: Comprehensive parameter checking
3. **Reentrancy Protection**: Prevent recursive calls
4. **Audit Logging**: Maintain complete action trails
5. **Emergency Controls**: Pause functionality for critical situations

### Operational Security
1. **Monitoring**: Real-time system health monitoring
2. **Alerting**: Automated security alerts
3. **Backup**: Regular state backup procedures
4. **Updates**: Secure contract upgrade mechanisms

---

## 📞 Technical Support

### Documentation Resources
- **Architecture Guide**: `/ENHANCED_ARCHITECTURE.md`
- **Smart Contract Source**: `/contracts/PrivacyPollutionMonitor.sol`
- **Test Suite**: `/test/EnhancedPrivacyPollutionMonitor.test.js`

### Support Channels
- **GitHub Issues**: Report bugs and feature requests
- **Technical Documentation**: Comprehensive API reference
- **Community Support**: Developer community forums

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Network**: Ethereum Sepolia Testnet