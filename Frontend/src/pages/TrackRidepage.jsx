import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UberStyleTracking } from '../utils/uberTracking';
import { CustomerLocationService } from '../services/firebaseService';
import MapWithTracking from '../components/MapWithTracking';

const TrackRidePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const bookingId = state?.bookingId;
  const details = state?.bookingDetails || {};
  
  const [bookingData, setBookingData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [liveRoute, setLiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDescription, setCancelDescription] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundPhone, setRefundPhone] = useState('');
  
  const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
  const [trackingService] = useState(() => 
    new UberStyleTracking(MAP_MY_INDIA_API_KEY, true)
  );
  
  const unsubscribeRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const driverLocationRef = useRef(null);
  const previousDriverLoc = useRef(null);
  const locationHistoryRef = useRef([]);
  const isInitializedRef = useRef(false);
  const toastShownRef = useRef(false); // To prevent multiple toast messages

  const updateCustomerLocation = useCallback(async () => {
    if (!bookingId || !user?.uid || isCancelled || isCompleted) return;

    try {
      if (!navigator.geolocation) {
        toast.error('Your browser does not support location services');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || null
          };

          console.log('📍 Customer location updated:', userLocation);
          
          try {
            await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
            setCustomerLocation(userLocation);
            
            if (driverLocationRef.current) {
              await calculateUberETA(driverLocationRef.current, userLocation);
            }
          } catch (error) {
            console.error('Error updating customer location in Firebase:', error);
          }
        },
        (error) => {
          // Suppress timeout errors as they're common and not user-actionable
          if (error.code === 3) { // TIMEOUT error
            console.log('Location request timed out - will retry later');
            return;
          }
          
          // Only log other errors silently without showing to user
          console.log('Location unavailable:', error.code === 1 ? 'Permission denied' : error.code === 2 ? 'Position unavailable' : error.message);
          
          // Only show toast for permission denied errors
          if (error.code === 1 && !toastShownRef.current) {
            toast.error('Location access is needed for better tracking experience');
            toastShownRef.current = true;
            // Reset after 30 seconds to allow future messages
            setTimeout(() => { toastShownRef.current = false; }, 30000);
          }
        },
        { 
          enableHighAccuracy: false, 
          timeout: 5000, // Reduced timeout to fail faster
          maximumAge: 60000 // Use cached location for up to 1 minute
        }
      );
    } catch (error) {
      console.error('Update location error:', error);
    }
  }, [bookingId, user?.uid, isCancelled, isCompleted]);

  const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
    try {
      console.log('📍 Calculating ETA between:', {
        driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
        customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
      });
      
      const newLocation = {
        ...driverLoc,
        timestamp: Date.now()
      };
      
      locationHistoryRef.current.push(newLocation);
      
      if (locationHistoryRef.current.length > 10) {
        locationHistoryRef.current.shift();
      }
      
      const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
      if (route) {
        setLiveRoute(route);
        
        const trafficFactor = route.trafficFactor || 1.2;
        const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
        const formattedDistance = trackingService.formatDistance(route.distance);
        const formattedETA = trackingService.formatETA(etaMinutes);
        
        setDistance(formattedDistance);
        setEta(formattedETA);
        
        console.log('🚕 Tracking info:', {
          distance: formattedDistance,
          eta: formattedETA,
          distanceMeters: route.distance,
          etaMinutes,
          trafficFactor,
          fromMockAPI: route.mock,
          fromDirect: route.direct,
          fromFallback: route.fallback
        });
        
        return { distance: formattedDistance, eta: formattedETA };
      }
    } catch (error) {
      console.error('ETA calculation error:', error);
      
      const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
      const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
      const formattedDistance = trackingService.formatDistance(simpleDistance);
      const formattedETA = trackingService.formatETA(simpleETA);
      
      setDistance(formattedDistance);
      setEta(formattedETA);
      
      console.log('⚠️ Using fallback calculation:', {
        distance: formattedDistance,
        eta: formattedETA
      });
      
      return { distance: formattedDistance, eta: formattedETA };
    }
  }, [trackingService]);

  // Handle cancellation toast - show only once
  const showCancellationToast = useCallback(() => {
    if (!toastShownRef.current && cancellationInfo) {
      toast.error('🚫 This ride has been cancelled by the driver', {
        autoClose: 5000,
        closeButton: true,
        toastId: 'cancellation-toast' // Unique ID to prevent duplicates
      });
      toastShownRef.current = true;
    }
  }, [cancellationInfo]);

  // Handle completion toast - show only once
  const showCompletionToast = useCallback(() => {
    if (!toastShownRef.current && isCompleted) {
      toast.success('🎉 Ride completed successfully!', {
        autoClose: 5000,
        closeButton: true,
        toastId: 'completion-toast'
      });
      toastShownRef.current = true;
    }
  }, [isCompleted]);

  useEffect(() => {
    if (!bookingId) {
      console.log('❌ No booking ID provided');
      setLoading(false);
      toast.error('No booking ID provided');
      return;
    }

    if (isInitializedRef.current) {
      console.log('⚠️ Already initialized, skipping...');
      return;
    }

    isInitializedRef.current = true;
    console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

    unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
      bookingId,
      async (data) => {
        if (data.error) {
          console.error('Tracking error:', data.error);
          toast.error('Failed to track ride');
          setLoading(false);
          return;
        }

        const { bookingData, driverLocation, customerLocation } = data;
        
        setBookingData(bookingData);
        
        // Check ride status
        if (bookingData.status === 'cancelled') {
          setIsCancelled(true);
          setIsCompleted(false);
          setCancellationInfo({
            cancelledAt: bookingData.cancelledAt,
            cancelledBy: bookingData.cancelledBy,
            cancelledReason: bookingData.cancelledReason || 'Ride cancelled by driver',
            cancelledDriverName: bookingData.cancelledDriverName || 'Driver'
          });
          
          // Show cancellation toast only once
          showCancellationToast();
          
          // Clear location intervals for cancelled rides
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
          }
        } else if (bookingData.status === 'completed') {
          setIsCompleted(true);
          setIsCancelled(false);
          setCancellationInfo(null);
          
          // Show completion toast only once
          showCompletionToast();
          
          // Clear location intervals for completed rides
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
          }
        } else {
          // Ride is active
          setIsCancelled(false);
          setIsCompleted(false);
          setCancellationInfo(null);
          toastShownRef.current = false; // Reset toast flag if ride is active again
        }
        
        // Set driver info if available
        if (bookingData.driverId && bookingData.status !== 'cancelled') {
          setDriverInfo({
            name: bookingData.driverName || 'Driver',
            phone: bookingData.driverPhone || 'Not available',
            vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
            rating: bookingData.driverRating || '4.8',
            driverId: bookingData.driverId
          });
        } else if (bookingData.status === 'cancelled') {
          setDriverInfo(null);
        }
        
        if (customerLocation) {
          setCustomerLocation(customerLocation);
        }
        
        if (driverLocation && !driverLocation.error && !isCancelled && !isCompleted) {
          if (driverLocationRef.current) {
            previousDriverLoc.current = driverLocationRef.current;
          }
          
          driverLocationRef.current = driverLocation;
          setDriverLocation(driverLocation);
          
          if (customerLocation) {
            await calculateUberETA(driverLocation, customerLocation);
          }
        } else if (driverLocation?.error) {
          console.warn('Driver location error:', driverLocation.error);
        }
        
        setLoading(false);
      }
    );

    // Start location updates only for active rides
    if (bookingData?.status && !['cancelled', 'completed'].includes(bookingData.status)) {
      updateCustomerLocation();
      locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
    } else if (!isCancelled && !isCompleted) {
      // Initial location update for active rides
      updateCustomerLocation();
    }

    return () => {
      console.log('🧹 Cleaning up tracking listeners');
      isInitializedRef.current = false;
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [bookingId, calculateUberETA, updateCustomerLocation, isCancelled, isCompleted, showCancellationToast, showCompletionToast]);

  // Start/stop location updates based on ride status
  useEffect(() => {
    if (!bookingData) return;

    if (isCancelled || isCompleted) {
      // Stop location updates for cancelled/completed rides
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    } else if (bookingData.status && !['cancelled', 'completed'].includes(bookingData.status)) {
      // Start/continue location updates for active rides
      if (!locationIntervalRef.current) {
        updateCustomerLocation();
        locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
      }
    }
  }, [isCancelled, isCompleted, bookingData, updateCustomerLocation]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAddress = (location) => {
    if (!location) return 'Location not available';
    if (typeof location === 'string') return location;
    if (location.name) return location.name;
    if (location.address) return location.address;
    return 'Location specified';
  };

  const handleRefresh = () => {
    if (!isCancelled && !isCompleted) {
      updateCustomerLocation();
      toast.info('Refreshing your location...');
    } else {
      toast.info('Refreshing ride information...');
    }
  };

  const openMapNavigation = () => {
    if (driverLocation && !isCancelled && !isCompleted) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
        '_blank'
      );
    }
  };

  const handleCallDriver = () => {
    if (driverInfo?.phone && driverInfo.phone !== 'Not available' && !isCancelled && !isCompleted) {
      window.location.href = `tel:${driverInfo.phone}`;
    } else {
      toast.error('Driver phone number not available');
    }
  };

  const handleBookNewRide = () => {
    navigate('/local-pickup', { 
      state: { 
        pickup: details.pickup,
        dropoff: details.dropoff,
        vehicleDetails: details.vehicleDetails,
        travelDate: details.travelDate,
        hour: details.hour,
        minute: details.minute
      }
    });
  };

  const handleCancelRide = () => {
    if (!isCancelled && !isCompleted) {
      setShowCancelForm(true);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!cancelReason.trim()) {
      toast.error('Please select a cancellation reason');
      return;
    }
    
    if (!refundAccount.trim()) {
      toast.error('Please enter your refund account details');
      return;
    }
    
    if (!refundPhone.trim()) {
      toast.error('Please enter your phone number for refund');
      return;
    }
    
    try {
      // Here you would normally send this data to your backend
      // For now, we'll simulate an API call
      const cancelData = {
        bookingId,
        userId: user?.uid,
        cancelReason,
        cancelDescription,
        refundAccount,
        refundPhone,
        timestamp: new Date().toISOString()
      };
      
      console.log('Cancellation data:', cancelData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cancellation request submitted successfully!');
      setShowCancelForm(false);
      
      // Reset form
      setCancelReason('');
      setCancelDescription('');
      setRefundAccount('');
      setRefundPhone('');
      
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Failed to submit cancellation request');
    }
  };

  const handleCancelClose = () => {
    setShowCancelForm(false);
    setCancelReason('');
    setCancelDescription('');
    setRefundAccount('');
    setRefundPhone('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Starting live tracking...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're trying to track doesn't exist</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 w-full sm:w-auto"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isRideActive = !isCancelled && !isCompleted && 
    ['searching_driver', 'accepted', 'driver_arrived', 'in_progress'].includes(bookingData?.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      
      {/* Cancellation Form Modal */}
      {showCancelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Cancel Ride & Request Refund</h3>
                <button
                  onClick={handleCancelClose}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="driver_delayed">Driver is delayed</option>
                    <option value="change_of_plans">Change of plans</option>
                    <option value="found_alternative">Found alternative transport</option>
                    <option value="emergency">Emergency situation</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={cancelDescription}
                    onChange={(e) => setCancelDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Please provide more details about why you're cancelling..."
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account for Refund *
                    </label>
                    <input
                      type="text"
                      value={refundAccount}
                      onChange={(e) => setRefundAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bank account number / UPI ID / Wallet number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number for Refund *
                    </label>
                    <input
                      type="tel"
                      value={refundPhone}
                      onChange={(e) => setRefundPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your registered phone number"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Submit Cancellation
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  * Refunds will be processed within 3-5 business days
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                {isCancelled ? 'Ride Cancelled' : 
                 isCompleted ? 'Ride Completed' : 
                 'Live Ride Tracking'}
              </h1>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center truncate">
              Booking: {bookingId?.substring(0, 8)}...
              {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6">
        {/* Status Banner */}
        <div className={`${
          isCancelled ? 'bg-gradient-to-r from-red-500 to-red-600' : 
          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' :
          'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white rounded-xl p-4 mb-4 shadow-lg`}>
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold mb-1">Current Status</h2>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  isCancelled ? 'bg-red-400' :
                  isCompleted ? 'bg-green-400' :
                  bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
                  bookingData?.status === 'accepted' ? 'bg-green-400' :
                  bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
                  bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-base font-semibold">
                  {isCancelled && '🚫 Ride Cancelled'}
                  {isCompleted && '✅ Ride Completed'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'accepted' && '✅ Driver assigned'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
                  {!isCancelled && !isCompleted && !bookingData?.status && 'Status unavailable'}
                </span>
              </div>
            </div>
            
            {isRideActive && distance && eta && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs opacity-90">Distance to you</div>
                    <div className="text-xl font-bold">{distance}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-90">Estimated arrival</div>
                    <div className="text-xl font-bold">{eta}</div>
                  </div>
                </div>
                {liveRoute?.fallback && (
                  <div className="text-xs opacity-75 mt-1 text-center">*Estimated values</div>
                )}
              </div>
            )}
            
            {isCompleted && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-90">Ride Completed</div>
                    <div className="text-sm font-semibold">Thank you for riding with us!</div>
                  </div>
                  {bookingData?.completedAt && (
                    <div>
                      <div className="text-xs opacity-90">Completed at</div>
                      <div className="text-sm font-semibold">
                        {formatTime(bookingData.completedAt)}
                      </div>
                    </div>
                  )}
                  {bookingData?.fareAmount && (
                    <div>
                      <div className="text-xs opacity-90">Total Fare</div>
                      <div className="text-sm font-semibold">₹{bookingData.fareAmount}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isCancelled && cancellationInfo && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-90">Cancelled by</div>
                    <div className="text-sm font-semibold">{cancellationInfo.cancelledDriverName || 'Driver'}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Reason</div>
                    <div className="text-sm font-semibold">{cancellationInfo.cancelledReason || 'Ride cancelled by driver'}</div>
                  </div>
                  {cancellationInfo.cancelledAt && (
                    <div>
                      <div className="text-xs opacity-90">Cancelled at</div>
                      <div className="text-sm font-semibold">
                        {formatTime(cancellationInfo.cancelledAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation/Completion Action Card */}
        {(isCancelled || isCompleted) && (
          <div className={`${isCancelled ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'} rounded-xl p-4 mb-4`}>
            <div className="flex items-start">
              <div className={`${isCancelled ? 'text-red-500' : 'text-green-500'} mr-3`}>
                {isCancelled ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-2 ${isCancelled ? 'text-red-800' : 'text-green-800'}`}>
                  {isCancelled ? 'Ride Cancelled' : 'Ride Completed'}
                </h3>
                <p className={`mb-3 ${isCancelled ? 'text-red-700' : 'text-green-700'}`}>
                  {isCancelled 
                    ? 'The driver has cancelled this ride. We apologize for the inconvenience.' 
                    : 'Your ride has been completed successfully. Thank you for choosing our service!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleBookNewRide}
                    className={`${isCancelled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} px-4 py-3 rounded-lg font-medium flex-1 text-center`}
                  >
                    Book New Ride
                  </button>
                  <button
                    onClick={() => navigate('/support')}
                    className={`${isCancelled ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300' : 'bg-white hover:bg-gray-100 text-green-600 border border-green-300'} px-4 py-3 rounded-lg font-medium flex-1 text-center`}
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Info Card - Show for active and completed rides */}
        {!isCancelled && driverInfo && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">Your Driver</h3>
                <p className="text-lg font-semibold truncate">{driverInfo.name}</p>
                <div className="flex items-center flex-wrap gap-1 mt-1">
                  <p className="text-gray-600 text-sm truncate">{driverInfo.vehicle}</p>
                  <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs ml-2">
                    ⭐ {driverInfo.rating}
                  </span>
                </div>
              </div>
            </div>
            
            {isRideActive && (
              <div className="flex gap-2">
                <button
                  onClick={handleCallDriver}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
                {driverLocation && isRideActive && (
                  <button
                    onClick={openMapNavigation}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
                    </svg>
                    Navigate
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Map Section - Show for active rides */}
        {isRideActive && (
          <div className="bg-white rounded-xl shadow-md p-3 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base">Live Tracking Map</h3>
              <div className="text-xs text-gray-500 flex items-center">
                {driverLocation && (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </span>
                )}
              </div>
            </div>
            
            <div className="h-64 sm:h-80 md:h-96 rounded-lg bg-gray-200">
              {driverLocation && customerLocation ? (
                <MapWithTracking
                  driverLocation={driverLocation}
                  customerLocation={customerLocation}
                  pickupLocation={details.pickup}
                  dropoffLocation={details.dropoff}
                  routeData={liveRoute}
                  apiKey={MAP_MY_INDIA_API_KEY}
                  showPredictions={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3 mx-auto"></div>
                    <p className="text-gray-600 text-sm">Loading live map...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-gray-600">Your Driver</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Your Location</span>
              </div>
              {liveRoute && (
                <div className="flex items-center">
                  <div className="w-6 h-1 bg-blue-400 mr-2"></div>
                  <span className="text-xs text-gray-600">Route</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Information - Show for active rides */}
        {isRideActive && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold text-base mb-3">Live Tracking Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Driver Location Card */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <h4 className="font-semibold text-gray-700 text-sm">Driver Location</h4>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Live
                  </span>
                </div>
                
                {driverLocation ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="font-mono text-xs truncate">{driverLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="font-mono text-xs truncate">{driverLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Updated: {driverLocation.timestamp 
                        ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })
                        : 'Just now'
                      }
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-2">Driver location not available</p>
                )}
              </div>
              
              {/* Your Location Card */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-gray-700 text-sm">Your Location</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    customerLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {customerLocation ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {customerLocation ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="font-mono text-xs truncate">{customerLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="font-mono text-xs truncate">{customerLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mt-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Update Location
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm mb-2">Your location not shared</p>
                    <button
                      onClick={handleRefresh}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      Share Location
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Distance & ETA */}
            {(distance || eta) && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">Trip Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="text-blue-500 mr-2 text-sm">📏</div>
                      <p className="text-xs text-gray-600">Distance</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 truncate">{distance}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="text-green-500 mr-2 text-sm">⏱️</div>
                      <p className="text-xs text-gray-600">ETA</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 truncate">{eta}</p>
                  </div>
                </div>
                {liveRoute?.fallback && (
                  <p className="text-xs text-yellow-600 text-center mt-2">*Based on estimated values</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trip Details - Always show */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h3 className="font-bold text-base mb-3">Trip Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">From</p>
              <p className="font-medium text-sm line-clamp-2">{formatAddress(details.pickup)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">To</p>
              <p className="font-medium text-sm line-clamp-2">{formatAddress(details.dropoff)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Vehicle</p>
              <p className="font-medium text-sm truncate">{details.vehicleDetails?.name || 'Standard Car'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Time</p>
              <p className="font-medium text-sm truncate">
                {details.travelDate ? new Date(details.travelDate).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'N/A'}
                {details.hour && ` ${details.hour}:${details.minute || '00'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 text-base mb-2">Need Help?</h4>
          <p className="text-yellow-700 text-sm mb-3">
            {isCancelled ? 'Your ride has been cancelled. What would you like to do?' : 
             isCompleted ? 'Your ride has been completed. What would you like to do next?' :
             'If you\'re experiencing issues with tracking:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {isCancelled || isCompleted ? (
              <>
                <button
                  onClick={handleBookNewRide}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🚗 Book New Ride
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📞 Contact Support
                </button>
                <button
                  onClick={() => navigate('/user-dashboard')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📋 My Bookings
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🔄 Refresh Page
                </button>
                <button
                  onClick={handleCancelRide}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🚫 Cancel Ride
                </button>
                <button
                  onClick={handleCallDriver}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📱 Call Driver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between z-10 sm:hidden">
        {isRideActive && (
          <>
            <button
              onClick={handleRefresh}
              className="flex flex-col items-center text-blue-600"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refresh</span>
            </button>
            
            <button
              onClick={handleCancelRide}
              className="flex flex-col items-center text-red-600"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs">Cancel</span>
            </button>
            
            {driverInfo?.phone && driverInfo.phone !== 'Not available' && (
              <button
                onClick={handleCallDriver}
                className="flex flex-col items-center text-green-600"
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xs">Call</span>
              </button>
            )}
          </>
        )}
        
        <button
          onClick={() => navigate(-1)}
          className="flex flex-col items-center text-gray-600"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs">Back</span>
        </button>
      </div>
    </div>
  );
};

export default TrackRidePage;