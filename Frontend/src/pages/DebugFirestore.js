import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const DebugFirestore = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        console.log('🔍 Debug: User ID:', user.uid);
        
        // Check different collection paths
        const collections = [
          {
            name: 'users/{uid}/bookings',
            path: `users/${user.uid}/bookings`,
            type: 'userBookings'
          },
          {
            name: 'bookings (global)',
            path: 'bookings',
            type: 'globalBookings'
          },
          {
            name: 'airportTransfers',
            path: 'airportTransfers',
            type: 'airport'
          },
          {
            name: 'rides',
            path: 'rides',
            type: 'rides'
          }
        ];

        const allData = [];
        
        for (const collectionInfo of collections) {
          try {
            const collectionRef = collection(db, collectionInfo.path.split('/'));
            const querySnapshot = await getDocs(collectionRef);
            
            console.log(`📂 ${collectionInfo.name}: ${querySnapshot.size} documents`);
            
            querySnapshot.forEach((doc) => {
              const docData = doc.data();
              console.log(`📄 ${collectionInfo.name} - ${doc.id}:`, docData);
              
              // Check if this document belongs to current user
              const belongsToUser = 
                docData.userId === user.uid || 
                docData.user?.uid === user.uid ||
                docData.customerId === user.uid ||
                docData.userEmail === user.email;
              
              if (belongsToUser || collectionInfo.type === 'globalBookings') {
                allData.push({
                  id: doc.id,
                  collection: collectionInfo.name,
                  belongsToUser,
                  ...docData
                });
              }
            });
          } catch (err) {
            console.log(`⚠️ Could not access ${collectionInfo.name}:`, err.message);
          }
        }

        console.log('✅ Total user data found:', allData.length);
        console.log('📊 All data:', allData);
        
        setData(allData);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Firestore</h1>
        <p className="text-red-600">Please log in first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Firestore</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Firestore</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Firestore Data</h1>
      <div className="mb-6">
        <p><strong>User ID:</strong> {user.uid}</p>
        <p><strong>User Email:</strong> {user.email}</p>
      </div>

      <h2 className="text-lg font-semibold mb-2">Collections Checked:</h2>
      <ul className="list-disc pl-5 mb-4">
        <li>users/{user.uid}/bookings</li>
        <li>bookings (global collection)</li>
        <li>airportTransfers</li>
        <li>rides</li>
      </ul>

      <h2 className="text-lg font-semibold mb-2">Found Data: {data.length} documents</h2>
      
      {data.length === 0 ? (
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-yellow-800 font-bold">⚠️ No data found!</p>
          <p className="text-yellow-800 mt-2">
            This means:
            1. Either bookings are not being saved to Firestore
            2. Or they're being saved to a different collection path
            3. Or there's a permission issue
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="bg-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">ID: {item.id}</h3>
                  <p className="text-sm text-gray-600">Collection: {item.collection}</p>
                  <p className={`text-sm ${item.belongsToUser ? 'text-green-600' : 'text-gray-600'}`}>
                    Belongs to user: {item.belongsToUser ? '✅ Yes' : '❌ No'}
                  </p>
                  <p className="text-sm">Status: {item.status || 'No status'}</p>
                  <p className="text-sm">From: {JSON.stringify(item.pickup)}</p>
                  <p className="text-sm">To: {JSON.stringify(item.dropoff)}</p>
                  <p className="text-sm">Fare: ₹{item.fare || item.fareAmount || '0'}</p>
                  <p className="text-sm">Created: {item.createdAt?.toString() || 'No date'}</p>
                </div>
                <button 
                  onClick={() => {
                    console.log('Full data:', item);
                    alert('Check console for full data');
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Log Data
                </button>
              </div>
              
              <div className="mt-2">
                <h4 className="font-semibold text-sm">All Fields:</h4>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-bold text-blue-900 mb-2">Next Steps:</h3>
        <ol className="list-decimal pl-5 text-blue-800">
          <li>Check where bookings are being saved when you book a ride</li>
          <li>Check your booking service file (BookingHistoryService.js)</li>
          <li>Check Firebase console to see actual data</li>
          <li>Update the UserDashboard to read from correct collection</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugFirestore;