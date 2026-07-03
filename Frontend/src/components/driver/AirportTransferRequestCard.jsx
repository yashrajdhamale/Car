// In src/components/driver/AirportTransferRequestCard.jsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const AirportTransferRequestCard = ({ request, onAction, isProcessing, action }) => {
  const [rideDetails, setRideDetails] = useState(request);
  const [loading, setLoading] = useState(false);

  // Fetch real-time updates for the ride request
  useEffect(() => {
    console.log('Request data in AirportTransferRequestCard:', request);
    
    if (!request?.id) {
      // If we have request data directly, use it
      if (request) {
        setRideDetails(prev => ({
          ...prev,
          ...request,
          id: request.id || request.docId || '',
          // Ensure we have all required fields with fallbacks
          pickupAddress: request.pickupAddress || request.pickupLocation?.name || request.pickupLocation || request.pickup || 'Not specified',
          dropoffAddress: request.dropoffAddress || request.dropoffLocation?.name || request.dropoffLocation || request.dropoff || 'Not specified',
          pickupTime: request.pickupTime || request.dateTime || new Date(),
          passengers: request.passengers || request.numPassengers || 1,
          vehicleType: request.vehicleType || request.vehicleDetails?.type || 'Standard',
          note: request.note || request.specialInstructions || ''
        }));
      }
      return;
    }
    
    const requestRef = doc(db, 'airportTransfers', request.id);
    const unsubscribe = onSnapshot(requestRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('Fetched ride details from Firestore:', data);
          
          setRideDetails(prev => ({
            ...prev,
            id: doc.id,
            // Map all possible field names to ensure consistency
            ...data,
            pickupAddress: data.pickupAddress || data.pickupLocation?.name || data.pickupLocation || data.pickup || 'Not specified',
            dropoffAddress: data.dropoffAddress || data.dropoffLocation?.name || data.dropoffLocation || data.dropoff || 'Not specified',
            pickupTime: data.pickupTime || data.dateTime || data.pickupDateTime || new Date(),
            passengers: data.passengers || data.numPassengers || 1,
            vehicleType: data.vehicleType || data.vehicleDetails?.type || 'Standard',
            flightNumber: data.flightNumber || data.flightInfo?.number || '',
            note: data.note || data.specialInstructions || '',
            // Preserve any additional fields
            ...(request || {})
          }));
        }
      },
      (error) => {
        console.error('Error fetching ride details:', error);
        toast.error('Failed to load ride details');
      }
    );

    return () => {
      console.log('Unsubscribing from ride updates');
      unsubscribe();
    };
  }, [request?.id, request]);

  const handleAction = async (actionType) => {
    if (isProcessing) return;
    try {
      setLoading(true);
      await onAction(rideDetails, actionType);
    } catch (error) {
      console.error('Error processing action:', error);
      toast.error(error.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to safely get location display text
  const getLocationDisplay = (location) => {
    if (!location) return 'Not specified';
    if (typeof location === 'string') return location;
    if (location.name) return location.name;
    if (location.address) return location.address;
    if (location.formatted_address) return location.formatted_address;
    return 'Location';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      searching_driver: { text: 'Searching Driver', color: 'bg-blue-100 text-blue-800' },
      accepted: { text: 'Accepted', color: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
      completed: { text: 'Completed', color: 'bg-purple-100 text-purple-800' },
      cancelled: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-2 border-blue-400 mb-3 transition-all duration-200 hover:shadow-md text-base">
      <div className="p-1.5 sm:p-1.5">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <span className="text-blue-500 mr-1 text-base">✈️</span>
            <h3 className="font-semibold text-base">Airport Transfer</h3>
          </div>
          {getStatusBadge(rideDetails.status || 'pending')}
        </div>

        <div className="space-y-1.5">
          {/* Pickup Section */}
          <div className="bg-gray-50 p-1 rounded">
            <div className="flex items-start">
              <div className="bg-green-100 p-1 rounded-full mr-1.5 mt-0.5">
                <span className="text-green-600 text-xs">↑</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Pickup</p>
                <p className="font-medium text-sm truncate" title={getLocationDisplay(rideDetails.pickupLocation || rideDetails.pickupAddress || rideDetails.pickup)}>
                  {getLocationDisplay(rideDetails.pickupLocation || rideDetails.pickupAddress || rideDetails.pickup)}
                </p>
                {(rideDetails.pickupLandmark) && (
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-medium">Landmark:</span> {rideDetails.pickupLandmark}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dropoff Section */}
          <div className="bg-gray-50 p-1 rounded">
            <div className="flex items-start">
              <div className="bg-red-100 p-1 rounded-full mr-1.5 mt-0.5">
                <span className="text-red-600 text-xs">↓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 font-medium">Dropoff</p>
                <p className="font-medium text-sm truncate" title={getLocationDisplay(rideDetails.dropoffLocation || rideDetails.dropoffAddress || rideDetails.dropoff)}>
                  {getLocationDisplay(rideDetails.dropoffLocation || rideDetails.dropoffAddress || rideDetails.dropoff)}
                </p>
                {(rideDetails.dropoffLandmark) && (
                  <p className="text-xs text-gray-500 truncate">
                    <span className="font-medium">Landmark:</span> {rideDetails.dropoffLandmark}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <div className="bg-gray-50 p-1 rounded">
              <div className="flex items-center text-gray-600 space-x-1">
                <span className="text-xs">🕒</span>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 whitespace-nowrap">Date & Time</p>
                  <p className="font-medium text-xs truncate" title={formatDate(rideDetails.pickupTime)}>
                    {formatDate(rideDetails.pickupTime)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-1 rounded">
              <div className="flex items-center text-gray-600 space-x-1">
                <span className="text-xs">🚗</span>
                <div>
                  <p className="text-[10px] text-gray-500">Vehicle</p>
                  <p className="font-medium text-xs">{rideDetails.vehicleType || 'Standard'}</p>
                </div>
              </div>
            </div>

            {rideDetails.flightNumber && (
              <div className="bg-gray-50 p-1 rounded">
                <div className="flex items-center text-gray-600 space-x-1">
                  <span className="text-xs">✈️</span>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-gray-500">Flight</p>
                    <p className="font-medium text-xs truncate" title={rideDetails.flightNumber}>
                      {rideDetails.flightNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Notes */}
          {rideDetails.note && (
            <div className="mt-1 p-1 bg-blue-50 rounded text-xs">
              <div className="flex items-start">
                <span className="text-blue-500 mr-1 text-xs mt-0.5">📝</span>
                <div className="flex-1">
                  <p className="font-medium text-blue-700 text-[10px] mb-0.5">Special Instructions</p>
                  <p className="text-gray-700 text-xs line-clamp-2">{rideDetails.note}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {(rideDetails.status === 'pending' || rideDetails.status === 'searching_driver') && (
          <div className="flex space-x-2 mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => handleAction('reject')}
              disabled={isProcessing && action === 'reject'}
              className={`px-4 py-2.5 rounded-md text-white text-sm font-medium transition-colors duration-200 flex-1 ${
                isProcessing && action === 'reject'
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
              }`}
            >
              {isProcessing && action === 'reject' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rejecting
                </span>
              ) : 'Reject'}
            </button>
            <button
              onClick={() => handleAction('accept')}
              disabled={isProcessing && action === 'accept'}
              className={`px-4 py-2.5 rounded-md text-white text-sm font-medium transition-colors duration-200 flex-1 ${
                (isProcessing && action === 'accept')
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 active:bg-green-700'
              }`}
            >
              {isProcessing && action === 'accept' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Accepting
                </span>
              ) : 'Accept'}
            </button>
          </div>
        )}
        
        {/* Show assigned driver info if accepted */}
        {rideDetails.status === 'accepted' && rideDetails.driverId && (
          <div className="mt-2 p-2 bg-green-50 rounded border border-green-100 text-xs">
            <div className="flex items-center">
              <div className="bg-green-100 p-1 rounded-full mr-2">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium text-green-800 text-sm">Ride Accepted</p>
                <p className="text-[10px] text-green-600">Contact passenger for pickup</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirportTransferRequestCard;