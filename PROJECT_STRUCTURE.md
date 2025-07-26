# Project Structure Overview

Complete technical overview of the Privacy Pollution Monitor Hardhat project.

## 📁 Directory Structure

```
privacy-pollution-monitor/
│
├── contracts/                          # Smart contract source files
│   └── PrivacyPollutionMonitor.sol    # Main pollution monitoring contract
│
├── scripts/                            # Hardhat task scripts
│   ├── deploy.js                      # Deployment script for all networks
│   ├── verify.js                      # Etherscan verification script
│   ├── interact.js                    # Interactive CLI for contract operations
│   └── simulate.js                    # Full workflow simulation script
│
├── test/                               # Test suite
│   └── PrivacyPollutionMonitor.test.js # Comprehensive unit tests
│
├── deployments/                        # Generated deployment information
│   ├── sepolia-deployment.json        # Sepolia testnet deployment data
│   └── localhost-deployment.json      # Local deployment data
│
├── simulation-reports/                 # Generated simulation reports
│   └── simulation-*.json              # Timestamped simulation results
│
├── artifacts/                          # Compiled contract artifacts
│   └── contracts/                     # Contract compilation output
│       └── PrivacyPollutionMonitor.sol/
│           ├── PrivacyPollutionMonitor.json  # Contract ABI and bytecode
│           └── PrivacyPollutionMonitor.dbg.json
│
├── cache/                              # Hardhat build cache
│
├── typechain-types/                    # TypeScript type definitions (if using TypeScript)
│
├── hardhat.config.js                   # Hardhat configuration
├── package.json                        # Project dependencies and scripts
├── .env                                # Environment variables (not committed)
├── .env.example                        # Environment variables template
├── .gitignore                          # Git ignore rules
│
├── README.md                           # Project overview and features
├── DEPLOYMENT.md                       # Complete deployment guide
└── PROJECT_STRUCTURE.md               # This file
```

## 📄 File Descriptions

### Smart Contracts

#### `contracts/PrivacyPollutionMonitor.sol`
Main smart contract implementing pollution monitoring system.

**Key Features:**
- Monitoring station registration and management
- Pollution report submission with privacy preservation
- Alert threshold configuration
- Report verification system
- Operator authorization management

**Contract Specifications:**
- Solidity Version: `^0.8.24`
- License: MIT
- Optimizer: Enabled (200 runs)

### Scripts

#### `scripts/deploy.js`
Handles contract deployment to configured networks.

**Features:**
- Network detection and configuration
- Gas estimation and balance checking
- Deployment transaction tracking
- Automatic deployment info saving
- Etherscan link generation
- Block confirmation waiting

**Output:**
- Console deployment summary
- `deployments/<network>-deployment.json` file

#### `scripts/verify.js`
Verifies deployed contracts on Etherscan.

**Features:**
- Automatic deployment file reading
- Etherscan API integration
- Verification status checking
- Source code upload
- Constructor argument handling

**Requirements:**
- ETHERSCAN_API_KEY in .env
- Prior contract deployment

#### `scripts/interact.js`
Interactive command-line interface for contract operations.

**Capabilities:**
- Register monitoring stations
- Submit pollution reports
- Set alert thresholds
- Verify reports
- Manage stations (activate/deactivate)
- Manage operators (add/remove)
- View station and report information
- Display contract status

**User Experience:**
- Menu-driven interface
- Input validation
- Transaction confirmation display
- Error handling

#### `scripts/simulate.js`
Automated full workflow simulation.

**Simulation Steps:**
1. Register multiple monitoring stations
2. Configure alert thresholds
3. Submit various pollution reports
4. Verify selected reports
5. Deactivate a station
6. Generate comprehensive report

**Output:**
- Console progress display
- `simulation-reports/simulation-<timestamp>.json` file

### Tests

#### `test/PrivacyPollutionMonitor.test.js`
Comprehensive test suite using Mocha and Chai.

**Test Coverage:**
- Deployment verification
- Station registration
- Pollution reporting
- Alert threshold management
- Report verification
- Station activation/deactivation
- Operator management
- View functions
- Access control
- Error conditions

**Test Statistics:**
- 40+ test cases
- 100% function coverage target
- Gas usage reporting

### Configuration Files

#### `hardhat.config.js`
Hardhat framework configuration.

**Configured Networks:**
- **Hardhat**: Local development network
- **Localhost**: Local node deployment
- **Sepolia**: Ethereum testnet

**Plugins:**
- @nomicfoundation/hardhat-toolbox
- @nomicfoundation/hardhat-verify
- hardhat-gas-reporter
- solidity-coverage

**Compiler Settings:**
- Version: 0.8.24
- Optimizer: Enabled
- Runs: 200

#### `package.json`
Project dependencies and npm scripts.

**Available Scripts:**
- `compile`: Compile smart contracts
- `test`: Run test suite
- `deploy`: Deploy to Sepolia
- `deploy:local`: Deploy to localhost
- `verify`: Verify on Etherscan
- `interact`: Interactive CLI
- `simulate`: Run simulation
- `node`: Start local Hardhat node
- `clean`: Clean artifacts
- `coverage`: Generate coverage report

**Key Dependencies:**
- hardhat: ^2.19.0
- ethers: ^6.9.0
- @openzeppelin/contracts: ^5.0.0
- chai: ^4.2.0

#### `.env.example`
Template for environment variables.

**Required Variables:**
```env
SEPOLIA_RPC_URL=           # Alchemy/Infura RPC URL
PRIVATE_KEY=               # Wallet private key
ETHERSCAN_API_KEY=         # Etherscan API key
REPORT_GAS=                # Enable gas reporting
NETWORK=                   # Target network
```

### Documentation

#### `README.md`
Project overview, features, and live demo information.

**Contents:**
- Project description
- Core concepts
- Technical architecture
- Live demo links
- Use cases
- Innovation highlights

#### `DEPLOYMENT.md`
Complete deployment documentation.

**Contents:**
- Prerequisites
- Installation steps
- Configuration guide
- Compilation instructions
- Deployment procedures
- Verification guide
- Interaction examples
- Troubleshooting

#### `PROJECT_STRUCTURE.md`
This file - comprehensive project structure documentation.

## 🔄 Workflow

### Development Workflow

```
1. Write/Modify Contract
   ↓
2. Compile (npm run compile)
   ↓
3. Write Tests
   ↓
4. Run Tests (npm test)
   ↓
5. Local Deployment (npm run deploy:local)
   ↓
6. Simulate (npm run simulate)
   ↓
7. Testnet Deployment (npm run deploy)
   ↓
8. Verify (npm run verify)
   ↓
9. Interact (npm run interact)
```

### Build Artifacts

#### Compilation Output
```
artifacts/
└── contracts/
    └── PrivacyPollutionMonitor.sol/
        ├── PrivacyPollutionMonitor.json     # ABI, bytecode, metadata
        └── PrivacyPollutionMonitor.dbg.json # Debug information
```

#### Deployment Output
```
deployments/
└── sepolia-deployment.json
    {
      "network": "sepolia",
      "contractAddress": "0x...",
      "deployer": "0x...",
      "deploymentHash": "0x...",
      "timestamp": "...",
      "explorerUrl": "..."
    }
```

#### Simulation Output
```
simulation-reports/
└── simulation-1234567890.json
    {
      "network": "sepolia",
      "contractAddress": "0x...",
      "stations": [1, 2, 3],
      "reports": [1, 2, 3, 4, 5],
      "summary": {...}
    }
```

## 🔧 Configuration Details

### Network Configuration

**Sepolia Testnet:**
```javascript
{
  url: process.env.SEPOLIA_RPC_URL,
  accounts: [process.env.PRIVATE_KEY],
  chainId: 11155111,
  gasPrice: "auto"
}
```

**Local Network:**
```javascript
{
  url: "http://127.0.0.1:8545",
  chainId: 31337
}
```

### Compiler Configuration

```javascript
{
  version: "0.8.24",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

### Verification Configuration

```javascript
etherscan: {
  apiKey: {
    sepolia: process.env.ETHERSCAN_API_KEY
  }
},
sourcify: {
  enabled: true
}
```

## 📊 Contract Architecture

### State Variables

```solidity
address public owner;
uint32 public totalMonitoringStations;
uint32 public currentReportId;

mapping(uint32 => MonitoringStation) public stations;
mapping(uint32 => PrivacyPollutionReport) public pollutionReports;
mapping(uint8 => AlertThreshold) public pollutantThresholds;
mapping(address => bool) public authorizedOperators;
mapping(uint32 => uint32[]) public stationReports;
```

### Data Structures

**MonitoringStation:**
- location (string)
- operator (address)
- isActive (bool)
- registrationTime (uint256)
- lastReading (uint32)
- lastUpdateTime (uint256)

**PrivacyPollutionReport:**
- stationId (uint32)
- encryptedPollutionLevel (uint32)
- encryptedPollutantType (uint8)
- encryptedSeverity (uint32)
- reporter (address)
- timestamp (uint256)
- isVerified (bool)
- reportId (uint32)

**AlertThreshold:**
- criticalLevel (uint32)
- warningLevel (uint32)
- isSet (bool)

### Events

```solidity
event StationRegistered(uint32 indexed stationId, string location, address operator)
event PollutionReported(uint32 indexed reportId, uint32 indexed stationId, address reporter)
event AlertTriggered(uint32 indexed stationId, uint8 pollutantType, uint256 timestamp)
event ThresholdUpdated(uint8 indexed pollutantType, address updatedBy)
event ReportVerified(uint32 indexed reportId, address verifier)
event StationDeactivated(uint32 indexed stationId, address deactivatedBy)
```

## 🚀 Quick Start Commands

```bash
# Setup
npm install
cp .env.example .env
# Edit .env with your credentials

# Development
npm run compile          # Compile contracts
npm test                # Run tests
npm run coverage        # Generate coverage

# Local Deployment
npm run node            # Terminal 1: Start local node
npm run deploy:local    # Terminal 2: Deploy locally

# Testnet Deployment
npm run deploy          # Deploy to Sepolia
npm run verify          # Verify on Etherscan

# Interaction
npm run interact        # Interactive CLI
npm run simulate        # Run simulation

# Maintenance
npm run clean           # Clean build artifacts
```

## 📈 Gas Estimates

Typical gas usage for operations:

| Operation | Gas Used (estimate) |
|-----------|---------------------|
| Deploy Contract | ~1,500,000 |
| Register Station | ~150,000 |
| Submit Report | ~100,000 |
| Set Threshold | ~50,000 |
| Verify Report | ~30,000 |
| Deactivate Station | ~30,000 |

*Note: Actual gas usage may vary based on network conditions*

## 🔐 Security Considerations

1. **Access Control**: Owner-only and operator-only functions
2. **Input Validation**: Require statements for critical operations
3. **State Management**: Proper tracking of stations and reports
4. **Event Logging**: Comprehensive event emission
5. **Reentrancy**: No external calls in critical functions

## 📝 License

MIT License - See contract header for details

---

**Last Updated**: 2024
**Hardhat Version**: 2.19.0
**Solidity Version**: 0.8.24
