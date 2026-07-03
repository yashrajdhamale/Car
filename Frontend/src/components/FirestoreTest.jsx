import React, { useState } from 'react';
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@config/firebase';
import { toast } from 'react-toastify';

const FirestoreTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const log = (message, type = 'info') => {
    console.log(`[${type.toUpperCase()}]`, message);
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };

  const testFirestore = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    try {
      log('Starting Firestore connection test...');
      
      // Test 1: Write a document
      log('Test 1: Writing test document...');
      const testData = {
        message: 'Test Firestore connection',
        timestamp: new Date().toISOString(),
        testField: 'testValue'
      };
      
      const docRef = doc(collection(db, 'test_collection'));
      await setDoc(docRef, testData);
      log(`✅ Document written with ID: ${docRef.id}`);
      
      // Test 2: Read the document back
      log('Test 2: Reading test document...');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        log(`✅ Document read successfully: ${JSON.stringify(docSnap.data())}`);
      } else {
        log('❌ Document not found after write', 'error');
      }
      
      // Test 3: List collections
      log('Test 3: Listing collections...');
      // Note: Listing collections is not directly available in v9+ web SDK
      // This is a simple alternative
      const testQuery = await getDocs(collection(db, 'test_collection'));
      log(`✅ Found ${testQuery.size} documents in test_collection`);
      
      toast.success('Firestore tests completed successfully!');
      
    } catch (error) {
      console.error('Firestore test failed:', error);
      log(`❌ Test failed: ${error.message}`, 'error');
      toast.error(`Test failed: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Firestore Connection Test</h2>
      <button
        onClick={testFirestore}
        disabled={isTesting}
        className={`px-4 py-2 rounded-md text-white font-medium ${
          isTesting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isTesting ? 'Testing...' : 'Run Firestore Tests'}
      </button>
      
      <div className="mt-6 space-y-2">
        <h3 className="font-semibold text-lg">Test Results:</h3>
        <div className="bg-gray-50 p-4 rounded-md h-64 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 ? (
            <p className="text-gray-500">No test results yet. Click the button above to run tests.</p>
          ) : (
            testResults.map((result, index) => (
              <div 
                key={index} 
                className={`py-1 ${result.type === 'error' ? 'text-red-600' : 'text-gray-800'}`}
              >
                [{new Date(result.timestamp).toLocaleTimeString()}] {result.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FirestoreTest;
