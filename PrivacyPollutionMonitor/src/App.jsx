import React, { useState, useEffect } from 'react';
import { FhevmProvider, useFhevmClient } from 'fhevm-sdk/react';
import WalletConnect from './components/WalletConnect';
import StationRegistration from './components/StationRegistration';
import PollutionReporter from './components/PollutionReporter';
import Dashboard from './components/Dashboard';
import ThresholdManager from './components/ThresholdManager';
import { CONTRACT_CONFIG } from './lib/config';
import './styles/App.css';

function AppContent() {
  const client = useFhevmClient();
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [statsData, setStatsData] = useState({
    totalStations: 0,
    totalReports: 0,
    activeStations: 0
  });

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setUserAccount(accounts[0]);
          setIsConnected(true);
          if (client) {
            await refreshStats();
          }
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }
    }
  };

  const handleConnect = async (account) => {
    setUserAccount(account);
    setIsConnected(true);
    await refreshStats();
  };

  const handleDisconnect = () => {
    setUserAccount('');
    setIsConnected(false);
    setStatsData({
      totalStations: 0,
      totalReports: 0,
      activeStations: 0
    });
  };

  const refreshStats = async () => {
    if (!client || !isConnected) return;

    try {
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      const [totalStations, totalReports] = await Promise.all([
        contract.totalMonitoringStations(),
        contract.currentReportId()
      ]);

      setStatsData({
        totalStations: Number(totalStations),
        totalReports: Number(totalReports),
        activeStations: Number(totalStations) // Simplified - could be enhanced
      });
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Privacy Pollution Monitor</h1>
        <p>FHE Environmental Tracking with Confidential Data</p>
      </header>

      <main className="app-main">
        <WalletConnect
          isConnected={isConnected}
          userAccount={userAccount}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />

        {isConnected && (
          <>
            <Dashboard
              stats={statsData}
              onRefresh={refreshStats}
            />

            <div className="app-grid">
              <div className="grid-left">
                <StationRegistration
                  onRegistered={refreshStats}
                />

                <ThresholdManager />
              </div>

              <div className="grid-right">
                <PollutionReporter
                  onReported={refreshStats}
                />
              </div>
            </div>
          </>
        )}

        {!isConnected && (
          <div className="welcome-message">
            <h2>Welcome to Privacy Pollution Monitor</h2>
            <p>Connect your wallet to start monitoring environmental data with full encryption.</p>
            <div className="features">
              <div className="feature">
                <span className="icon">🔐</span>
                <h3>Encrypted Data</h3>
                <p>All pollution reports are encrypted using FHEVM technology</p>
              </div>
              <div className="feature">
                <span className="icon">📊</span>
                <h3>Real-time Monitoring</h3>
                <p>Track environmental metrics in real-time with privacy</p>
              </div>
              <div className="feature">
                <span className="icon">🌍</span>
                <h3>Station Network</h3>
                <p>Register and manage monitoring stations worldwide</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by FHEVM SDK | Built with React & Fully Homomorphic Encryption</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <FhevmProvider
      config={{
        network: CONTRACT_CONFIG.network,
        contractAddress: CONTRACT_CONFIG.address,
        chainId: CONTRACT_CONFIG.chainId,
        rpcUrl: CONTRACT_CONFIG.rpcUrl
      }}
    >
      <AppContent />
    </FhevmProvider>
  );
}

export default App;
