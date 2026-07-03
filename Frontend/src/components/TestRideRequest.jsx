import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function TestRideRequest() {
  const [driverId, setDriverId] = useState('');
  const [status, setStatus] = useState('');

  const createTestRequest = async () => {
    if (!driverId) {
      alert('Please enter a driver ID');
      return;
    }

    try {
      const requestData = {
        bookingId: `test-${Date.now()}`,
        customerName: 'Test Customer',
        customerPhone: '1234567890',
        pickupLocation: 'Test Pickup Location',
        dropoffLocation: 'Test Dropoff Location',
        pickupDate: new Date().toISOString(),
        dropoffDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        totalCost: 25.99,
        packageName: 'Test Package',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, `users/${driverId}/incomingRequests`), requestData);
      setStatus('Test ride request created successfully!');
    } catch (error) {
      console.error('Error creating test request:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Test Ride Request</h2>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Driver ID:
          <input
            type="text"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            placeholder="Enter driver's user ID"
          />
        </label>
      </div>
      <button
        onClick={createTestRequest}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Create Test Request
      </button>
      {status && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          {status}
        </div>
      )}
    </div>
  );
}
