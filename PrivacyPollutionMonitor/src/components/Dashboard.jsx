import React, { useState, useEffect } from 'react';
import { useFhevmClient } from 'fhevm-sdk/react';
import { CONTRACT_CONFIG, POLLUTANT_TYPES } from '../lib/config';

function Dashboard({ stats, onRefresh }) {
  const client = useFhevmClient();
  const [stations, setStations] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStations();
    loadReports();
  }, [stats.totalStations, stats.totalReports]);

  const loadStations = async () => {
    if (!client || stats.totalStations === 0) return;

    setIsLoading(true);
    try {
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      const stationPromises = [];
      for (let i = 1; i <= Math.min(stats.totalStations, 10); i++) {
        stationPromises.push(contract.getStationInfo(i));
      }

      const stationResults = await Promise.all(stationPromises);
      const stationData = stationResults.map((station, index) => ({
        id: index + 1,
        location: station.location,
        operator: station.operator,
        isActive: station.isActive,
        registrationTime: new Date(Number(station.registrationTime) * 1000),
        lastUpdateTime: new Date(Number(station.lastUpdateTime) * 1000),
        totalReports: Number(station.totalReports)
      }));

      setStations(stationData);
    } catch (error) {
      console.error('Failed to load stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    if (!client || stats.totalReports === 0) return;

    setIsLoading(true);
    try {
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      const reportPromises = [];
      for (let i = 1; i <= Math.min(stats.totalReports, 10); i++) {
        reportPromises.push(contract.getReportInfo(i));
      }

      const reportResults = await Promise.all(reportPromises);
      const reportData = reportResults.map((report, index) => ({
        id: index + 1,
        stationId: Number(report.stationId),
        reporter: report.reporter,
        timestamp: new Date(Number(report.timestamp) * 1000),
        isVerified: report.isVerified
      }));

      setReports(reportData);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (date) => {
    return date.toLocaleString();
  };

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏭</div>
          <div className="stat-content">
            <h3>Total Stations</h3>
            <p className="stat-value">{stats.totalStations}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Reports</h3>
            <p className="stat-value">{stats.totalReports}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Active Stations</h3>
            <p className="stat-value">{stats.activeStations}</p>
          </div>
        </div>

        <div className="stat-card">
          <button className="btn btn-secondary" onClick={onRefresh}>
            🔄 Refresh Data
          </button>
        </div>
      </div>

      <div className="data-section">
        <div className="section">
          <h2>Monitoring Stations</h2>
          {isLoading && stations.length === 0 ? (
            <p>Loading stations...</p>
          ) : stations.length === 0 ? (
            <p>No stations registered yet.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Location</th>
                    <th>Operator</th>
                    <th>Status</th>
                    <th>Reports</th>
                    <th>Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map(station => (
                    <tr key={station.id}>
                      <td>{station.id}</td>
                      <td>{station.location}</td>
                      <td>{formatAddress(station.operator)}</td>
                      <td>
                        <span className={`status-badge ${station.isActive ? 'active' : 'inactive'}`}>
                          {station.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{station.totalReports}</td>
                      <td>{formatDate(station.registrationTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="section">
          <h2>Recent Reports (Encrypted)</h2>
          {isLoading && reports.length === 0 ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports submitted yet.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Station ID</th>
                    <th>Reporter</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.id}</td>
                      <td>{report.stationId}</td>
                      <td>{formatAddress(report.reporter)}</td>
                      <td>{formatDate(report.timestamp)}</td>
                      <td>
                        <span className={`status-badge ${report.isVerified ? 'verified' : 'pending'}`}>
                          {report.isVerified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="encryption-note">
                <p>🔐 All pollution data in these reports is encrypted using FHE</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
