import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getAuth } from 'firebase/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MAX_RETRY_ATTEMPTS = 2;
const ASSIGNMENT_CHECK_INTERVAL = 20000;

const FindDriverPage = () => {
  const { state } = useLocation();
  const [progress, setProgress] = useState(0);
  const [driverFound, setDriverFound] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('searching');
  const [driverInfo, setDriverInfo] = useState(null);
  const [retryCount] = useState(0);
  const [bookingId, setBookingId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const speechSynthesis = window.speechSynthesis;
  const navigate = useNavigate();
  const retryAttempts = useRef(0);
  const retryTimeout = useRef(null);
  const assignmentTimer = useRef(null);
  const progressTimer = useRef(null);
  const periodicCheckTimer = useRef(null);
  const searchTimer = useRef(null);
  const unsubscribeRef = useRef(null);
  const timeRemainingTimer = useRef(null);
  const searchStartedRef = useRef(false);

  useEffect(() => () => {
    [retryTimeout, assignmentTimer, progressTimer, periodicCheckTimer, searchTimer, timeRemainingTimer].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
      }
    });
    if (unsubscribeRef.current) unsubscribeRef.current();
  }, []);

  const clearAllTimers = () => {
    [retryTimeout, assignmentTimer, progressTimer, periodicCheckTimer, searchTimer, timeRemainingTimer].forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        clearInterval(ref.current);
      }
    });
  };

  const refreshBooking = useCallback(async (currentBookingId) => {
    const response = await fetch(`${API_BASE}/api/airport-bookings/${currentBookingId}`);
    if (!response.ok) throw new Error('Booking not found');
    const payload = await response.json();
    return payload.booking;
  }, []);

  const applyBookingState = useCallback((data) => {
    if (!data) return;
    if (data.driverId || data.driverName) {
      setDriverFound(true);
      setBookingStatus('accepted');
      setDriverInfo({
        name: data.driverName || 'Driver',
        rating: 4.9,
        rides: 120,
        vehicle: data.vehicleType || 'Standard',
        phone: data.driverPhone || '+1234567890',
      });
      setProgress(100);
      clearAllTimers();
      return;
    }

    if (data.status === 'completed') {
      setBookingStatus('completed');
      clearAllTimers();
    } else if (data.status === 'no_drivers_available') {
      if (retryAttempts.current >= MAX_RETRY_ATTEMPTS) {
        setDriverFound(false);
        setDriverInfo(null);
        setBookingStatus('no_drivers');
        setProgress(100);
        clearAllTimers();
      }
    } else if (data.status === 'searching_driver') {
      setDriverFound(false);
      setDriverInfo(null);
      setBookingStatus('searching');
    } else if (data.status === 'expired') {
      setDriverFound(false);
      setDriverInfo(null);
      setBookingStatus('expired');
      setProgress(100);
      clearAllTimers();
    }
  }, []);

  const setupBookingListener = useCallback((currentBookingId) => {
    const poll = async () => {
      try {
        const data = await refreshBooking(currentBookingId);
        applyBookingState(data);
      } catch (error) {
        console.error('Error polling booking:', error);
        navigate('/');
      }
    };

    poll();
    const interval = setInterval(poll, ASSIGNMENT_CHECK_INTERVAL);
    const unsubscribe = () => clearInterval(interval);
    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [applyBookingState, navigate, refreshBooking]);

  const speak = useCallback((text) => {
    if (!speechSynthesis) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    speechSynthesis.speak(utterance);
  }, [speechSynthesis]);

  const startSearchProgress = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);

    progressTimer.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(progressTimer.current);
          return 0;
        }
        return prev - 1;
      });
      setProgress((prev) => Math.min(100, prev + (100 / 120)));
    }, 1000);
  }, []);

  useEffect(() => {
    let isMounted = true;

    speak('We are searching for a driver for you. Please wait while we find the best match.');

    const announcementInterval = setInterval(() => {
      if (isMounted && bookingStatus === 'searching') {
        speak('We are still searching for a driver. Thank you for your patience.');
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(announcementInterval);
    };
  }, [bookingStatus, speak]);

  useEffect(() => {
    if (searchStartedRef.current) return undefined;
    searchStartedRef.current = true;

    let unsubscribe = null;

    const startBookingSearch = (currentBookingId) => {
      setBookingId(currentBookingId);
      unsubscribe = setupBookingListener(currentBookingId);
      startSearchProgress();
    };

    const createBookingAndStartSearch = async () => {
      try {
        const bookingDetails = state?.bookingDetails || {};
        const existingBookingId = state?.bookingId || bookingDetails.id || bookingDetails.bookingId;

        if (existingBookingId) {
          startBookingSearch(existingBookingId);
          return;
        }

        if (!bookingDetails.pickup || !bookingDetails.dropoff) {
          navigate('/');
          return;
        }

        const auth = getAuth();
        const currentUser = auth.currentUser;
        const expiresAt = new Date(Date.now() + 120000).toISOString();
        const transferDetails = {
          ...bookingDetails,
          pickup: bookingDetails.pickup,
          dropoff: bookingDetails.dropoff,
          pickupLocation: bookingDetails.pickup,
          dropoffLocation: bookingDetails.dropoff,
          travelDate: bookingDetails.travelDate,
          hour: bookingDetails.hour || '12',
          minute: bookingDetails.minute || '00',
          adults: bookingDetails.adults || 1,
          children: bookingDetails.children || 0,
          customerName: bookingDetails.customerName || '',
          customerEmail: currentUser?.email || bookingDetails.customerEmail || '',
          userEmail: currentUser?.email || bookingDetails.customerEmail || '',
          userId: currentUser?.uid || '',
          customerPhone: bookingDetails.customerPhone || '',
          expiresAt,
          waitingForLocation: true,
          _source: 'find_driver_page',
        };

        const vehicleDetails = bookingDetails.vehicleDetails || {
          type: bookingDetails.type || bookingDetails.vehicleType || 'Standard',
          name: bookingDetails.name || bookingDetails.vehicleModel || '',
          price: bookingDetails.price || bookingDetails.vehiclePrice || 0,
        };

        const response = await fetch(`${API_BASE}/api/airport-bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transferDetails,
            vehicleDetails,
            userId: currentUser?.uid || '',
            status: 'searching_driver',
            paymentStatus: 'pending',
          }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        startBookingSearch(result.bookingId);
      } catch (error) {
        console.error('Error creating booking:', error);
        alert('Failed to create booking. Please try again.');
        navigate('/');
      }
    };

    createBookingAndStartSearch();

    return () => {
      if (unsubscribe) unsubscribe();
      if (speechSynthesis) speechSynthesis.cancel();
    };
  }, [navigate, setupBookingListener, startSearchProgress, state?.bookingDetails, state?.bookingId, speechSynthesis]);

  useEffect(() => {
    if (!bookingId) return;
    const checkExpiredBooking = async () => {
      try {
        const booking = await refreshBooking(bookingId);
        if (booking.status === 'searching_driver' && booking.expiresAt && new Date(booking.expiresAt) <= new Date()) {
          setBookingStatus('expired');
          clearAllTimers();
        }
      } catch (error) {
        console.error('Error checking expired booking:', error);
      }
    };
    const expiryCheckInterval = setInterval(checkExpiredBooking, 5000);
    return () => clearInterval(expiryCheckInterval);
  }, [bookingId, refreshBooking]);

  const formatTime = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
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
          {!driverFound && bookingStatus === 'searching' && (
            <div className="mb-4">
              <p className="text-sm text-gray-500">Searching for drivers... Time remaining: {formatTime(timeRemaining)}</p>
              <p className="text-xs text-gray-400 mt-1">Drivers have up to 2 minutes to accept your request</p>
            </div>
          )}
          {bookingStatus === 'expired' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">No Drivers Available</h3>
              <p className="text-red-700 mb-4">We could not find a driver for your ride. Please try booking again.</p>
              <button
                onClick={() => navigate('/local-pickup', { state: { bookingDetails: state?.bookingDetails, fromFindDriver: true } })}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Booking Again
              </button>
            </div>
          ) : driverFound && driverInfo ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900">{driverInfo.name}</h3>
              <div className="mt-1 text-sm text-gray-500">
                <span className="font-medium">Vehicle:</span> {driverInfo.vehicle}
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  onClick={() => navigate('/payment', { state: { bookingId, bookingDetails: state?.bookingDetails } })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-500 hover:bg-orange-600"
                >
                  Go for Payment
                </button>
                <button
                  onClick={() => navigate('/track-ride', { state: { bookingId, bookingDetails: state?.bookingDetails } })}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600"
                >
                  Track Ride
                </button>
              </div>
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
