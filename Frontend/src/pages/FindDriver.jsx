import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FindDriver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { bookingId, bookingType, bookingDetails } = location.state || {};

  // Format time in MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle cancel search
  const handleCancelSearch = async () => {
    if (!bookingId || !bookingType) {
      navigate('/');
      return;
    }
    try {
      const bookingRef = doc(db, `${bookingType}Transfers`, bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
      toast.info('Ride request cancelled');
      navigate('/');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride. Please try again.');
    }
  };

  // Listen for booking updates
  useEffect(() => {
  // Check if required data is present
  if (!bookingId || !bookingType) {
    console.error('Missing bookingId or bookingType in location state');
    toast.error('Invalid booking reference. Please try again.');
    navigate('/');
    return;
  }

  // Set initial booking details from location state
  if (bookingDetails) {
    setBooking(bookingDetails);
    setIsLoading(false);
  }

  // Subscribe to real-time updates
  const bookingRef = doc(db, `${bookingType}Transfers`, bookingId);
  const unsubscribe = onSnapshot(bookingRef, (doc) => {
    if (doc.exists()) {
      const data = { id: doc.id, ...doc.data() };
      setBooking(data);
      setIsLoading(false);
      
      // If driver is found, navigate to ride details
      if ((data.status === 'driver_found' || data.status === 'accepted') && bookingId) {
        navigate(`/ride-details/${bookingId}`, {
          state: { booking: data, bookingType }
        });
      }
    } else {
      toast.error('Booking not found');
      navigate('/');
    }
  });

  // Start timer
  const timer = setInterval(() => {
    setTimeElapsed(prev => prev + 1);
  }, 1000);

  // Cleanup function
  return () => {
    clearInterval(timer);
    unsubscribe();
  };
}, [bookingId, bookingType, navigate, bookingDetails]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Finding Your Driver</h1>
            <p className="mt-1 text-sm text-gray-500">
              We're searching for the best available driver in your area
            </p>
          </div>

          {/* Loading Animation */}
          <div className="px-6 py-8 text-center">
            <div className="relative h-32 w-32 mx-auto mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 rounded-full border-4 border-orange-100"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full border-4 border-orange-200 animate-ping"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-orange-500 flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Searching for drivers</h2>
            <p className="text-gray-500 mt-2">Time elapsed: {formatTime(timeElapsed)}</p>
            
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(timeElapsed * 2, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {timeElapsed < 30 
                  ? "Searching for the best driver in your area..." 
                  : "Expanding search area to find available drivers..."}
              </p>
            </div>
          </div>

          {/* Booking Summary */}
          {booking && (
            <div className="border-t border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Your Ride Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pickup</p>
                  <p className="text-gray-900">
                    {booking.pickup?.name || booking.pickup?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Drop-off</p>
                  <p className="text-gray-900">
                    {booking.dropoff?.name || booking.dropoff?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Vehicle</p>
                  <p className="text-gray-900">
                    {booking.vehicleDetails?.name || 'Standard'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fare</p>
                  <p className="text-gray-900">
                    ₹{booking.vehicleDetails?.price || '0.00'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex justify-center sm:justify-end">
            <button
              onClick={handleCancelSearch}
              className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Cancel Ride Request
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a href="/contact" className="text-orange-600 hover:text-orange-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FindDriver;
