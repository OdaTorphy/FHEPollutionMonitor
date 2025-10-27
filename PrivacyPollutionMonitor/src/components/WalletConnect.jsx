import React, { useState } from 'react';
import { useFhevmClient } from 'fhevm-sdk/react';

function WalletConnect({ isConnected, userAccount, onConnect, onDisconnect }) {
  const client = useFhevmClient();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask wallet');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Initialize FHEVM client
      if (client && !client.isInitialized) {
        await client.init();
      }

      onConnect(accounts[0]);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setError('');
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      {!isConnected ? (
        <div className="connection-content">
          <p>Please connect your wallet to continue</p>
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="connection-content">
          <p>
            Connected: <strong>{formatAddress(userAccount)}</strong>
          </p>
          <button
            className="btn btn-secondary btn-small"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
