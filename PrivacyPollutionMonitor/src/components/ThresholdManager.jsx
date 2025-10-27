import React, { useState } from 'react';
import { useFhevmClient, useEncrypt } from 'fhevm-sdk/react';
import { CONTRACT_CONFIG, POLLUTANT_OPTIONS } from '../lib/config';

function ThresholdManager() {
  const client = useFhevmClient();
  const { encrypt, isEncrypting } = useEncrypt();
  const [formData, setFormData] = useState({
    pollutantType: '1',
    criticalLevel: '',
    warningLevel: ''
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

      const pollutantType = Number(formData.pollutantType);
      const criticalLevel = Number(formData.criticalLevel);
      const warningLevel = Number(formData.warningLevel);

      if (criticalLevel <= 0 || warningLevel <= 0) {
        throw new Error('Threshold levels must be positive numbers');
      }

      if (warningLevel >= criticalLevel) {
        throw new Error('Warning level must be less than critical level');
      }

      setSuccess('Encrypting threshold values...');

      // Encrypt threshold values as uint32
      const encryptedCritical = await encrypt(criticalLevel, 'uint32');
      const encryptedWarning = await encrypt(warningLevel, 'uint32');

      setSuccess('Thresholds encrypted. Submitting to blockchain...');

      // Get contract instance
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      // Set alert threshold
      const tx = await contract.setAlertThreshold(
        pollutantType,
        encryptedCritical,
        encryptedWarning
      );

      setSuccess('Transaction submitted. Waiting for confirmation...');

      await tx.wait();

      setSuccess('Alert thresholds set successfully!');

      // Reset form
      setFormData({
        pollutantType: '1',
        criticalLevel: '',
        warningLevel: ''
      });

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      console.error('Threshold setting failed:', err);
      setError(err.message || 'Failed to set alert thresholds');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section">
      <h2>Set Alert Thresholds (Encrypted)</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="pollutantType">Pollutant Type</label>
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
          <label htmlFor="warningLevel">
            Warning Level
            <span className="encryption-badge">🔐 Encrypted</span>
          </label>
          <input
            type="number"
            id="warningLevel"
            name="warningLevel"
            value={formData.warningLevel}
            onChange={handleChange}
            placeholder="e.g., 500"
            min="1"
            required
            disabled={isSubmitting || isEncrypting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="criticalLevel">
            Critical Level
            <span className="encryption-badge">🔐 Encrypted</span>
          </label>
          <input
            type="number"
            id="criticalLevel"
            name="criticalLevel"
            value={formData.criticalLevel}
            onChange={handleChange}
            placeholder="e.g., 1000"
            min="1"
            required
            disabled={isSubmitting || isEncrypting}
          />
          <small>Critical level must be higher than warning level</small>
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
          {isEncrypting ? 'Encrypting...' : isSubmitting ? 'Setting...' : 'Set Encrypted Thresholds'}
        </button>
      </form>
    </div>
  );
}

export default ThresholdManager;
