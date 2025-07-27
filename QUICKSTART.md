# Quick Start Guide

Get up and running with Privacy Pollution Monitor in 5 minutes.

## ⚡ Prerequisites Checklist

- [ ] Node.js v18+ installed
- [ ] MetaMask wallet installed
- [ ] Sepolia testnet ETH (~0.1 ETH)
- [ ] Etherscan API key
- [ ] RPC provider URL (Alchemy/Infura)

## 🚀 5-Minute Setup

### Step 1: Install (1 minute)

```bash
# Clone and install
git clone <repository-url>
cd privacy-pollution-monitor
npm install
```

### Step 2: Configure (2 minutes)

```bash
# Copy environment template
cp .env.example .env
```

Edit `.env` file:
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_metamask_private_key_without_0x
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Get your keys:**
- 🔗 [Alchemy](https://www.alchemy.com/) - Free RPC URL
- 🦊 [MetaMask](https://metamask.io/) - Export private key
- 🔍 [Etherscan](https://etherscan.io/myapikey) - Free API key
- 💧 [Sepolia Faucet](https://sepoliafaucet.com/) - Free testnet ETH

### Step 3: Deploy (2 minutes)

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy

# Verify on Etherscan
npm run verify
```

### Step 4: Interact

```bash
# Start interactive CLI
npm run interact

# Or run full simulation
npm run simulate
```

## 📝 Basic Operations

### Register a Station

```bash
# In interactive CLI
Select option: 1
Enter location: Downtown Monitoring Station
Enter operator: 0xYourOperatorAddress
```

### Submit a Report

```bash
Select option: 2
Enter station ID: 1
Enter pollution level: 75
Enter pollutant type: 1
Enter severity: 50
```

### View Status

```bash
Select option: 12  # View current status
```

## 🎯 Common Tasks

### Run Tests

```bash
npm test
```

### Local Development

```bash
# Terminal 1
npm run node

# Terminal 2
npm run deploy:local
npm run interact
```

### Generate Coverage

```bash
npm run coverage
```

### Clean Build

```bash
npm run clean
```

## 📚 Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide
- Read [README.md](./README.md) for project overview
- Read [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for architecture

## 🆘 Troubleshooting

### Insufficient Funds
```bash
# Get Sepolia ETH
https://sepoliafaucet.com/
```

### Invalid Private Key
```bash
# Make sure no 0x prefix in .env
PRIVATE_KEY=abc123...  ✅
PRIVATE_KEY=0xabc123... ❌
```

### Network Issues
```bash
# Try alternative RPC
SEPOLIA_RPC_URL=https://rpc.sepolia.org
```

## 🔗 Quick Links

- **Live Demo**: [https://privacy-pollution-monitor.vercel.app/](https://privacy-pollution-monitor.vercel.app/)
- **Contract**: `0xc61a1997F87156dfC96CA14E66fA9E3A02D36358`
- **Explorer**: [Sepolia Etherscan](https://sepolia.etherscan.io/)

## 📞 Support

Need help? Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

---

**Ready to build?** Start with `npm run compile` and `npm run deploy`! 🚀
