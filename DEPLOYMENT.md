# Deployment Guide

Complete deployment documentation for Privacy Pollution Monitor smart contract using Hardhat framework.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Compilation](#compilation)
- [Deployment](#deployment)
- [Verification](#verification)
- [Interaction](#interaction)
- [Simulation](#simulation)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

### Required Accounts

1. **Ethereum Wallet** (MetaMask recommended)
   - Download: https://metamask.io/
   - Export your private key: Account Details > Export Private Key

2. **Sepolia Testnet ETH**
   - Faucet: https://sepoliafaucet.com/
   - Alternative: https://www.alchemy.com/faucets/ethereum-sepolia
   - Required: ~0.1 ETH for deployment

3. **Etherscan API Key**
   - Sign up: https://etherscan.io/register
   - Get API key: https://etherscan.io/myapikey

4. **RPC Provider** (Optional but recommended)
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/

## 📦 Installation

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd privacy-pollution-monitor
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- Hardhat and core plugins
- Ethers.js v6
- OpenZeppelin contracts
- Testing utilities
- Verification tools

### Step 3: Verify Installation

```bash
npx hardhat --version
```

Expected output: `Hardhat version 2.19.0` or higher

## ⚙️ Configuration

### Environment Setup

1. **Copy environment template:**

```bash
cp .env.example .env
```

2. **Edit `.env` file:**

```env
# Network Configuration
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private Key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API Key
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Optional: Gas Reporter
REPORT_GAS=false
COINMARKETCAP_API_KEY=your_coinmarketcap_key

# Network Selection
NETWORK=sepolia
```

### Network Configuration

The project supports multiple networks configured in `hardhat.config.js`:

- **Hardhat Network**: Local development (default)
- **Localhost**: Local node deployment
- **Sepolia**: Ethereum testnet

## 🔨 Compilation

### Compile Smart Contracts

```bash
npm run compile
```

Output:
```
Compiled 1 Solidity file successfully
```

### Compilation Output

- **Artifacts**: `./artifacts/contracts/`
- **Cache**: `./cache/`
- **ABI**: `./artifacts/contracts/PrivacyPollutionMonitor.sol/PrivacyPollutionMonitor.json`

### Clean Build

```bash
npm run clean
npx hardhat clean
```

## 🚀 Deployment

### Deploy to Sepolia Testnet

1. **Ensure you have Sepolia ETH:**

```bash
# Check your balance
cast balance <YOUR_ADDRESS> --rpc-url $SEPOLIA_RPC_URL
```

2. **Run deployment script:**

```bash
npm run deploy
```

### Deployment Output

```
🚀 Starting deployment process...

📋 Deployment Information:
═══════════════════════════════════════
Network: sepolia
Chain ID: 11155111
Deployer: 0x1234...5678
Balance: 0.5 ETH
═══════════════════════════════════════

📦 Deploying PrivacyPollutionMonitor contract...
✅ Contract deployed successfully!

📝 Deployment Results:
═══════════════════════════════════════
Contract Address: 0xabcd...ef01
Transaction Hash: 0x1234...5678
Block Number: 4567890
Gas Used: 1234567
═══════════════════════════════════════

🔗 Etherscan Link: https://sepolia.etherscan.io/address/0xabcd...ef01

💾 Deployment info saved to: deployments/sepolia-deployment.json

⏳ Waiting for 5 block confirmations before verification...
✅ Block confirmations completed!

📝 To verify the contract on Etherscan, run:
   npm run verify
```

### Deployment Information File

The deployment creates a JSON file at `deployments/sepolia-deployment.json`:

```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contractName": "PrivacyPollutionMonitor",
  "contractAddress": "0xabcd...ef01",
  "deployer": "0x1234...5678",
  "deploymentHash": "0x1234...5678",
  "blockNumber": 4567890,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "explorerUrl": "https://sepolia.etherscan.io/address/0xabcd...ef01",
  "compiler": {
    "version": "0.8.24",
    "optimizer": true,
    "runs": 200
  }
}
```

### Deploy to Local Network

**Terminal 1** - Start local node:
```bash
npm run node
```

**Terminal 2** - Deploy:
```bash
npm run deploy:local
```

## ✅ Verification

### Verify on Etherscan

```bash
npm run verify
```

### Verification Output

```
🔍 Starting contract verification process...

📝 Verification Information:
═══════════════════════════════════════
Contract: PrivacyPollutionMonitor
Address: 0xabcd...ef01
Network: sepolia
Deployer: 0x1234...5678
═══════════════════════════════════════

🔄 Verifying contract on Etherscan...
✅ Contract verified successfully!

═══════════════════════════════════════
🔗 View verified contract:
   https://sepolia.etherscan.io/address/0xabcd...ef01#code
═══════════════════════════════════════
```

### Manual Verification

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 🔗 Interaction

### Interactive CLI

Launch the interactive menu:

```bash
npm run interact
```

### Available Operations

```
╔═══════════════════════════════════════════════════════╗
║     Privacy Pollution Monitor - Interaction Menu      ║
╚═══════════════════════════════════════════════════════╝

1.  Register Monitoring Station
2.  Submit Pollution Report
3.  Set Alert Threshold
4.  Verify Report
5.  Deactivate Station
6.  Reactivate Station
7.  Add Authorized Operator
8.  Remove Authorized Operator
9.  View Station Information
10. View Report Information
11. View Station Report IDs
12. View Current Status
13. View Contract Information
0.  Exit
```

### Example Workflows

**Register a Station:**
```
Select option: 1
Enter station location: Downtown Air Quality Station
Enter operator address: 0x1234...5678
✅ Station registered successfully!
   Station ID: 1
```

**Submit Pollution Report:**
```
Select option: 2
Enter station ID: 1
Enter pollution level (0-1000): 75
Enter pollutant type (0-255): 1
Enter severity (0-1000): 50
✅ Report submitted successfully!
```

**View Station Info:**
```
Select option: 9
Enter station ID: 1

📋 Station Details:
   Location: Downtown Air Quality Station
   Operator: 0x1234...5678
   Active: true
   Total Reports: 5
```

## 🎬 Simulation

### Run Full Workflow Simulation

```bash
npm run simulate
```

### Simulation Process

The simulation automatically:

1. **Registers 3 monitoring stations**
   - Downtown Air Quality Station
   - Industrial Zone Monitor
   - Residential Area Sensor

2. **Sets alert thresholds for 4 pollutant types**
   - PM2.5: Warning 50, Critical 100
   - PM10: Warning 100, Critical 200
   - CO2: Warning 800, Critical 1000
   - NO2: Warning 40, Critical 80

3. **Submits 5 pollution reports**
   - Normal levels
   - Warning levels
   - Critical levels

4. **Verifies reports**
5. **Deactivates a station**
6. **Generates simulation report**

### Simulation Output

```
🎬 Starting Full Workflow Simulation
═══════════════════════════════════════

📍 Step 1: Registering Monitoring Stations
✅ Registered: Downtown Air Quality Station
   Station ID: 1

⚠️  Step 2: Setting Alert Thresholds
✅ Set threshold for PM2.5

📊 Step 3: Submitting Pollution Reports
✅ Report #1: Normal PM2.5 levels

🎉 Simulation Completed Successfully!

📊 Simulation Summary:
   ✅ Registered 3 monitoring stations
   ✅ Set 4 alert thresholds
   ✅ Submitted 5 pollution reports
   ✅ Verified 3 reports
   ✅ Deactivated 1 station

💾 Simulation report saved to: simulation-reports/simulation-1234567890.json
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Insufficient Funds

**Error:**
```
Error: insufficient funds for gas * price + value
```

**Solution:**
- Get more Sepolia ETH from faucets
- Check balance: https://sepolia.etherscan.io/

#### 2. Invalid Private Key

**Error:**
```
Error: invalid private key
```

**Solution:**
- Ensure private key is correct (without 0x prefix)
- Export from MetaMask: Account Details > Export Private Key

#### 3. Network Connection Issues

**Error:**
```
Error: could not detect network
```

**Solution:**
- Check SEPOLIA_RPC_URL in .env
- Try alternative RPC providers (Alchemy, Infura)
- Verify internet connection

#### 4. Verification Failed

**Error:**
```
Error: Already Verified
```

**Solution:**
- Contract is already verified
- View on Etherscan directly

**Error:**
```
Error: Invalid API Key
```

**Solution:**
- Check ETHERSCAN_API_KEY in .env
- Generate new key: https://etherscan.io/myapikey

#### 5. Nonce Too Low

**Error:**
```
Error: nonce has already been used
```

**Solution:**
- Reset MetaMask account: Settings > Advanced > Reset Account
- Wait a few minutes and retry

### Gas Optimization

Monitor gas usage:

```bash
REPORT_GAS=true npm test
```

### Network Status

Check Sepolia network status:
- https://sepolia.etherscan.io/
- https://status.alchemy.com/

## 📊 Contract Addresses

### Deployed Contracts

| Network | Contract Address | Explorer Link |
|---------|-----------------|---------------|
| Sepolia | `0xc61a1997F87156dfC96CA14E66fA9E3A02D36358` | [View on Etherscan](https://sepolia.etherscan.io/address/0xc61a1997F87156dfC96CA14E66fA9E3A02D36358) |

## 📚 Additional Commands

### View Hardhat Accounts

```bash
npx hardhat accounts
```

### Start Local Node

```bash
npx hardhat node
```

### Run Tests

```bash
npm test
```

### Generate Coverage Report

```bash
npm run coverage
```

### Clean Build Artifacts

```bash
npm run clean
```

## 🔐 Security Best Practices

1. **Never commit `.env` file**
2. **Use hardware wallets for mainnet**
3. **Verify deployment addresses**
4. **Test thoroughly on testnet first**
5. **Keep dependencies updated**
6. **Audit contracts before production**

## 📞 Support

- **Documentation**: See README.md
- **Issues**: Open GitHub issue
- **Hardhat Docs**: https://hardhat.org/docs

---

**Last Updated**: 2024
