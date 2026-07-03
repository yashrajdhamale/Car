import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  getDocs,
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Constants - Driver search configuration
const MAX_RETRY_ATTEMPTS = 2; // Maximum retry attempts
const RETRY_DELAY_MS = 30000; // 30 seconds between retries
const ASSIGNMENT_CHECK_INTERVAL = 20000; // Check every 20 seconds

const FindDriverPage = () => {
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const [driverFound, setDriverFound] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('searching');
  const [driverInfo, setDriverInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [bookingId, setBookingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes in seconds
  const navigate = useNavigate();
  const retryAttempts = useRef(0);
  const retryTimeout = useRef(null);
  const assignmentTimer = useRef(null);
  const progressTimer = useRef(null);
  const periodicCheckTimer = useRef(null);
  const searchTimer = useRef(null);
  const unsubscribeRef = useRef(null);
  const timeRemainingTimer = useRef(null);

  // Clean up timeouts and intervals on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout.current) clearTimeout(retryTimeout.current);
      if (assignmentTimer.current) clearTimeout(assignmentTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (periodicCheckTimer.current) clearInterval(periodicCheckTimer.current);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (timeRemainingTimer.current) clearInterval(timeRemainingTimer.current);
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, []);

  // Normalize location for matching
  const normalizeLocation = (location) => {
    if (!location) return '';
    if (typeof location === 'string') return location.toLowerCase().trim();
    return (location.name || location.address || '').toLowerCase().trim();
  };

  // Clear all timers function
  const clearAllTimers = () => {
    if (retryTimeout.current) clearTimeout(retryTimeout.current);
    if (assignmentTimer.current) clearTimeout(assignmentTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (periodicCheckTimer.current) clearInterval(periodicCheckTimer.current);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (timeRemainingTimer.current) clearInterval(timeRemainingTimer.current);
  };

  // Setup booking listener
  const setupBookingListener = (currentBookingId) => {
    const bookingRef = doc(db, 'airportTransfers', currentBookingId);
    
    const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
      if (!docSnap.exists()) {
        console.error('❌ Booking document does not exist');
        navigate('/');
        return;
      }
      
      const data = docSnap.data();
      console.log('📊 Booking status update:', {
        status: data.status,
        driverId: data.driverId,
        driverName: data.driverName,
        vehicleType: data.vehicleType,
        driverPhone: data.driverPhone
      });
      
      // CRITICAL: Check for driver info FIRST
      if (data.driverId || data.driverName) {
        console.log('✅ Driver info found! Driver has accepted.');
        setDriverFound(true);
        setBookingStatus('accepted');
        setDriverInfo({
          name: data.driverName || 'Driver',
          rating: 4.9,
          rides: 120,
          vehicle: data.vehicleType || 'Standard',
          phone: data.driverPhone || '+1234567890'
        });
        setProgress(100);
        
        clearAllTimers();
        return;
      }
      
      // Only check these if NO driver info exists
      if (data.status === 'completed') {
        console.log('✅ Booking completed');
        setBookingStatus('completed');
        clearAllTimers();
      } else if (data.status === 'no_drivers_available') {
        if (retryAttempts.current < MAX_RETRY_ATTEMPTS) {
          console.log(`🔄 Will retry in ${RETRY_DELAY_MS/1000} seconds...`);
        } else {
          console.log('❌ No drivers available after all retries');
          setDriverFound(false);
          setDriverInfo(null);
          setBookingStatus('no_drivers');
          setProgress(100);
          clearAllTimers();
        }
      } else if (data.status === 'searching_driver') {
        console.log('🔍 Still searching for driver');
        setDriverFound(false);
        setDriverInfo(null);
        setBookingStatus('searching');
      } else if (data.status === 'expired') {
        console.log('⏰ Booking has expired - no driver found');
        setDriverFound(false);
        setDriverInfo(null);
        setBookingStatus('expired');
        setProgress(100);
        clearAllTimers();
      }
    });
    
    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  };

  // Find driver with matching route
  const findDriverWithMatchingRoute = async (pickup, dropoff) => {
    try {
      const pickupNorm = normalizeLocation(pickup);
      const dropoffNorm = normalizeLocation(dropoff);

      console.log('🔍 Searching for drivers with route:', pickupNorm, '→', dropoffNorm);

      // Get all drivers
      const driversRef = collection(db, 'drivers');
      const driversSnapshot = await getDocs(driversRef);

      for (const driverDoc of driversSnapshot.docs) {
        const driverId = driverDoc.id;
        const driverData = driverDoc.data();

        // Check driver status
        const status = driverData.status || 'unknown';
        console.log(`Driver ${driverId}: status = ${status}`);

        // Accept active, available, or online drivers
        if (!['available', 'online', 'active'].includes(status)) {
          console.log(`Skipping driver ${driverId} - not available`);
          continue;
        }

        // Check for assigned routes in subcollection
        const routesRef = collection(db, 'drivers', driverId, 'assignedRoutes');
        const routesSnapshot = await getDocs(routesRef);

        for (const routeDoc of routesSnapshot.docs) {
          const route = routeDoc.data();
          const routeFrom = normalizeLocation(route.from);
          const routeTo = normalizeLocation(route.to);

          console.log(`Checking route for driver ${driverId}:`, routeFrom, '→', routeTo);

          // Check if route matches (bidirectional)
          if (
            (routeFrom === pickupNorm && routeTo === dropoffNorm) ||
            (routeFrom === dropoffNorm && routeTo === pickupNorm)
          ) {
            console.log('✅ MATCHED DRIVER:', driverId);
            return {
              id: driverId,
              ...driverData
            };
          }
        }
      }

      console.log('❌ No matching drivers found this check');
      return null;
    } catch (error) {
      console.error('Error finding driver:', error);
      return null;
    }
  };

  const findAndAssignDriver = async (currentBookingId) => {
    try {
      console.log('🔄 Starting driver assignment for booking:', currentBookingId);
      
      const bookingRef = doc(db, 'airportTransfers', currentBookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (!bookingSnap.exists()) {
        console.error('❌ Booking not found');
        navigate('/');
        return;
      }
      
      const data = bookingSnap.data();
      
      // Check if booking has expired before proceeding
      if (data.expiresAt && data.expiresAt.toDate() <= new Date()) {
        console.log('⏰ Booking has expired - stopping search');
        await updateDoc(bookingRef, {
          status: 'expired',
          updatedAt: serverTimestamp(),
          cancellationReason: 'No driver accepted within the time limit'
        });
        setBookingStatus('expired');
        clearAllTimers();
        return;
      }
      
      console.log('📊 Booking status update:', {
        status: data.status,
        driverId: data.driverId,
        driverName: data.driverName,
        vehicleType: data.vehicleType,
        driverPhone: data.driverPhone
      });
      
      // CRITICAL: Check for driver info FIRST
      if (data.driverId || data.driverName) {
        console.log('✅ Driver info found! Driver has accepted.');
        setDriverFound(true);
        setBookingStatus('accepted');
        setDriverInfo({
          name: data.driverName || 'Driver',
          rating: 4.9,
          rides: 120,
          vehicle: data.vehicleType || 'Standard',
          phone: data.driverPhone || '+1234567890'
        });
        setProgress(100);
        
        clearAllTimers();
        return;
      }
      
      // Only check these if NO driver info exists
      if (data.status === 'completed') {
        console.log('✅ Booking completed');
        setBookingStatus('completed');
        clearAllTimers();
      } else if (data.status === 'no_drivers_available') {
        if (retryAttempts.current < MAX_RETRY_ATTEMPTS) {
          console.log(`🔄 Will retry in ${RETRY_DELAY_MS/1000} seconds...`);
        } else {
          console.log('❌ No drivers available after all retries');
          setDriverFound(false);
          setDriverInfo(null);
          setBookingStatus('no_drivers');
          setProgress(100);
          clearAllTimers();
        }
      } else if (data.status === 'searching_driver') {
        console.log('🔍 Still searching for driver');
        setDriverFound(false);
        setDriverInfo(null);
        setBookingStatus('searching');
      } else if (data.status === 'expired') {
        console.log('⏰ Booking has expired - no driver found');
        setDriverFound(false);
        setDriverInfo(null);
        setBookingStatus('expired');
        setProgress(100);
        clearAllTimers();
      }

      const { pickupLocation, dropoffLocation } = data;
      
      // Find a driver with matching route
      const driver = await findDriverWithMatchingRoute(pickupLocation, dropoffLocation);
      
      if (driver) {
        console.log('✅ Assigning driver:', driver.id);
        
        // Update booking with driver info
        await updateDoc(bookingRef, {
          status: 'accepted',
          driverId: driver.id,
          driverName: driver.displayName || driver.fullName || 'Driver',
          driverPhone: driver.phoneNumber || driver.phone || '',
          vehicleType: driver.vehicleType || 'Standard',
          vehicleModel: driver.vehicleModel || '',
          vehicleNumber: driver.vehicleNumber || '',
          acceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        console.log('✅ Driver assigned successfully');
      } else {
        console.log('❌ No available drivers found this check');
        
        // Only mark as no_drivers_available if retries exhausted
        if (retryAttempts.current >= MAX_RETRY_ATTEMPTS) {
          console.log('❌ Exhausted all retry attempts');
          await updateDoc(bookingRef, {
            status: 'no_drivers_available',
            updatedAt: serverTimestamp()
          });
        } else {
          console.log(`🔄 Will check again in ${ASSIGNMENT_CHECK_INTERVAL/1000} seconds`);
        }
      }
    } catch (error) {
      console.error('❌ Error in findAndAssignDriver:', error);
    }
  };

  // Start periodic driver search
  const startPeriodicDriverSearch = (bookingId) => {
    console.log('� Starting immediate driver search');
    
    // First immediate check
    findAndAssignDriver(bookingId);
    
    // Set up periodic checks
    periodicCheckTimer.current = setInterval(() => {
      if (bookingStatus === 'searching') {
        console.log('🔄 Periodic driver search check...');
        findAndAssignDriver(bookingId);
      }
    }, ASSIGNMENT_CHECK_INTERVAL);
  };

  // Check for expired booking periodically
  useEffect(() => {
    if (!bookingId) return;

    const checkExpiredBooking = async () => {
      try {
        const bookingRef = doc(db, 'airportTransfers', bookingId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          const bookingData = bookingSnap.data();
          
          // Check if booking has expired and is still searching
          if (bookingData.status === 'searching_driver' && 
              bookingData.expiresAt && 
              bookingData.expiresAt.toDate() <= new Date()) {
            
            console.log('⏰ Booking has expired - updating status');
            await updateDoc(bookingRef, {
              status: 'expired',
              updatedAt: serverTimestamp(),
              cancellationReason: 'No driver accepted within the time limit'
            });
            
            setBookingStatus('expired');
            clearAllTimers();
          }
        }
      } catch (error) {
        console.error('Error checking expired booking:', error);
      }
    };

    // Check every 5 seconds
    const expiryCheckInterval = setInterval(checkExpiredBooking, 5000);

    return () => {
      clearInterval(expiryCheckInterval);
    };
  }, [bookingId]);

  // Create booking when component mounts
  useEffect(() => {
    const createBookingAndStartSearch = async () => {
      try {
        console.log("🚀 Creating booking...");
        
        const bookingDetails = state?.bookingDetails || {};
        
        if (!bookingDetails.pickup || !bookingDetails.dropoff) {
          console.error("Missing pickup or dropoff details");
          navigate('/');
          return;
        }
        
        console.log("📋 Booking details received:", {
          pickup: bookingDetails.pickup,
          dropoff: bookingDetails.dropoff,
          travelDate: bookingDetails.travelDate,
          vehicle: bookingDetails.vehicleDetails
        });
        
        // Set expiry time (2 minutes from now)
        const expiresAt = new Date(Date.now() + 120000);
        
        // Create booking document with expiresAt field
        const bookingData = {
          pickupLocation: bookingDetails.pickup,
          dropoffLocation: bookingDetails.dropoff,
          travelDate: bookingDetails.travelDate,
          hour: bookingDetails.hour || '12',
          minute: bookingDetails.minute || '00',
          adults: bookingDetails.adults || 1,
          children: bookingDetails.children || 0,
          vehicleType: bookingDetails.vehicleDetails?.type || 'Standard',
          vehicleModel: bookingDetails.vehicleDetails?.name || '',
          vehiclePrice: bookingDetails.vehicleDetails?.price || 0,
          customerName: bookingDetails.customerName || '',
        }
        
        clearAllTimers();
        
        const bookingRef = doc(db, 'airportTransfers', currentBookingId);
        await updateDoc(bookingRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp()
        });
        navigate('/');
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }
  };

  // Format time remaining
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        {/* Debug info */}
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-left text-xs">
          <p className="font-semibold">Debug Info:</p>
          <p>Booking ID: {bookingId || 'Creating...'}</p>
          <p>Status: {bookingStatus}</p>
          <p>Driver Found: {driverFound ? 'Yes' : 'No'}</p>
          <p>Time Remaining: {formatTime(timeRemaining)}</p>
          <p>Retry: {retryCount}/{MAX_RETRY_ATTEMPTS}</p>
          <p>Progress: {progress.toFixed(1)}%</p>
        </div>
        
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <img 
              src={driverFound ? 
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" : 
                "https://cdn-icons-png.flaticon.com/512/2838/2838694.png"} 
              alt={driverFound ? "Driver Found" : "Finding Driver"} 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {bookingStatus === 'no_drivers' 
              ? `No Drivers Available${retryCount > 0 ? ` (Retry ${retryCount}/${MAX_RETRY_ATTEMPTS})` : ''}` 
              : driverFound 
                ? 'Driver Found!' 
                : 'Finding a Driver...'}
          </h1>
          <p className="text-gray-600 mb-2">
            {bookingStatus === 'no_drivers'
              ? 'Sorry, we couldn\'t find any available drivers for your route at this time.'
              : driverFound 
                ? 'Your driver is on the way!' 
                : 'Please wait while we find the best driver for your route...'}
          </p>
          
          {/* Time Remaining Display */}
          {!driverFound && bookingStatus === 'searching' && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                Searching for drivers... Time remaining: {formatTime(timeRemaining)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Drivers have up to 2 minutes to accept your request
              </p>
            </div>
          )}

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div 
              className="bg-orange-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {bookingStatus === 'expired' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">No Drivers Available</h3>
              <p className="text-red-700 mb-4">We couldn't find a driver for your ride. Please try booking again.</p>
              <button
                onClick={() => navigate('/local-pickup', { 
                  state: { 
                    bookingDetails: state?.bookingDetails,
                    fromFindDriver: true 
                  } 
                })}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Booking Again
              </button>
            </div>
          ) : driverFound && driverInfo ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex-shrink-0">
                  <img 
                    className="h-16 w-16 rounded-full" 
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(driverInfo.name)}&background=random`} 
                    alt={driverInfo.name} 
                  />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">{driverInfo.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {driverInfo.rating} ({driverInfo.rides} rides)
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">Vehicle:</span> {driverInfo.vehicle}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    console.log("🚀 Going to payment with bookingId:", bookingId);
                    navigate('/payment', { 
                      state: { 
                        bookingId: bookingId,
                        bookingDetails: {
                          ...state?.bookingDetails,
                          pickup: state?.bookingDetails?.pickup,
                          dropoff: state?.bookingDetails?.dropoff,
                          travelDate: state?.bookingDetails?.travelDate,
                          hour: state?.bookingDetails?.hour,
                          minute: state?.bookingDetails?.minute,
                          adults: state?.bookingDetails?.adults,
                          children: state?.bookingDetails?.children,
                          vehicleDetails: state?.bookingDetails?.vehicleDetails
                        }
                      } 
                    });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" />
                  </svg>
                  Go for Payment
                </button>
                <button
                  onClick={() => navigate('/track-ride', { 
                    state: { 
                      bookingId: bookingId,
                      bookingDetails: state?.bookingDetails 
                    } 
                  })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Track Ride
                </button>
              </div>
            </div>
          ) : bookingStatus === 'searching' ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          ) : null}
        </div>

        <button
          onClick={handleCancel}
          className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
          disabled={driverFound}
        >
          {driverFound ? 'Contact Support to Cancel' : 'Cancel Booking'}
        </button>
      </div>
    </div>
  );
};

export default FindDriverPage;