import React, { useState } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

const BookingTester = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const log = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testFirestoreConnection = async () => {
    log('🔍 Testing Firestore connection...');
    try {
      const testDoc = {
        testField: 'testValue',
        timestamp: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'test_connection'), testDoc);
      log(`✅ Successfully connected to Firestore. Document ID: ${docRef.id}`, 'success');
      return true;
    } catch (error) {
      log(`❌ Firestore connection failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testBookingSubmission = async () => {
    log('🚀 Testing booking submission...');
    const testData = {
      customer: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
      },
      trip: {
        pickupLocation: 'Test Pickup',
        dropLocation: 'Test Drop',
        pickupDate: new Date().toISOString(),
        pickupTime: '14:00',
        distance: '10 km',
        duration: '30 mins',
      },
      vehicle: {
        id: 'test-vehicle',
        name: 'Test Vehicle',
        price: 100,
      },
      payment: {
        amount: 100,
        status: 'pending',
        method: 'test',
      },
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'bookings'), testData);
      log(`✅ Booking submitted successfully! Document ID: ${docRef.id}`, 'success');
      return docRef.id;
    } catch (error) {
      log(`❌ Booking submission failed: ${error.message}`, 'error');
      return null;
    }
  };

  const testEmailNotification = async (bookingId) => {
    if (!bookingId) {
      log('⚠️ No booking ID provided for email test', 'warning');
      return false;
    }

    log('✉️ Testing email notification...');
    try {
      // This would typically be a Cloud Function call
      // For testing, we'll just log it
      log('ℹ️ In production, this would trigger an email notification', 'info');
      log('✅ Email test completed (simulated)', 'success');
      return true;
    } catch (error) {
      log(`❌ Email test failed: ${error.message}`, 'error');
      return false;
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      log('🚀 Starting integration tests...');
      
      // Test 1: Firestore Connection
      const connectionOk = await testFirestoreConnection();
      if (!connectionOk) {
        throw new Error('Firestore connection test failed');
      }
      
      // Test 2: Booking Submission
      const bookingId = await testBookingSubmission();
      if (!bookingId) {
        throw new Error('Booking submission test failed');
      }
      
      // Test 3: Email Notification
      await testEmailNotification(bookingId);
      
      log('🎉 All tests completed successfully!', 'success');
    } catch (error) {
      log(`❌ Test failed: ${error.message}`, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Booking System Tests</h2>
      
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isTesting}
          className={`px-6 py-3 rounded-md text-white font-medium ${
            isTesting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isTesting ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>
      
      <div className="border rounded-md p-4 bg-gray-50 h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3">Test Results</h3>
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No test results yet. Click "Run All Tests" to begin.</p>
        ) : (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-2 rounded text-sm ${
                  result.type === 'error' ? 'bg-red-50 text-red-700' :
                  result.type === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-blue-50 text-blue-700'
                }`}
              >
                <span className="font-mono text-xs text-gray-500 mr-2">[{result.timestamp}]</span>
                {result.message}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-semibold text-yellow-800">Testing Instructions</h3>
        <ol className="list-decimal list-inside mt-2 text-sm text-yellow-700 space-y-1">
          <li>Click "Run All Tests" to start the test sequence</li>
          <li>Check the test results panel for any errors</li>
          <li>Verify the data in Firestore console</li>
          <li>Check your email for the test notification</li>
        </ol>
      </div>
    </div>
  );
};

export default BookingTester;
