import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';

export default function DriverAssignmentModal({ 
  isOpen, 
  onClose, 
  bookingId,
  onDriverAssigned 
}) {
  const [status, setStatus] = useState('searching'); // searching, found, accepted, error
  const [driver, setDriver] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    
    setStatus('searching');
    setDriver(null);
    setProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90)); // Cap at 90% until driver accepts
    }, 1000);

    // Listen for booking updates
    const bookingRef = doc(db, 'bookings', bookingId);
    const unsubscribe = onSnapshot(bookingRef, (doc) => {
      const bookingData = doc.data();
      
      if (bookingData.driverAssigned) {
        setStatus('found');
        setDriver(bookingData.driverInfo);
        setProgress(100);
        
        // If driver accepted, close modal after delay
        if (bookingData.status === 'driver_accepted') {
          setStatus('accepted');
          setTimeout(() => {
            onDriverAssigned(bookingData);
            onClose();
          }, 2000);
        }
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  const statusMessages = {
    searching: 'Searching for available drivers...',
    found: 'Driver found! Waiting for confirmation...',
    accepted: 'Driver confirmed! Redirecting to payment...',
    error: 'Unable to find a driver. Please try again.'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Finding Your Driver</h2>
        
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <motion.div 
              className="bg-blue-600 h-2.5 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">{statusMessages[status]}</p>
        </div>

        {status === 'found' && driver && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">Driver Found!</h3>
            <p className="text-sm">{driver.fullName} is available for your trip.</p>
            <div className="mt-2 flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-2">
                {driver.photoURL ? (
                  <img 
                    src={driver.photoURL} 
                    alt={driver.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-600">
                    {driver.fullName?.charAt(0) || 'D'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium">{driver.fullName}</p>
                <p className="text-sm text-gray-600">
                  {driver.vehicle?.model || 'Car'} • {driver.vehicle?.number || 'MH12 AB 1234'}
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'searching' && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            disabled={status === 'accepted'}
          >
            {status === 'accepted' ? 'Processing...' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
