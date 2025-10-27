import React, { useState } from 'react';
import { useFhevmClient } from 'fhevm-sdk/react';
import { CONTRACT_CONFIG } from '../lib/config';

function StationRegistration({ onRegistered }) {
  const client = useFhevmClient();
  const [formData, setFormData] = useState({
    location: '',
    operator: ''
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

      if (!formData.location.trim()) {
        throw new Error('Location is required');
      }

      if (!formData.operator.trim()) {
        throw new Error('Operator address is required');
      }

      // Validate operator address
      if (!formData.operator.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error('Invalid operator address format');
      }

      // Get contract instance
      const contract = await client.getContract(
        CONTRACT_CONFIG.address,
        CONTRACT_CONFIG.abi
      );

      // Register station (location and operator are not encrypted in this example)
      // In a production system, you might want to encrypt the location
      const tx = await contract.registerMonitoringStation(
        formData.location,
        formData.operator
      );

      setSuccess('Transaction submitted. Waiting for confirmation...');

      await tx.wait();

      setSuccess('Station registered successfully!');
      setFormData({
        location: '',
        operator: ''
      });

      // Refresh parent data
      if (onRegistered) {
        onRegistered();
      }

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register station');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section">
      <h2>Register Monitoring Station</h2>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="location">Station Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Beijing North District"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="operator">Operator Address</label>
          <input
            type="text"
            id="operator"
            name="operator"
            value={formData.operator}
            onChange={handleChange}
            placeholder="0x..."
            required
            disabled={isSubmitting}
          />
          <small>Ethereum address of the station operator</small>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register Station'}
        </button>
      </form>
    </div>
  );
}

export default StationRegistration;
