// In src/pages/driver/AirportTransferRequests.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import DriverLayout from '../../components/driver/DriverLayout';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';

const AirportTransferRequests = () => {
  const { user } = useUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAirportTransfers = async () => {
      try {
        const q = query(
          collection(db, 'airportTransfers'),
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        const transfers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(transfers);
      } catch (error) {
        console.error('Error fetching airport transfers:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAirportTransfers();
      
      // Set up real-time listener
      const q = query(
        collection(db, 'airportTransfers'),
        where('status', '==', 'pending')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const updatedTransfers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRequests(updatedTransfers);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleAccept = async (requestId) => {
    if (!user) return;

    try {
      const requestRef = doc(db, 'airportTransfers', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        driverId: user.uid,
        driverName: user.displayName || 'Driver',
        acceptedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  if (loading) {
    return (
      <DriverLayout>
        <div className="p-6">Loading airport transfer requests...</div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Airport Transfer Requests</h1>
        
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No pending airport transfer requests</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {request.pickupLocation?.name} → {request.dropoffLocation?.name}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-medium">
                        {request.pickupTime?.toDate ? 
                          format(request.pickupTime.toDate(), 'PPp') : 
                          'N/A'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Passengers</p>
                        <p className="font-medium">{request.passengers || 1}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-medium">{request.vehicleDetails?.name || 'Standard'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Fare</p>
                      <p className="font-medium text-lg text-orange-600">
                        ₹{request.vehicleDetails?.price?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleAccept(request.id)}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Accept Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DriverLayout>
  );
};

export default AirportTransferRequests;