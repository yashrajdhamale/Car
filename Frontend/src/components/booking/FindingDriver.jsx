import React, { useEffect, useState, useRef } from 'react';
import { FaCar, FaSpinner, FaCheckCircle, FaUser, FaPhone, FaCarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';

const FindingDriver = ({ bookingId, onTimeout, onDriverFound, isHoliday = false }) => {
  const [status, setStatus] = useState('searching');
  const [driverInfo, setDriverInfo] = useState(null);
  const [packageInfo, setPackageInfo] = useState(null);
  const [countdown, setCountdown] = useState(120); // 2 minutes in seconds
  const [timeElapsed, setTimeElapsed] = useState(0);
  const unsubscribeRef = useRef(() => {}); // Store unsubscribe function

  // Handle countdown timer
  useEffect(() => {
    if (!bookingId) {
      console.error('No bookingId provided to FindingDriver component');
      return () => {}; // Return empty cleanup function
    }

    console.log(`[${new Date().toISOString()}] Setting up timer for booking:`, bookingId);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        if (newCount % 10 === 0 || newCount < 10) {
          console.log(`[${new Date().toISOString()}] Time remaining: ${newCount}s`);
        }
        
        if (newCount <= 0) {
          console.warn(`[${new Date().toISOString()}] Countdown reached zero for booking:`, bookingId);
          clearInterval(timer);
          if (onTimeout) {
            console.log('Calling onTimeout callback');
            // Use setTimeout to move the onTimeout call to the next tick
            setTimeout(() => {
              try {
                onTimeout();
              } catch (error) {
                console.error('Error in onTimeout callback:', error);
              }
            }, 0);
          }
          return 0;
        }
        return newCount;
      });
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      console.log(`[${new Date().toISOString()}] Cleaning up timer for booking:`, bookingId);
      clearInterval(timer);
    };
  }, [bookingId, onTimeout]);

  // Set up Firestore listener
  useEffect(() => {
    if (!bookingId) {
      console.error('No bookingId provided to FindingDriver component');
      return () => {}; // Return empty cleanup function
    }

    console.log(`[${new Date().toISOString()}] Setting up Firestore listener for booking:`, bookingId);
    let retryCount = 0;
    const maxRetries = 3;
    let isMounted = true;
    let unsubscribe = () => {
      console.log(`[${new Date().toISOString()}] Unsubscribed from booking updates:`, bookingId);
    };

    const setupListener = () => {
      if (!isMounted) return;
      
      const collectionName = isHoliday ? "holidayBookings" : "bookings";
      const bookingRef = doc(db, collectionName, bookingId);
      
      console.log(`[${new Date().toISOString()}] Listening to document: ${collectionName}/${bookingId}`);
      
      try {
        // Store unsubscribe function in ref
        unsubscribeRef.current = onSnapshot(
          bookingRef,
          async (doc) => {
            if (!isMounted) return;
            
            if (!doc.exists()) {
              console.warn(`[${new Date().toISOString()}] No document found for booking:`, bookingId);
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`[${new Date().toISOString()}] Retrying (${retryCount}/${maxRetries})...`);
                // Wait 1 second before retrying
                setTimeout(setupListener, 1000);
              } else {
                console.error(`[${new Date().toISOString()}] Max retries reached, giving up on booking:`, bookingId);
                setStatus('error');
                if (onTimeout) {
                  try {
                    onTimeout();
                  } catch (error) {
                    console.error('Error in onTimeout callback:', error);
                  }
                }
              }
              return;
            }

            const data = doc.data();
            console.log(`[${new Date().toISOString()}] Booking update received:`, data);

            // Handle package info for holiday bookings
            if (isHoliday && data.package) {
              console.log('Package info:', data.package);
              setPackageInfo(data.package);
            }

            // Handle driver assignment
            if (data.driverId || data.assignedDriver || data.status === 'driver_assigned') {
              console.log(`[${new Date().toISOString()}] Driver assigned, processing driver data`);
              
              // First, ensure we have the latest data
              const latestData = { ...data, id: doc.id };
              
              // Extract driver data from the most recent document
              const driverData = data.assignedDriver || {
                id: data.driverId,
                name: data.driverName || 'Your Driver',
                phone: data.driverPhone || 'Not available',
                vehicle: data.vehicle || { name: 'Standard Vehicle' },
                photoURL: data.driverPhotoURL || null,
                rating: data.driverRating || 4.5,
                totalRides: data.driverTotalRides || 0
              };
              
              console.log('Driver data found:', driverData);
              
              // Update local state
              setStatus('found');
              setDriverInfo(driverData);
              
              // If we have a callback, process the driver found event
              if (onDriverFound) {
                try {
                  // Prepare the driver info object
                  const driverInfo = {
                    ...latestData,
                    id: doc.id,
                    driverInfo: driverData,  // Ensure this matches what handleDriverAssigned expects
                    assignedDriver: driverData,
                    status: 'driver_assigned',
                    // Include all driver fields at the top level for backward compatibility
                    driverId: driverData.id,
                    driverName: driverData.name,
                    driverPhone: driverData.phone,
                    driverPhotoURL: driverData.photoURL,
                    driverRating: driverData.rating,
                    driverTotalRides: driverData.totalRides,
                    vehicle: driverData.vehicle
                  };
                  
                  console.log('Calling onDriverFound with:', driverInfo);
                  onDriverFound(driverInfo);
                } catch (error) {
                  console.error('Error updating booking status:', error);
                }
              }
            }
          },
          (error) => {
            console.error('Error in booking listener:', error);
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Retrying after error (${retryCount}/${maxRetries})...`);
              // Wait 1 second before retrying
              setTimeout(setupListener, 1000);
            } else {
              console.error('Max retries reached after errors, giving up');
              setStatus('error');
              if (onTimeout) {
                try {
                  onTimeout();
                } catch (timeoutError) {
                  console.error('Error in onTimeout callback:', timeoutError);
                }
              }
            }
          }
        );
      } catch (error) {
        console.error('Error setting up Firestore listener:', error);
      }
    };

    // Initial setup
    setupListener();

    // Cleanup function
    return () => {
      console.log('Cleaning up Firestore listener for booking:', bookingId);
      if (typeof unsubscribeRef.current === 'function') {
        unsubscribeRef.current();
      }
    };
  }, [bookingId, isHoliday, onDriverFound, onTimeout]);

  // Handle driver found state
  useEffect(() => {
    if (status === 'found' && driverInfo) {
      // Clear any existing timeouts
      const timer = setTimeout(() => {
        // This will be handled by the parent component
      }, 3000); // Give some time for the parent to handle the navigation
      
      return () => clearTimeout(timer);
    }
  }, [status, driverInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`[${new Date().toISOString()}] FindingDriver unmounting, cleaning up...`);
      // Clear any pending timeouts or intervals
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = highestTimeoutId; i >= 0; i--) {
        clearTimeout(i);
        clearInterval(i);
      }
      // Clear any Firestore listeners
      if (typeof unsubscribeRef.current === 'function') {
        unsubscribeRef.current();
      }
    };
  }, []); // No dependencies needed as we're using ref

  // Render loading state
  if (!bookingId) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <div className="text-red-500 mb-4">
          <FaSpinner className="animate-spin text-4xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No Booking ID Provided</h3>
        <p className="text-gray-600 text-center">
          We couldn't find a valid booking reference. Please try again or contact support.
        </p>
      </div>
    );
  }

  // Render driver found state
  if (status === 'found' && driverInfo) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
        <div className="text-green-500 mb-4">
          <FaCheckCircle className="text-5xl" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Driver Found!</h3>
        <p className="text-gray-600 mb-4">Your driver is on the way</p>
        
        <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg mt-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <FaUser className="text-blue-500 text-xl" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{driverInfo.name}</h4>
              <div className="flex items-center text-sm text-gray-500">
                <FaCarAlt className="mr-1" />
                {driverInfo.vehicle ? (typeof driverInfo.vehicle === 'string' ? driverInfo.vehicle : driverInfo.vehicle.name || 'Standard Vehicle') : 'Standard Vehicle'}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FaMapMarkerAlt className="mr-1" />
                {driverInfo.distance ? `${driverInfo.distance.toFixed(1)} km away` : 'Nearby'}
              </div>
            </div>
            <a 
              href={`tel:${driverInfo.phone}`}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full"
            >
              <FaPhone />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Render searching state
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-md">
      <div className="relative mb-6">
        <FaCar className="text-5xl text-blue-500 animate-pulse" />
        <div className="absolute -inset-2 border-4 border-dashed border-blue-200 rounded-full animate-spin-slow opacity-50"></div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {isHoliday ? 'Finding a Holiday Driver' : 'Finding a Driver'}
      </h3>
      
      <p className="text-gray-600 mb-4 text-center">
        {status === 'searching' 
          ? 'Searching for available drivers in your area...'
          : 'Your driver is arriving soon'}
      </p>
      
      <div className="w-full max-w-xs bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Time remaining:</span>
          <span className="font-medium">
            {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeElapsed / 120) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {isHoliday && packageInfo && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg w-full max-w-xs">
          <h4 className="font-medium text-blue-800 mb-1">Your Package</h4>
          <p className="text-sm text-blue-700">{packageInfo.name}</p>
          {packageInfo.duration && (
            <p className="text-xs text-blue-600">
              {packageInfo.duration} {packageInfo.pax ? `• ${packageInfo.pax} pax` : ''}
            </p>
          )}
        </div>
      )}
      
      <button
        onClick={onTimeout}
        className="mt-6 px-6 py-2 bg-red-100 text-red-600 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
      >
        Cancel Request
      </button>
    </div>
  );
};

export default FindingDriver;