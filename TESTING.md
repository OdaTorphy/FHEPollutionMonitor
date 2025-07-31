# Testing Documentation

Comprehensive testing guide for Privacy Pollution Monitor smart contract.

## 📊 Test Coverage Overview

### Test Statistics

- **Total Test Suites**: 2
- **Total Test Cases**: 58+
- **Coverage Target**: 100%
- **Frameworks**: Hardhat + Mocha + Chai

### Test Distribution

| Category | Tests | Description |
|----------|-------|-------------|
| Deployment & Initialization | 5 | Contract deployment validation |
| Station Registration | 8 | Monitoring station management |
| Pollution Reporting | 10 | Report submission and validation |
| Alert Threshold Management | 7 | Threshold configuration |
| Alert Triggering | 5 | Alert system behavior |
| Report Verification | 5 | Report verification workflow |
| Station Management | 5 | Station activation/deactivation |
| Operator Management | 6 | Operator authorization |
| View Functions | 4 | State query functions |
| Edge Cases | 3 | Boundary conditions |

## 🛠️ Testing Infrastructure

### Required Dependencies

```json
{
  "devDependencies": {
    "@nomicfoundation/hardhat-chai-matchers": "^2.0.0",
    "@nomicfoundation/hardhat-ethers": "^3.0.0",
    "@nomicfoundation/hardhat-network-helpers": "^1.0.0",
    "@nomicfoundation/hardhat-verify": "^2.0.0",
    "@typechain/ethers-v6": "^0.5.0",
    "@typechain/hardhat": "^9.0.0",
    "@types/chai": "^4.2.0",
    "@types/mocha": "^10.0.0",
    "@types/node": "^20.0.0",
    "chai": "^4.5.0",
    "chai-as-promised": "^8.0.0",
    "hardhat": "^2.19.0",
    "hardhat-gas-reporter": "^2.0.0",
    "mocha": "^10.0.0",
    "solidity-coverage": "^0.8.0",
    "typechain": "^8.3.0"
  }
}
```

### Hardhat Configuration

```javascript
// hardhat.config.js
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {
      chainId: 31337
    },
    sepolia: {
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL
    }
  },
  mocha: {
    timeout: 40000
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  }
};
```

## 🧪 Test Structure

### Standard Test File Pattern

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("ContractName", function () {
  // Fixture for deployment
  async function deployContractFixture() {
    const [owner, operator1, operator2, unauthorized] = await ethers.getSigners();

    const Contract = await ethers.getContractFactory("ContractName");
    const contract = await Contract.deploy();
    await contract.waitForDeployment();

    return { contract, owner, operator1, operator2, unauthorized };
  }

  describe("Feature Group", function () {
    it("should perform expected behavior", async function () {
      const { contract, operator1 } = await loadFixture(deployContractFixture);

      // Test implementation
      await expect(contract.function())
        .to.emit(contract, "EventName")
        .withArgs(expectedArgs);
    });
  });
});
```

### Test Organization

```
describe("ContractName", function () {
  describe("1. Deployment and Initialization", function () {});
  describe("2. Core Functionality", function () {});
  describe("3. Access Control", function () {});
  describe("4. Edge Cases", function () {});
});
```

## 📋 Test Suites

### Suite 1: Basic Tests (`test/PrivacyPollutionMonitor.test.js`)

**Purpose**: Core functionality validation

**Test Categories**:
- Deployment (3 tests)
- Station Registration (4 tests)
- Pollution Reporting (10 tests)
- Alert Thresholds (4 tests)
- Report Verification (5 tests)
- Station Management (5 tests)
- Operator Management (6 tests)
- View Functions (4 tests)

**Total**: 40+ tests

### Suite 2: Comprehensive Tests (`test/PrivacyPollutionMonitor.comprehensive.test.js`)

**Purpose**: Extended coverage with edge cases

**Test Categories**:
- Deployment and Initialization (5 tests)
- Station Registration (8 tests)
- Pollution Reporting (10 tests)
- Alert Threshold Management (7 tests)
- Alert Triggering (5 tests)
- Report Verification (5 tests)
- Station Management (5 tests)
- Operator Management (6 tests)
- View Functions (4 tests)
- Edge Cases (3 tests)

**Total**: 58 tests

## 🔬 Test Categories Explained

### 1. Deployment and Initialization Tests

**Purpose**: Verify contract deploys correctly with expected initial state

```javascript
it("Should deploy successfully with valid address", async function () {
  const { contract } = await loadFixture(deployContractFixture);
  expect(await contract.getAddress()).to.be.properAddress;
});

it("Should set the deployer as owner", async function () {
  const { contract, owner } = await loadFixture(deployContractFixture);
  expect(await contract.owner()).to.equal(owner.address);
});

it("Should initialize with zero state", async function () {
  const { contract } = await loadFixture(deployContractFixture);
  expect(await contract.totalMonitoringStations()).to.equal(0);
  expect(await contract.currentReportId()).to.equal(0);
});
```

### 2. Station Registration Tests

**Purpose**: Validate station creation and management

```javascript
it("Should register a new monitoring station", async function () {
  const { contract, operator1 } = await loadFixture(deployContractFixture);

  await expect(contract.registerMonitoringStation("Location", operator1.address))
    .to.emit(contract, "StationRegistered")
    .withArgs(1, "Location", operator1.address);
});

it("Should store station information correctly", async function () {
  const { contract, operator1 } = await loadFixture(deployContractFixture);

  await contract.registerMonitoringStation("Test Station", operator1.address);

  const stationInfo = await contract.getStationInfo(1);
  expect(stationInfo.location).to.equal("Test Station");
  expect(stationInfo.operator).to.equal(operator1.address);
  expect(stationInfo.isActive).to.be.true;
});
```

### 3. Pollution Reporting Tests

**Purpose**: Test pollution report submission and storage

```javascript
it("Should submit pollution report successfully", async function () {
  const { contract, operator1 } = await loadFixture(deployContractFixture);

  await contract.registerMonitoringStation("Test Station", operator1.address);

  await expect(
    contract.connect(operator1).submitPollutionReport(1, 75, 1, 50)
  ).to.emit(contract, "PollutionReported")
    .withArgs(1, 1, operator1.address);
});

it("Should update station's last reading", async function () {
  const { contract, operator1 } = await loadFixture(deployContractFixture);

  await contract.registerMonitoringStation("Test Station", operator1.address);
  await contract.connect(operator1).submitPollutionReport(1, 123, 1, 50);

  const stationInfo = await contract.getStationInfo(1);
  expect(stationInfo.lastReading).to.equal(123);
});
```

### 4. Alert Threshold Tests

**Purpose**: Validate threshold configuration and alert triggering

```javascript
it("Should set alert threshold successfully", async function () {
  const { contract } = await loadFixture(deployContractFixture);

  await expect(contract.setAlertThreshold(1, 100, 50))
    .to.emit(contract, "ThresholdUpdated")
    .withArgs(1, await contract.owner());
});

it("Should trigger alert when pollution exceeds critical level", async function () {
  const { contract, operator1 } = await loadFixture(deployContractFixture);

  await contract.registerMonitoringStation("Test Station", operator1.address);
  await contract.setAlertThreshold(1, 100, 50);

  await expect(
    contract.connect(operator1).submitPollutionReport(1, 120, 1, 80)
  ).to.emit(contract, "AlertTriggered");
});
```

### 5. Access Control Tests

**Purpose**: Verify permission restrictions

```javascript
it("Should revert when non-owner tries to register station", async function () {
  const { contract, operator1, unauthorized } = await loadFixture(deployContractFixture);

  await expect(
    contract.connect(unauthorized).registerMonitoringStation("Station", operator1.address)
  ).to.be.revertedWith("Not authorized");
});

it("Should allow owner to verify reports", async function () {
  const { contract, owner, operator1 } = await loadFixture(deployContractFixture);

  await contract.registerMonitoringStation("Test Station", operator1.address);
  await contract.connect(operator1).submitPollutionReport(1, 75, 1, 50);

  await expect(contract.verifyReport(1)).to.not.be.reverted;
});
```

### 6. Edge Cases Tests

**Purpose**: Test boundary conditions and extreme values

```javascript
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
```

## 🚀 Running Tests

### Basic Test Execution

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/PrivacyPollutionMonitor.test.js

# Run with gas reporting
npm run test:gas

# Run on Sepolia testnet
npm run test:sepolia
```

### Coverage Report

```bash
# Generate coverage report
npm run coverage
```

**Output**:
```
---------------------------------|----------|----------|----------|----------|
File                             |  % Stmts | % Branch |  % Funcs |  % Lines |
---------------------------------|----------|----------|----------|----------|
contracts/                       |      100 |      100 |      100 |      100 |
  PrivacyPollutionMonitor.sol    |      100 |      100 |      100 |      100 |
---------------------------------|----------|----------|----------|----------|
All files                        |      100 |      100 |      100 |      100 |
---------------------------------|----------|----------|----------|----------|
```

### Gas Reporting

```bash
# Run tests with gas reporting enabled
REPORT_GAS=true npm test
```

**Output**:
```
·-----------------------------------------|---------------------------|-------------|-------|
|  Solc version: 0.8.24                  ·  Optimizer enabled: true  ·  Runs: 200  ·
··········································|···························|·············|·······
|  Methods                                                                                 ·
·························|················|·············|·············|·············|·······
|  Contract              ·  Method        ·  Min        ·  Max        ·  Avg        ·  # calls
·························|················|·············|·············|·············|·······
|  PrivacyPollutionMonitor  ·  registerMonitoringStation  ·  150000  ·  160000  ·  155000  ·  45
·························|················|·············|·············|·············|·······
|  PrivacyPollutionMonitor  ·  submitPollutionReport     ·  95000   ·  105000  ·  100000  ·  50
·························|················|·············|·············|·············|·······
```

## ✅ Testing Best Practices

### 1. Use Descriptive Test Names

```javascript
// ✅ Good
it("Should emit StationRegistered event when registering new station", async function () {});

// ❌ Bad
it("test1", async function () {});
```

### 2. Use loadFixture for Efficiency

```javascript
// ✅ Good - Uses snapshot for efficiency
const { contract, operator1 } = await loadFixture(deployContractFixture);

// ❌ Bad - Deploys fresh contract every test
beforeEach(async function () {
  contract = await deploy();
});
```

### 3. Test One Thing Per Test

```javascript
// ✅ Good
it("Should increment station count", async function () {
  await contract.registerMonitoringStation("Station 1", operator1.address);
  expect(await contract.totalMonitoringStations()).to.equal(1);
});

// ❌ Bad - Tests multiple things
it("Should register station and submit report", async function () {
  // Tests two separate features
});
```

### 4. Test Both Success and Failure Cases

```javascript
// Success case
it("Should allow owner to verify report", async function () {
  await expect(contract.verifyReport(1)).to.not.be.reverted;
});

// Failure case
it("Should revert when non-owner tries to verify", async function () {
  await expect(
    contract.connect(unauthorized).verifyReport(1)
  ).to.be.revertedWith("Not authorized");
});
```

### 5. Use Clear Assertions

```javascript
// ✅ Good - Specific assertion
expect(stationInfo.location).to.equal("Test Station");

// ❌ Bad - Vague assertion
expect(stationInfo).to.exist;
```

## 📈 Expected Test Results

### All Tests Passing

```
  PrivacyPollutionMonitor
    Deployment
      ✓ Should set the correct owner (50ms)
      ✓ Should initialize with zero stations and reports
      ✓ Should authorize owner as operator

    Station Registration
      ✓ Should register a monitoring station (120ms)
      ✓ Should authorize operator during registration
      ✓ Should increment station count
      ✓ Should revert if not called by owner

    Pollution Reporting
      ✓ Should submit a pollution report (150ms)
      ✓ Should update station last reading
      ✓ Should increment report count
      ✓ Should revert if station doesn't exist
      ✓ Should revert if station is inactive
      ✓ Should revert if not authorized operator

    Alert Thresholds
      ✓ Should set alert threshold (80ms)
      ✓ Should revert if critical level not higher than warning
      ✓ Should trigger alert when threshold exceeded (140ms)

    ... (abbreviated)

  58 passing (5s)
```

## 🔍 Continuous Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm install
      - run: npm run compile
      - run: npm test
      - run: npm run coverage
```

## 📝 Test Maintenance

### Adding New Tests

1. Identify the feature to test
2. Choose the appropriate test file
3. Add test to relevant `describe` block
4. Follow naming conventions
5. Run tests to verify
6. Update this documentation

### Updating Tests

1. Run tests before changes
2. Update test logic
3. Verify all tests pass
4. Update documentation if needed

## 🎯 Coverage Goals

- **Statement Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%
- **Line Coverage**: 100%

## 📚 Additional Resources

- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Mocha Testing Framework](https://mochajs.org/)

---

**Last Updated**: 2024
**Test Framework**: Hardhat + Mocha + Chai
**Total Tests**: 58+
**Coverage**: Target 100%
