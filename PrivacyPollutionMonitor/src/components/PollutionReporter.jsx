import React, { useState } from 'react';
import { useFhevmClient, useEncrypt } from 'fhevm-sdk/react';
import { CONTRACT_CONFIG, POLLUTANT_OPTIONS, SEVERITY_OPTIONS } from '../lib/config';

function PollutionReporter({ onReported }) {
  const client = useFhevmClient();
  const { encrypt, isEncrypting } = useEncrypt();
  const [formData, setFormData] = useState({
    stationId: '',
    pollutionLevel: '',
    pollutantType: '1',
    severity: '2'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (!client) {
        throw new Error('FHEVM client not initialized');
      }

      // Validate inputs
      const stationId = Number(formData.stationId);
      const pollutionLevel = Number(formData.pollutionLevel);
      const pollutantType = Number(formData.pollutantType);
      const severity = Number(formData.severity);

      if (stationId <= 0) {
        throw new Error('Valid station ID is required');
      }

      if (pollutionLevel < 0 || pollutionLevel > 10000) {
        throw new Error('Pollution level must be between 0 and 10000');
      }

      // Encrypt sensitive data using FHEVM SDK
      setSuccess('Encrypting pollution data...');

      // Encrypt pollution level as uint32
      const encryptedLevel = await encrypt(pollutionLevel, 'uint32');

      // Encrypt pollutant type as uint8
      const encryptedType = await encrypt(pollutantType, 'uint8');

      // Encrypt severity as uint32
      const encryptedSeverity = await encrypt(severity, 'uint32');

      setSuccess('Data encrypted. Submitting to blockchain...');

      // Get contract instance
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      // Submit encrypted pollution report
      const tx = await contract.submitPollutionReport(
        stationId,
        encryptedLevel,
        encryptedType,
        encryptedSeverity
      );

      setSuccess('Transaction submitted. Waiting for confirmation...');

      await tx.wait();

      setSuccess('Encrypted pollution report submitted successfully!');

      // Reset form
      setFormData({
        stationId: '',
        pollutionLevel: '',
        pollutantType: '1',
        severity: '2'
      });

      // Refresh parent data
      if (onReported) {
        onReported();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      console.error('Report submission failed:', err);
      setError(err.message || 'Failed to submit pollution report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section">
      <h2>Submit Pollution Report (Encrypted)</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="stationId">Station ID</label>
          <input
            type="number"
            id="stationId"
            name="stationId"
            value={formData.stationId}
            onChange={handleChange}
            placeholder="Enter station ID"
            min="1"
            required
            disabled={isSubmitting || isEncrypting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pollutionLevel">
            Pollution Level (0-10000)
            <span className="encryption-badge">🔐 Encrypted</span>
          </label>
          <input
            type="number"
            id="pollutionLevel"
            name="pollutionLevel"
            value={formData.pollutionLevel}
            onChange={handleChange}
            placeholder="e.g., 850"
            min="0"
            max="10000"
            required
            disabled={isSubmitting || isEncrypting}
          />
          <small>This value will be encrypted using FHE before submission</small>
        </div>

        <div className="form-group">
          <label htmlFor="pollutantType">
            Pollutant Type
            <span className="encryption-badge">🔐 Encrypted</span>
          </label>
          <select
            id="pollutantType"
            name="pollutantType"
            value={formData.pollutantType}
            onChange={handleChange}
            required
            disabled={isSubmitting || isEncrypting}
          >
            {POLLUTANT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="severity">
            Severity Level
            <span className="encryption-badge">🔐 Encrypted</span>
          </label>
          <select
            id="severity"
            name="severity"
            value={formData.severity}
            onChange={handleChange}
            required
            disabled={isSubmitting || isEncrypting}
          >
            {SEVERITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || isEncrypting}
        >
          {isEncrypting ? 'Encrypting...' : isSubmitting ? 'Submitting...' : 'Submit Encrypted Report'}
        </button>

        <div className="info-box">
          <p>
            <strong>🔐 Privacy Notice:</strong> All pollution data is encrypted using
            Fully Homomorphic Encryption (FHE) before being submitted to the blockchain.
            Your sensitive environmental data remains confidential.
          </p>
        </div>
      </form>
    </div>
  );
}

export default PollutionReporter;
