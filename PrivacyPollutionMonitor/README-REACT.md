# Privacy Pollution Monitor - React + FHEVM SDK

A comprehensive environmental monitoring application built with React and FHEVM SDK for fully encrypted pollution data tracking.

## Features

- 🔐 **Fully Encrypted Data**: All pollution reports encrypted using FHEVM before blockchain submission
- 📊 **Real-time Dashboard**: Monitor stations and reports with live statistics
- 🏭 **Station Management**: Register and manage monitoring stations
- 📈 **Pollution Reporting**: Submit encrypted pollution reports with multiple pollutant types
- ⚠️ **Alert Thresholds**: Set encrypted threshold levels for automated alerts
- 🌍 **Decentralized**: Built on blockchain with MetaMask integration

## Technology Stack

- **Frontend**: React 18.3 with Vite
- **Encryption**: FHEVM SDK for Fully Homomorphic Encryption
- **Blockchain**: Ethereum (Sepolia testnet)
- **Smart Contracts**: Ethers.js 6.9
- **Styling**: Custom CSS with modern gradients

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

Update the contract address in `src/lib/config.js`:

```javascript
export const CONTRACT_CONFIG = {
  address: "0xYourContractAddress",
  network: "sepolia",
  chainId: 11155111,
  rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY"
};
```

## Project Structure

```
PrivacyPollutionMonitor/
├── src/
│   ├── components/          # React components
│   │   ├── WalletConnect.jsx     # Wallet connection
│   │   ├── Dashboard.jsx         # Statistics and data display
│   │   ├── StationRegistration.jsx    # Station registration
│   │   ├── PollutionReporter.jsx      # Encrypted reporting
│   │   └── ThresholdManager.jsx       # Alert thresholds
│   ├── lib/
│   │   └── config.js        # Contract configuration
│   ├── styles/
│   │   └── App.css          # Application styles
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Entry point
├── index-react.html         # HTML template
├── vite.config.js           # Vite configuration
├── package.json
└── README-REACT.md
```

## How It Works

### 1. Wallet Connection
Connect your MetaMask wallet to interact with the blockchain.

### 2. Station Registration
Register monitoring stations with location and operator information.

### 3. Encrypted Pollution Reporting
Submit pollution reports with:
- **Station ID**: Which station is reporting
- **Pollution Level** (encrypted): 0-10000 range
- **Pollutant Type** (encrypted): PM2.5, PM10, SO2, NOx, etc.
- **Severity** (encrypted): Low, Moderate, High, Critical

All sensitive data is encrypted client-side using FHEVM SDK before submission.

### 4. Alert Thresholds
Set encrypted warning and critical thresholds for automated alerts.

### 5. Dashboard Monitoring
View all registered stations and submitted reports in real-time.

## FHEVM SDK Integration

This example demonstrates full FHEVM SDK integration:

```jsx
import { FhevmProvider, useFhevmClient, useEncrypt } from 'fhevm-sdk/react';

// Wrap app with provider
<FhevmProvider config={{ network: 'sepolia', contractAddress: '0x...' }}>
  <App />
</FhevmProvider>

// Use in components
const client = useFhevmClient();
const { encrypt, isEncrypting } = useEncrypt();

// Encrypt data
const encrypted = await encrypt(value, 'uint32');
```

## Encryption Examples

### Encrypt Pollution Level (uint32)
```javascript
const pollutionLevel = 850;
const encryptedLevel = await encrypt(pollutionLevel, 'uint32');
```

### Encrypt Pollutant Type (uint8)
```javascript
const pollutantType = 1; // PM2.5
const encryptedType = await encrypt(pollutantType, 'uint8');
```

### Submit to Contract
```javascript
const contract = await client.getContract(address, abi);
const tx = await contract.submitPollutionReport(
  stationId,
  encryptedLevel,
  encryptedType,
  encryptedSeverity
);
```

## Smart Contract

The application interacts with the PrivacyPollutionMonitor smart contract deployed on Sepolia testnet.

**Contract Address**: `0xc61a1997F87156dfC96CA14E66fA9E3A02D36358`

**Network**: Sepolia (Chain ID: 11155111)

## Comparison: Static vs React Version

### Static HTML Version (`index.html` + `app.js`)
- ❌ No FHEVM SDK integration
- ❌ Manual ethers.js setup
- ❌ Global state management
- ❌ No encryption (placeholder comments only)
- ✅ Simple deployment

### React Version (This Implementation)
- ✅ Full FHEVM SDK integration
- ✅ React hooks and context
- ✅ Component-based architecture
- ✅ Real encryption using FHE
- ✅ Better state management
- ✅ Reusable components
- ✅ Modern development experience

## Development

```bash
# Development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## Deployment

### Vercel
```bash
npm run build
vercel deploy
```

### Other Platforms
Build the project and serve the `dist` folder:
```bash
npm run build
# Serve dist/ folder
```

## Environment Variables

Create a `.env` file:
```
VITE_CONTRACT_ADDRESS=0xYourContractAddress
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

## Security Considerations

1. **Client-Side Encryption**: All encryption happens in the browser
2. **No Plain Text**: Sensitive data never leaves client unencrypted
3. **MetaMask Signatures**: User must approve all transactions
4. **Read-Only Functions**: Dashboard uses view functions (no gas)

## Troubleshooting

### MetaMask Not Detected
- Install MetaMask browser extension
- Refresh the page after installation

### Transaction Fails
- Ensure you're connected to Sepolia network
- Check you have enough test ETH for gas
- Verify contract address is correct

### Encryption Errors
- Wait for FHEVM client initialization
- Check network connection
- Ensure wallet is connected

## Learn More

- **FHEVM SDK**: [GitHub Repository](https://github.com/yourusername/fhevm-react-template)
- **Zama FHEVM**: [Official Docs](https://docs.zama.ai/fhevm)
- **React**: [React Documentation](https://react.dev)
- **Vite**: [Vite Guide](https://vitejs.dev)

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Report a bug](https://github.com/yourusername/fhevm-react-template/issues)
- Documentation: [FHEVM SDK Docs](https://github.com/yourusername/fhevm-react-template/tree/main/docs)

---

Built with ❤️ using React and FHEVM SDK
