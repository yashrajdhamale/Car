import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '../../context/UserContext';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  where,
  getDoc,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import AirportTransferRequestCard from '../../components/driver/AirportTransferRequestCard';
import LocalPickupRequestCard from '../../components/driver/LocalPickupRequestCard';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RideRequestCard from '../../components/driver/RideRequestCard';
import HolidayRideRequestCard from '../../components/driver/HolidayRideRequestCard';
import InterestedRoutesSection from './components/InterestedRoutesSection';
import DriverTrackingMap from '../../pages/driver/components/DriverTrackingMap';
import MyRidesTab from '../../components/driver/MyRidesTab';

import OtpVerificationPanel from '../../components/driver/OtpVerificationPanel';

// Distance Calculator Import
import { isWithinRadius, calculateDistance, extractCoordinates } from '../../utils/distanceCalculator';

const CLOUD_FN_BASE = "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net";
// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Helper function to safely get location text
const getLocationText = (location) => {
  if (!location) return "Location not specified";
  
  if (typeof location === 'string') return location;
  
  if (typeof location === 'object') {
    if (location.name) return location.name;
    if (location.address) return location.address;
    if (location.formatted_address) return location.formatted_address;
    if (location.description) return location.description;
    
    if (location.lat && location.lng) {
      return `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    
    return "Location specified";
  }
  
  return "Unknown location";
};

// Helper function to get customer phone number from ride data
const getCustomerPhoneFromRide = (ride) => {
  // Check all possible phone number fields
  const phone = ride.contactNumber1 || ride.contactNumber2 || 
                ride.customerPhone || ride.userPhone || 
                ride.phone || ride.phoneNumber ||
                ride.mobile || ride.contactNumber;
  return phone || 'Not provided';
};

// Helper function to get customer name
const getCustomerName = (ride) => {
  if (ride.displayName) return ride.displayName;
  if (ride.customerName) return ride.customerName;
  if (ride.userName) return ride.userName;
  if (ride.name) return ride.name;
  
  if (ride.firstName) {
    return ride.lastName ? `${ride.firstName} ${ride.lastName}` : ride.firstName;
  }
  
  if (ride.email) {
    return ride.email.split('@')[0];
  }
  
  return 'Customer';
};

// Helper function to check if ride is for future date/time
const isFutureRide = (ride) => {
  if (!ride.travelDate && !ride.pickupTime) return false;
  
  const now = new Date();
  let rideDateTime;
  
  if (ride.travelDate) {
    const travelDate = new Date(ride.travelDate);
    
    if (ride.pickupTime) {
      const [hours, minutes] = ride.pickupTime.split(':').map(Number);
      travelDate.setHours(hours || 0, minutes || 0, 0, 0);
    } else if (ride.hour) {
      travelDate.setHours(ride.hour || 0, ride.minute || 0, 0, 0);
    }
    
    rideDateTime = travelDate;
  } else if (ride.createdAt) {
    rideDateTime = ride.createdAt.toDate();
  } else {
    return false;
  }
  
  return rideDateTime > now;
};

// Request deduplication cache
const requestCache = new Map(); // ✅ Changed from Set to Map
const CACHE_TTL = 30000;

setInterval(() => {
  const now = Date.now();
  for (const [requestId, timestamp] of requestCache.entries()) {
    if (now - timestamp > CACHE_TTL) {
      requestCache.delete(requestId);
    }
  }
}, 60000);

const CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad",
  "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", "Lucknow",
  "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam",
  "Pimpri-Chinchwad", "Patna", "Vadodara", "Ghaziabad", "Ludhiana",
  "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Varanasi"
];

export default function DriverDashboard() {
  const [rideRequests, setRideRequests] = useState({ 
    outstation: [], 
    holiday: [],
    airport: [],
    localPickup: []
  });
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [interestedRoutes, setInterestedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const { user, userData } = useUser();
  const [processingRequest, setProcessingRequest] = useState(null);
  const [selectedRide, setSelectedRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const driverLocationRef = useRef(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [rideDetails, setRideDetails] = useState(null);
  const [customerPhones, setCustomerPhones] = useState({});
  const [fetchingPhones, setFetchingPhones] = useState({});
  const previousRequestCount = useRef({ outstation: 0, holiday: 0, airport: 0 });
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const unsubscribeRef = useRef(null);
  const acceptedRidesUnsubscribeRef = useRef(null);
  const locationWatchIdRef = useRef(null);
  const isInitialLoadRef = useRef({ outstation: true, holiday: true, airport: true, localPickup: true }); // ✅ ADD THIS


  const debouncedUpdate = useMemo(() => debounce((type, requests) => {
    setRideRequests(prev => ({
      ...prev,
      [type]: requests
    }));
    setLoading(false);
  }, 300), []);

  // Listen for driver location updates from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currentLocation) {
          setDriverLocation(data.currentLocation);
          driverLocationRef.current = data.currentLocation; 
        }
      }
    });

    return () => unsub();
  }, [user?.uid]);

  // Define matchesInterestedRoute function BEFORE shouldShowRequest
   const matchesInterestedRoute = useCallback((pickup, dropoff) => {
    if (!interestedRoutes.length) {
      console.log('⚠️ No routes specified, showing all requests');
      return true;
    }
    
    const normalizedPickup = pickup?.toLowerCase().trim() || '';
    const normalizedDropoff = dropoff?.toLowerCase().trim() || '';

    if (!normalizedPickup || !normalizedDropoff) return true;
    
    const matches = interestedRoutes.some(route => {
      const routeFrom = route.from?.toLowerCase().trim() || '';
      const routeTo = route.to?.toLowerCase().trim() || '';
      
      const forwardMatch = 
        (normalizedPickup.includes(routeFrom) || routeFrom.includes(normalizedPickup)) &&
        (normalizedDropoff.includes(routeTo) || routeTo.includes(normalizedDropoff));
      
      const reverseMatch = 
        (normalizedDropoff.includes(routeFrom) || routeFrom.includes(normalizedDropoff)) &&
        (normalizedPickup.includes(routeTo) || routeTo.includes(normalizedPickup));
      
      if (forwardMatch || reverseMatch) {
        console.log(`✅ Route matched: ${routeFrom} ↔ ${routeTo}`);
      }
      
      return forwardMatch || reverseMatch;
    });
    
    console.log(`Route matching "${normalizedPickup}" → "${normalizedDropoff}": ${matches}`);
    return matches;
  }, [interestedRoutes]);

// ✅ isRequestWithinRadius starts cleanly here
const isRequestWithinRadius = useCallback((request) => {
  const loc = driverLocationRef.current;  // ← uses ref, not state
  if (!loc) {
    console.log('⚠️ Driver location not available, showing request');
    return true;
  }

  const pickupCoords = extractCoordinates(request);
  if (!pickupCoords) {
    console.log('⚠️ No pickup coordinates, showing request');
    return true;
  }

  let radiusKm = 15;
  if (request.type === 'localPickup') {
    radiusKm = 3;
  }

  const distance = calculateDistance(
    loc.lat,
    loc.lng,
    pickupCoords.lat,
    pickupCoords.lng
  );

  const withinRadius = distance <= radiusKm;
  console.log(`📍 [${request.type}] Distance: ${distance.toFixed(2)} km | Limit: ${radiusKm} km | Result: ${withinRadius}`);
  return withinRadius;
}, []); // ← empty deps — this is the key change

  // Combined route match + radius filtering function
  const shouldShowRequest = useCallback((request) => {
    let routeMatch = true;
    
    if (request.type === 'airport') {
      const pickup = request.pickupLocation?.name || request.pickupLocation || '';
      const dropoff = request.dropoffLocation?.name || request.dropoffLocation || '';
      routeMatch = matchesInterestedRoute(pickup, dropoff);
    } else if (request.type === 'outstation') {
      routeMatch = matchesInterestedRoute(request.from, request.to);
    }
    
    if (!routeMatch) return false;
    return isRequestWithinRadius(request);
  }, [matchesInterestedRoute, isRequestWithinRadius]); // isRequestWithinRadius is now stable

  // Function to send scheduled ride confirmation email
  const sendScheduledRideConfirmation = async (bookingId, bookingData) => {
    try {
      const emailData = {
        to: bookingData.userEmail || bookingData.email || bookingData.customerEmail,
        customerName: bookingData.userName || bookingData.customerName || 'Customer',
        bookingId: bookingId,
        pickupLocation: bookingData.pickupCity || bookingData.pickupLocation?.name || bookingData.pickupSublocalityAddress,
        dropoffLocation: bookingData.destinationCity || bookingData.dropoffLocation?.name || bookingData.destinationSublocalityAddress,
        travelDate: bookingData.rideDate || bookingData.travelDate,
        pickupTime: bookingData.rideTime || bookingData.pickupTime,
        driverName: bookingData.driverName,
        driverPhone: bookingData.driverPhone,
        vehicleDetails: `${bookingData.vehicleType || ''} ${bookingData.vehicleModel || ''}`.trim(),
        vehicleNumber: bookingData.vehicleNumber || '',
        fare: bookingData.fare || bookingData.totalPrice,
        confirmationLink: `${window.location.origin}/scheduled-confirmation/${bookingId}`
      };
      
      // Call cloud function to send confirmation email
      const response = await fetch(
        'https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendScheduledConfirmation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailData)
        }
      );
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Scheduled ride confirmation email sent');
        return true;
      } else {
        console.error('Failed to send confirmation email:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return false;
    }
  };

  // Function to check booking data directly
  const checkBookingData = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'airportTransfers', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (bookingDoc.exists()) {
        const data = bookingDoc.data();
        console.log('🔍 DIRECT Firestore Check for booking:', bookingId, {
          customerName: data.customerName,
          userName: data.userName,
          displayName: data.displayName,
          firstName: data.firstName,
          lastName: data.lastName,
          contactNumber1: data.contactNumber1,
          contactNumber2: data.contactNumber2,
          customerPhone: data.customerPhone,
          userPhone: data.userPhone,
          phone: data.phone,
          phoneNumber: data.phoneNumber,
          mobile: data.mobile,
          contactNumber: data.contactNumber,
          email: data.email,
          customerEmail: data.customerEmail,
          userEmail: data.userEmail,
          userId: data.userId,
          customerId: data.customerId,
          userLocation: data.userLocation,
          waitingForLocation: data.waitingForLocation,
          locationShared: data.locationShared,
          paymentStatus: data.paymentStatus,
          status: data.status,
          ALL_FIELDS: Object.keys(data)
        });
      } else {
        console.log('❌ Booking not found:', bookingId);
      }
    } catch (error) {
      console.error('Error checking booking:', error);
    }
  };

  // Function to fetch customer phone number
  const fetchCustomerPhone = async (ride) => {
    const rideId = ride.id;
    
    // If already fetching or already have valid phone, skip
    if (fetchingPhones[rideId] || (customerPhones[rideId] && customerPhones[rideId] !== 'Not provided')) {
      return;
    }
    
    setFetchingPhones(prev => ({ ...prev, [rideId]: true }));
    
    try {
      let phone = 'Not provided';
      let foundSource = '';
      
      // First, check if phone is in ride document (with more thorough check)
      const phoneInRide = getCustomerPhoneFromRide(ride);
      if (phoneInRide !== 'Not provided') {
        phone = phoneInRide;
        foundSource = 'ride document';
      } else {
        console.log(`🔍 Searching for phone for ride ${rideId}:`, {
          userId: ride.userId,
          customerId: ride.customerId,
          email: ride.email || ride.userEmail || ride.customerEmail
        });
        
        // Method 1: Try to get from user document by userId/customerId
        if (ride.userId || ride.customerId) {
          const userId = ride.userId || ride.customerId;
          console.log(`📋 Attempting to fetch user document for ID: ${userId}`);
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('👤 User document found:', {
              phone: userData.phone,
              phoneNumber: userData.phoneNumber,
              contactNumber1: userData.contactNumber1,
              contactNumber2: userData.contactNumber2,
              mobile: userData.mobile,
              contactNumber: userData.contactNumber,
              allFields: Object.keys(userData)
            });
            phone = userData.phone || userData.phoneNumber || 
                    userData.contactNumber1 || userData.contactNumber2 || 
                    userData.mobile || userData.contactNumber || 'Not provided';
            if (phone !== 'Not provided') {
              foundSource = 'user document by ID';
            }
          } else {
            console.log('❌ User document does not exist for ID:', userId);
          }
        }
        
        // Method 2: Try to get by email
        if (phone === 'Not provided' && (ride.email || ride.userEmail || ride.customerEmail)) {
          const email = ride.email || ride.userEmail || ride.customerEmail;
          console.log(`📧 Searching for user by email: ${email}`);
          const usersQuery = query(
            collection(db, 'users'),
            where('email', '==', email),
            limit(1)
          );
          
          const querySnapshot = await getDocs(usersQuery);
          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log('👤 User found by email:', {
              phone: userData.phone,
              phoneNumber: userData.phoneNumber,
              contactNumber1: userData.contactNumber1,
              contactNumber2: userData.contactNumber2,
              mobile: userData.mobile,
              contactNumber: userData.contactNumber,
              allFields: Object.keys(userData)
            });
            phone = userData.phone || userData.phoneNumber || 
                    userData.contactNumber1 || userData.contactNumber2 || 
                    userData.mobile || userData.contactNumber || 'Not provided';
            if (phone !== 'Not provided') {
              foundSource = 'user document by email';
            }
          } else {
            console.log('❌ No user found with that email:', email);
          }
        }
        
        // Method 3: Check in customers collection
        if (phone === 'Not provided' && (ride.email || ride.userEmail || ride.customerEmail)) {
          const email = ride.email || ride.userEmail || ride.customerEmail;
          console.log(`👥 Searching in customers collection for email: ${email}`);
          const customersQuery = query(
            collection(db, 'customers'),
            where('email', '==', email),
            limit(1)
          );
          
          const querySnapshot = await getDocs(customersQuery);
          if (!querySnapshot.empty) {
            const customerDoc = querySnapshot.docs[0];
            const customerData = customerDoc.data();
            console.log('👥 Customer found:', {
              phone: customerData.phone,
              phoneNumber: customerData.phoneNumber,
              contactNumber1: customerData.contactNumber1,
              contactNumber2: customerData.contactNumber2,
              mobile: customerData.mobile,
              contactNumber: customerData.contactNumber,
              allFields: Object.keys(customerData)
            });
            phone = customerData.phone || customerData.phoneNumber || 
                    customerData.contactNumber1 || customerData.contactNumber2 || 
                    customerData.mobile || customerData.contactNumber || 'Not provided';
            if (phone !== 'Not provided') {
              foundSource = 'customers collection';
            }
          } else {
            console.log('❌ No customer found with that email:', email);
          }
        }
      }
      
      // Update the phone in state
      setCustomerPhones(prev => ({ ...prev, [rideId]: phone }));
      
      if (phone !== 'Not provided') {
        console.log(`✅ Phone found for ${rideId}: ${phone} from ${foundSource}`);
      } else {
        console.log(`❌ Phone not found for ride ${rideId}`);
      }
      
    } catch (error) {
        console.error('Error fetching phone:', error); // just log, no toast
      } finally {
        setFetchingPhones(prev => ({ ...prev, [rideId]: false }));
      }
  };

  // Debug button component
  const AddDebugButton = ({ ride }) => (
    <button
      onClick={() => checkBookingData(ride.id)}
      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded mt-2"
    >
      🔍 Debug Data
    </button>
  );
  
  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  useEffect(() => {
    console.log('DriverDashboard state:', {
      loading,
      hasUser: !!user,
      userId: user?.uid,
      rideRequestsCount: {
        outstation: rideRequests.outstation?.length || 0,
        holiday: rideRequests.holiday?.length || 0,
        airport: rideRequests.airport?.length || 0
      },
      acceptedRidesCount: acceptedRides.length,
      selectedRide: selectedRide?.id,
      driverLocation: driverLocation ? `📍 ${driverLocation.lat?.toFixed(4)}, ${driverLocation.lng?.toFixed(4)}` : 'No location'
    });
  }, [loading, user, rideRequests, acceptedRides, selectedRide, driverLocation]);

  // REAL-TIME DRIVER LOCATION UPDATES - FIXED VERSION
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('📍 Starting real-time driver location tracking');
    
    const updateDriverLocationInAllRides = async (location) => {
      try {
        const updatePromises = [];
        
        // 1. Update Airport Transfers
        const airportRidesQuery = query(
          collection(db, 'airportTransfers'),
          where('driverId', '==', user.uid),
          where('status', 'in', ['accepted', 'driver_arrived', 'in_progress'])
        );
        
        const airportSnapshot = await getDocs(airportRidesQuery);
        airportSnapshot.forEach((docSnap) => {
          const rideRef = doc(db, 'airportTransfers', docSnap.id);
          updatePromises.push(
            updateDoc(rideRef, {
              'driverLocation': location,
              'driverLocationUpdatedAt': serverTimestamp(),
              'lastUpdated': serverTimestamp()
            })
          );
        });
        
        // 2. Update Outstation Bookings (THE FIX!)
        const outstationBookingsQuery = query(
          collection(db, 'bookings'),
          where('driverId', '==', user.uid),
          where('status', 'in', ['accepted', 'driver_assigned', 'driver_arrived', 'in_progress'])
        );
        
        const outstationSnapshot = await getDocs(outstationBookingsQuery);
        outstationSnapshot.forEach((docSnap) => {
          const bookingRef = doc(db, 'bookings', docSnap.id);
          updatePromises.push(
            updateDoc(bookingRef, {
              'driverLocation': location,
              'driverLocationUpdatedAt': serverTimestamp(),
              'lastUpdated': serverTimestamp()
            })
          );
        });
        // 3. Update Local Rides
        const localRidesQuery = query(
          collection(db, 'localRides'),
          where('driverId', '==', user.uid),
          where('status', 'in', ['accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled']),
        );

        const localSnapshot = await getDocs(localRidesQuery);
        localSnapshot.forEach((docSnap) => {
          const rideRef = doc(db, 'localRides', docSnap.id);
          updatePromises.push(
            updateDoc(rideRef, {
              driverLocation: location,
              driverLocationUpdatedAt: serverTimestamp(),
              lastUpdated: serverTimestamp()
            })
          );
        });
        
        await Promise.all(updatePromises);
        console.log('📍 Updated driver location in', updatePromises.length, 'active rides (airport + outstation)');
      } catch (error) {
        console.error('Error updating driver location in rides:', error);
      }
    };
    
    locationWatchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || null
        };
        
        console.log('📍 Driver location updated:', newLocation);
        setDriverLocation(newLocation);

        driverLocationRef.current = newLocation;
        
        try {
          // Update driver's own location document
          const driverRef = doc(db, 'users', user.uid);
            await updateDoc(driverRef, {
              currentLocation: newLocation,
              lastUpdated: serverTimestamp(),
              isOnline: true
            });
        } catch (error) {
          console.error('Error updating driver location:', error);
        }
        
        // Update location in ALL active rides (airport + outstation)
        await updateDriverLocationInAllRides(newLocation);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        distanceFilter: 10
      }
    );
    
    return () => {
      if (locationWatchIdRef.current) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
    };
  }, [user?.uid]);

  // REAL-TIME listener for accepted rides - all types, latest 20
  useEffect(() => {
    if (!user?.uid) return;

    console.log('🎯 Setting up REAL-TIME listener for ACCEPTED rides (all types, max 20)');

    if (acceptedRidesUnsubscribeRef.current) {
      acceptedRidesUnsubscribeRef.current();
    }

    const ACTIVE_STATUSES = [
      'accepted',
      'driver_arrived',
      'in_progress',
      'completed',
      'cancelled',
      'driver_assigned',
      'scheduled_pending'
    ];

    // Shared merge helper - merges all ride arrays, dedupes by id, sorts by date, caps at 20
    const mergeAndSet = (type, incoming) => {
      setAcceptedRides(prev => {
        // Remove old entries of this type, add new ones
        const others = prev.filter(r => r._sourceType !== type);
        const tagged = incoming.map(r => ({ ...r, _sourceType: type }));
        const merged = [...others, ...tagged];

        // Dedupe by id (keep last occurrence)
        const seen = new Map();
        for (const r of merged) seen.set(r.id, r);

        // Sort by updatedAt or createdAt descending, cap at 20
        return Array.from(seen.values())
          .sort((a, b) => {
            const ta = (a.updatedAt?.seconds || a.createdAt?.seconds || 0);
            const tb = (b.updatedAt?.seconds || b.createdAt?.seconds || 0);
            return tb - ta;
          })
          .slice(0, 20);
      });
    };

    // 1. Airport transfers
    const unsubAirport = onSnapshot(
      query(
        collection(db, 'airportTransfers'),
        where('driverId', '==', user.uid),
        where('status', 'in', ACTIVE_STATUSES),
        orderBy('updatedAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        console.log('📥 ACCEPTED airport rides snapshot with', snapshot.docs.length, 'documents');

        const rides = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'airport',
          _updatedAt: Date.now()
        }));

        rides.forEach(r => console.log(`✅ Airport Ride ${r.id}: status = ${r.status}`));

        mergeAndSet('airport', rides);

        if (selectedRide) {
          const updatedRide = rides.find(r => r.id === selectedRide.id);
          if (updatedRide) setSelectedRide(updatedRide);
        }
      },
      (error) => {
        console.error('Error fetching accepted airport rides:', error);
        toast.error('Failed to load airport accepted rides');
      }
    );

    // 2. Local rides
    const unsubLocal = onSnapshot(
      query(
        collection(db, 'localRides'),
        where('driverId', '==', user.uid),
        where('status', 'in', ACTIVE_STATUSES),
        orderBy('createdAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        console.log('📥 ACCEPTED local rides snapshot with', snapshot.docs.length, 'documents');

        const rides = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'localPickup',
          _updatedAt: Date.now()
        }));

        mergeAndSet('localPickup', rides);
      },
      (error) => {
        console.error('Error fetching accepted local rides:', error);
      }
    );

    // 3. Outstation bookings
    const unsubOutstation = onSnapshot(
      query(
        collection(db, 'bookings'),
        where('driverId', '==', user.uid),
        where('status', 'in', ACTIVE_STATUSES)
        // no orderBy — we sort in mergeAndSet already
      ),
      (snapshot) => {
        console.log('📥 ACCEPTED outstation rides snapshot with', snapshot.docs.length, 'documents');

        const rides = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'outstation',
          _updatedAt: Date.now()
        }));

        mergeAndSet('outstation', rides);
      },
      (error) => {
        console.error('Error fetching accepted outstation rides:', error);
      }
    );

    // 4. Holiday bookings
    const unsubHoliday = onSnapshot(
      query(
        collection(db, 'holidayBookings'),
        where('driverId', '==', user.uid),
        where('status', 'in', ACTIVE_STATUSES),
        orderBy('updatedAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        console.log('📥 ACCEPTED holiday rides snapshot with', snapshot.docs.length, 'documents');

        const rides = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'holiday',
          _updatedAt: Date.now()
        }));

        mergeAndSet('holiday', rides);
      },
      (error) => {
        console.error('Error fetching accepted holiday rides:', error);
      }
    );

    acceptedRidesUnsubscribeRef.current = () => {
      unsubAirport();
      unsubLocal();
      unsubOutstation();
      unsubHoliday();
    };

    return () => {
      if (acceptedRidesUnsubscribeRef.current) {
        acceptedRidesUnsubscribeRef.current();
      }
    };
  }, [user?.uid, selectedRide]);

  // Effect to auto-fetch phone numbers for accepted rides
  useEffect(() => {
    if (acceptedRides.length > 0 && activeTab === 'myrides') {
      console.log('📞 Auto-fetching phone numbers for', acceptedRides.length, 'rides');
      
      acceptedRides.forEach((ride) => {
        const rideId = ride.id;
        const phoneInRide = getCustomerPhoneFromRide(ride);
        
        console.log(`Checking ride ${rideId}:`, {
          hasCustomerPhone: !!phoneInRide && phoneInRide !== 'Not provided',
          phoneInRide: phoneInRide,
          alreadyFetched: !!customerPhones[rideId],
          currentPhone: customerPhones[rideId],
          isFetching: !!fetchingPhones[rideId],
          status: ride.status
        });
        
        // If phone is already in ride document, use it immediately
        if (phoneInRide !== 'Not provided') {
          if (!customerPhones[rideId] || customerPhones[rideId] === 'Not provided') {
            console.log(`📱 Phone found in ride document for ${rideId}: ${phoneInRide}`);
            setCustomerPhones(prev => ({ ...prev, [rideId]: phoneInRide }));
          }
        } 
        // Otherwise, try to fetch from user document (only for active rides)
        else if (
          (ride.status === 'accepted' || ride.status === 'driver_arrived' || ride.status === 'in_progress') &&
          (!customerPhones[rideId] || customerPhones[rideId] === 'Not provided') && 
          !fetchingPhones[rideId]
        ) {
          console.log(`🔍 Attempting to fetch phone for ride ${rideId}`);
          // Use a small delay to avoid overwhelming with simultaneous requests
          setTimeout(() => {
            fetchCustomerPhone(ride);
          }, Math.random() * 1000); // Random delay between 0-1 second
        }
      });
    }
  }, [acceptedRides, activeTab, customerPhones, fetchingPhones]);

  // Fetch driver's interested routes
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('🔍 Fetching interested routes for driver:', user.uid);
    
    const routesRef = collection(db, 'drivers', user.uid, 'assignedRoutes');
    const q = query(routesRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routes = [];
      snapshot.forEach((doc) => {
        routes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      console.log('✅ Fetched interested routes:', routes);
      setInterestedRoutes(routes);
    }, (error) => {
      console.error('❌ Error fetching interested routes:', error);
    });
    
    return () => unsubscribe();
  }, [user?.uid]);

  // Set up Firestore listeners for ride requests
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user UID available, skipping listener setup');
      setLoading(false);
      return () => {};
    }
    
    console.log(`[DriverDashboard] Setting up listeners for user: ${user.uid}`);
    
    if (unsubscribeRef.current) {
      console.log('[DriverDashboard] Cleaning up previous listeners');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    setLoading(true);
    let isMounted = true;
    let outstationUnsubscribe = () => {};
    let holidayUnsubscribe = () => {};
    let airportUnsubscribe = () => {};

    previousRequestCount.current = { outstation: 0, holiday: 0, airport: 0, localPickup: 0 };
    isInitialLoadRef.current = { outstation: true, holiday: true, airport: true, localPickup: true }; // ✅ ADD THIS


    // Outstation Requests
    const outstationRequestsRef = collection(db, `drivers/${user.uid}/incomingRequests`);
    const outstationQuery = query(
      outstationRequestsRef,
      where('type', '==', 'outstation'),
      where('status', 'in', [
        'pending',
        'searching_driver',
        'SEARCHING_DRIVER'
      ]),
      orderBy('createdAt', 'desc')
    );
    // 🔥 Local Pickup Requests
    const localQuery = query(
      collection(db, `users/${user.uid}/incomingRequests`),
      where('type', '==', 'localPickup'),
      where('status', 'in', [
        'pending',
        'searching_driver',
        'SEARCHING_DRIVER'
      ]),
      orderBy('createdAt', 'desc')
    );
    // Airport Transfer Requests
    const airportRequestsRef = collection(db, 'airportTransfers');
    const airportQuery = query(
      airportRequestsRef,
      where('status', 'in', ['searching_driver', 'pending']),
      orderBy('createdAt', 'desc')
    );

    // Holiday Requests
    const holidayRequestsRef = collection(db, `users/${user.uid}/holidayRequests`);
    const holidayQuery = query(
      collection(db, `users/${user.uid}/holidayRequests`),
      where('status', 'in', ['pending', 'searching_driver', 'driver_requested'])
    );
    
    
    const processIncomingRequests = (type, docs, existingRequests = []) => {
      const now = Date.now();
      const processed = [];
      const newRequests = [];
      
      console.log(`[DriverDashboard] Processing ${docs.length} ${type} documents`);
      
      for (const doc of docs) {
        try {
          // Handle both DocumentSnapshot and QueryDocumentSnapshot
          let docData, docId;
          
          if (typeof doc.data === 'function') {
            if (doc.exists && !doc.exists()) {
              console.log(`[DriverDashboard] Document ${doc.id} does not exist, skipping`);
              continue;
            }
            docData = doc.data();
            docId = doc.id;
          } else if (doc.doc) {
            // Handle document change events
            if (!doc.doc.exists) {
              console.log(`[DriverDashboard] Document in change event does not exist, skipping`);
              continue;
            }
            docData = doc.doc.data();
            docId = doc.doc.id;
          } else {
            console.log(`[DriverDashboard] Invalid document format, skipping:`, doc);
            continue;
          }
          
          const request = { 
            id: docId,
            ...docData,
            type,
            _lastUpdated: now
          };
          
          const cacheKey = `${type}_${request.bookingId || request.id}`;
          // if (requestCache.has(cacheKey)) {
          //   console.log(`[DriverDashboard] Skipping duplicate ${type} request:`, request.id);
          //   continue;
          // }
          
          const isNew = !existingRequests.some(r => r.id === request.id);
          if (isNew) {
            console.log(`[DriverDashboard] New ${type} request detected:`, request.id);
            newRequests.push(request);
            requestCache.set(cacheKey, Date.now()); // ✅ Map needs .set() not .add()
          }
          
          processed.push(request);
        } catch (error) {
          console.error(`[DriverDashboard] Error processing ${type} document:`, error);
        }
      }
      
      return { processed, newRequests };
    };

    // Subscribe to airport transfer requests
    airportUnsubscribe = onSnapshot(airportQuery, 
      async (snapshot) => {
        if (!isMounted) return;
        
        console.log(`[Airport] Received ${snapshot.docs.length} airport transfer documents`);
        
        const { processed: allProcessed, newRequests } = processIncomingRequests(
          'airport', 
          snapshot.docChanges(),
          rideRequests.airport
        );
        
        // ✅ UPDATED: Apply combined route matching AND radius filtering
        const processed = allProcessed.filter(request => {
          return shouldShowRequest(request);
        });
        
        console.log(`📊 Airport: ${allProcessed.length} total → ${processed.length} after filtering`);
        console.log(`[Airport] ${processed.length} requests match driver's routes AND are within 15km`);
        
        previousRequestCount.current.airport = processed.length;
        debouncedUpdate('airport', processed);
        
        // Filter new requests for notifications
        const newMatchingRequests = newRequests.filter(request => {
          return shouldShowRequest(request);
        });

        if (!isInitialLoadRef.current.airport) { // ✅ only notify after first load
          if (newMatchingRequests.length > 0 && isAudioEnabledRef.current) {
            const message = `✈️ ${newMatchingRequests.length} new airport transfer request!`;
            toast.info(message);
            playNotification('New airport transfer request available');
          }
        }
        isInitialLoadRef.current.airport = false; // ✅ mark first load done
      },
      (error) => {
        console.error('Error fetching airport transfer requests:', error);
        if (isMounted) {
          toast.error('Failed to load airport transfer requests');
          setLoading(false);
        }
      }
    );
    const playRepeatedNotification = (message, times = 3, gap = 1200) => {
      if (!('speechSynthesis' in window)) return;

      let count = 0;

      const speak = () => {
        if (count >= times) return;
        playNotification(message);
        count++;
        setTimeout(speak, gap);
      };

      speak();
    };
    let localUnsubscribe = () => {};

    localUnsubscribe = onSnapshot(localQuery, (snapshot) => {
      if (!isMounted) return;

      const now = Date.now();

      const unique = new Map();

        snapshot.docs.forEach(doc => {
          const data = {
            id: doc.id,
            ...doc.data(),
            type: 'localPickup'
          };

          // prevent duplicates
          unique.set(doc.id, data);
        });

        const requests = Array.from(unique.values())
          // 🔥 EXPIRY FILTER (3 minutes)
          .filter(r => !r.expiresAt || r.expiresAt.toMillis() > now)
          // 🔥 3km radius filter
          .filter(r => isRequestWithinRadius(r));

      console.log(`🚕 LocalPickup visible: ${requests.length}`);

      debouncedUpdate('localPickup', requests);

      if (!isInitialLoadRef.current.localPickup) { // ✅ only notify after first load
        if (
          requests.length > previousRequestCount.current.localPickup &&
          isAudioEnabledRef.current
        ) {
          toast.info('🚕 New local pickup request!');
          playNotification('New local pickup ride request'); // ✅ removed repeated speech
        }
      }
      isInitialLoadRef.current.localPickup = false; // ✅ mark first load done
      previousRequestCount.current.localPickup = requests.length;
    });
    // Subscribe to outstation requests
    outstationUnsubscribe = onSnapshot(outstationQuery, 
      (snapshot) => {
        if (!isMounted) return;
      
        const { processed, newRequests } = processIncomingRequests(
          'outstation', 
          snapshot.docChanges(),  // ← RESTORE this (was working before)
          rideRequests.outstation
        );
        
        // ✅ UPDATED: Apply combined filtering
        const filteredByRadius = processed.filter(request => {
          return shouldShowRequest(request);
        });
        
        console.log(`📊 Outstation: ${processed.length} total → ${filteredByRadius.length} after filtering`);
        
        previousRequestCount.current.outstation = filteredByRadius.length;
        debouncedUpdate('outstation', filteredByRadius);
        
        // Filter new requests for notifications
       const newMatchingRequests = newRequests.filter(request => {
        return shouldShowRequest(request);
      });

      if (!isInitialLoadRef.current.outstation) { // ✅ only notify after first load
        if (newMatchingRequests.length > 0 && isAudioEnabledRef.current) {
          const message = `🚗 ${newMatchingRequests.length} new outstation ride request!`;
          toast.info(message);
          playNotification('New outstation ride request');
        }
      }
      isInitialLoadRef.current.outstation = false; // ✅ mark first load done
      },
      (error) => {
        console.error('Error fetching outstation requests:', error);
        if (isMounted) {
          toast.error('Failed to load outstation requests');
          setLoading(false);
        }
      }
    );

    // Subscribe to holiday requests
    holidayUnsubscribe = onSnapshot(holidayQuery, (snapshot) => {
      if (!isMounted) return;

      const processed = [];
      const newRequests = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const assignedDrivers = data.assignedDrivers || [];
        if (assignedDrivers.includes(user.uid)) return;

        const request = {
          id: docSnap.id,
          ...data,
          type: 'holiday',
          customerName: data.userName || data.customerName || 'Customer',
          customerPhone: data.userPhone || data.phone || data.contactNumber || '',
          pickupLocation: data.pickupCity || data.pickupLocation || data.pickupAddress || '',
          dropoffLocation: data.destinationCity || data.destinationLocation || data.destinationAddress || '',
          travelDate: data.travelDate || data.startDate || data.departureDate,
          travelers: data.travelers || data.passengers || { adults: data.adults || 1, children: data.children || 0 },
          packageName: data.packageName || data.holidayPackage || data.tourName || 'Holiday Package',
          totalPrice: data.totalPrice || data.price || data.fare || 0,
          bookingId: data.bookingId || data.holidayBookingId || data.parentBookingId || docSnap.id,
          userId: data.userId || data.customerId,
          userEmail: data.userEmail || data.email || data.customerEmail,
          createdAt: data.createdAt,
        };

        const isNew = !rideRequests.holiday.some(r => r.id === request.id);
        if (isNew) newRequests.push(request);
        processed.push(request);
      });

      // Sort in JS instead of Firestore orderBy
      const sorted = processed.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      const filtered = sorted.filter(r => isRequestWithinRadius(r));

      previousRequestCount.current.holiday = filtered.length;
      debouncedUpdate('holiday', filtered);

      const newMatching = newRequests.filter(r => isRequestWithinRadius(r));

      if (!isInitialLoadRef.current.holiday) {
        if (newMatching.length > 0 && isAudioEnabledRef.current) {
          toast.info(`🎉 ${newMatching.length} new holiday package request!`);
          playNotification('New holiday package request');
        }
      }
      isInitialLoadRef.current.holiday = false;
    }, (error) => {
      console.error('Error in holiday listener:', error);
      if (isMounted) { toast.error('Failed to load holiday requests'); setLoading(false); }
    });

    unsubscribeRef.current = () => {
      if (typeof outstationUnsubscribe === 'function') outstationUnsubscribe();
      if (typeof holidayUnsubscribe === 'function') holidayUnsubscribe();
      if (typeof airportUnsubscribe === 'function') airportUnsubscribe();
      if (typeof localUnsubscribe === 'function') localUnsubscribe();
    };

    return () => {
      console.log('[DriverDashboard] Cleaning up listeners');
      isMounted = false;
      if (outstationUnsubscribe) outstationUnsubscribe();
      if (holidayUnsubscribe) holidayUnsubscribe();
      if (airportUnsubscribe) airportUnsubscribe();
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setLoading(false);
    };
  }, [user?.uid, debouncedUpdate, shouldShowRequest, isRequestWithinRadius]);

  // Play notification sound in Hindi
  const playNotification = (message) => {
    if ('speechSynthesis' in window) {
      const hindiMessages = {
        'New local pickup request available': 'नया लोकल पिकअप रिक्वेस्ट आया है',
        'New airport transfer request available': 'नया एयरपोर्ट ट्रांसफर रिक्वेस्ट aaya hain',
        'New outstation ride request': 'नया आउटस्टेशन राइड रिक्वेस्ट aaya hain',
        'New holiday package request': 'नया होलिडे पैकेज request aaya hain',
        'Ride request accepted': 'राइड request accept किया गया',
        'Ride request rejected': 'राइड request reject किया गया',
        'Driver is on the way': 'ड्राइवर आपके पास पहुंच रहा है',
        'Driver has arrived': 'ड्राइवर आ गया है',
        'Ride started': 'राइड शुरू हो गई है',
        'Ride completed': 'राइड पूरी हो गई है',
        'You have a new ride request': 'आपको एक नया राइड request aaya hain',
        'Request accepted successfully': 'Request accept किया गया',
        'Request rejected successfully': 'Request reject किया गया',
        'Ride cancelled successfully': 'राइड cancel किया गया'
      };

      const hindiMessage = hindiMessages[message] || message;
      
      const utterance = new SpeechSynthesisUtterance(hindiMessage);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(voice => 
        voice.lang === 'hi-IN' && voice.name.toLowerCase().includes('female')
      );
      
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'all') {
      return [
        ...(rideRequests.localPickup || []),
        ...(rideRequests.outstation || []),
        ...(rideRequests.holiday || []),
        ...(rideRequests.airport || [])
      ].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
    return (rideRequests[activeTab] || [])
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [activeTab, rideRequests]);

  const handleRideAction = async (action, requestId, request) => {
    if (processingRequest?.id === requestId) {
      console.log("⚠️ Request already processing");
      return;
    }
    let loadingToast;
    try {
      console.log(`[DriverDashboard] Processing ${action} for request:`, { requestId, request });

      loadingToast = toast.loading(
        `${action === 'accept' ? 'Accepting' : 'Rejecting'} ${
          request.type === 'airport' ? 'airport transfer' : 
          request.type === 'holiday' ? 'holiday package' : 'ride'
        } request...`
      );
      
      const isHolidayRequest = request.type === 'holiday';
      const isAirportRequest = request.type === 'airport';
      let requestRef;
      let userId = user.uid;
      let updateData = {};

      if (isAirportRequest) {
        requestRef = doc(db, 'airportTransfers', requestId);
        
        const requestDoc = await getDoc(requestRef);
        if (!requestDoc.exists()) {
          throw new Error('This airport transfer request is no longer available.');
        }

        const currentRequest = requestDoc.data();
        if (currentRequest.status !== 'searching_driver' && currentRequest.status !== 'pending') {
          throw new Error('This request is no longer available for assignment.');
        }

        updateData = {
          status: action === 'accept' ? 'accepted' : 'rejected',
          updatedAt: serverTimestamp(),
          ...(action === 'accept' ? {
            driverId: user.uid,
            driverName: userData?.fullName || userData?.displayName || 'Driver',
            driverPhone: userData?.phone || userData?.phoneNumber || '',
            driverEmail: userData?.email || '',
            vehicleType: userData?.vehicleType || 'Standard',
            vehicleModel: userData?.vehicleModel || '',
            vehicleNumber: userData?.vehicleNumber || '',
            vehicleColor: userData?.vehicleColor || '',
            driverLocation: driverLocation,
            driverLocationUpdatedAt: serverTimestamp(),
            acceptedAt: serverTimestamp()
          } : {
            rejectedAt: serverTimestamp()
          })
        };

        await updateDoc(requestRef, updateData);
        if (action === 'accept' && request.isScheduled) {
          const bookingRef = doc(db, 'bookings', request.bookingId);

          await updateDoc(bookingRef, {
            status: 'scheduled_pending',
            paymentStatus: 'pending',
            driverAssigned: true,
            driverId: user.uid,
            driverAssignedAt: serverTimestamp()
          });

          console.log('✅ Scheduled ride marked as payment pending');
        }
        console.log(`✅ Airport transfer ${action}ed successfully with status: ${updateData.status}`);

      } else if (isHolidayRequest) {

        const driverInfoPayload = {
          id:            user.uid,
          name:          userData?.fullName     || userData?.displayName || 'Driver',
          phone:         userData?.phone        || userData?.phoneNumber  || '',
          vehicle:       userData?.vehicleModel || userData?.vehicleType  || '',
          vehicleNumber: userData?.vehicleNumber || '',
          rating:        4.8,
          rides:         100,
        };

        // Step 1: Update the notification doc in users/{driverUID}/holidayRequests
        try {
          const notifRef = doc(db, 'users', user.uid, 'holidayRequests', requestId);
          const notifSnap = await getDoc(notifRef);
          if (notifSnap.exists()) {
            await updateDoc(notifRef, {
              status: action === 'accept' ? 'accepted' : 'rejected',
              updatedAt: serverTimestamp(),
              ...(action === 'accept' ? { driverId: user.uid, acceptedAt: serverTimestamp() } : { rejectedAt: serverTimestamp() }),
            });
          }
        } catch (e) {
          console.warn('Could not update notification doc:', e.message);
        }

        // Step 2: If accepting, update the main holidayBookings doc
        if (action === 'accept') {
          let updated = false;

          console.log('🔍 request.bookingId:', request.bookingId);
          console.log('🔍 request.userId:', request.userId);
          console.log('🔍 request.userEmail:', request.userEmail);
          console.log('🔍 requestId (notification doc id):', requestId);

          // Strategy 1 — bookingId stored in the notification doc
          const candidateId = request.bookingId || request.holidayBookingId || request.parentBookingId;
          if (candidateId) {
            try {
              const ref  = doc(db, 'holidayBookings', candidateId);
              const snap = await getDoc(ref);
              console.log('🔍 Strategy1 exists:', snap.exists(), 'status:', snap.data()?.status);
              if (snap.exists()) {
                await updateDoc(ref, {
                  status:      'driver_assigned',
                  driverInfo:  driverInfoPayload,
                  driverId:    user.uid,
                  driverName:  driverInfoPayload.name,
                  driverPhone: driverInfoPayload.phone,
                  updatedAt:   serverTimestamp(),
                });
                console.log('✅ Strategy 1 success');
                updated = true;
              }
            } catch (e) { console.warn('Strategy 1 error:', e.message); }
          }

          // Strategy 2 — use requestId itself as the holidayBookings doc ID
          if (!updated) {
            try {
              const ref  = doc(db, 'holidayBookings', requestId);
              const snap = await getDoc(ref);
              console.log('🔍 Strategy2 exists:', snap.exists());
              if (snap.exists()) {
                await updateDoc(ref, {
                  status:      'driver_assigned',
                  driverInfo:  driverInfoPayload,
                  driverId:    user.uid,
                  driverName:  driverInfoPayload.name,
                  driverPhone: driverInfoPayload.phone,
                  updatedAt:   serverTimestamp(),
                });
                console.log('✅ Strategy 2 success');
                updated = true;
              }
            } catch (e) { console.warn('Strategy 2 error:', e.message); }
          }

          // Strategy 3 — search by userId
          if (!updated && request.userId) {
            try {
              const snap = await getDocs(query(
                collection(db, 'holidayBookings'),
                where('userId', '==', request.userId),
                limit(5)
              ));
              console.log('🔍 Strategy3 by userId results:', snap.size);
              if (!snap.empty) {
                const sorted = snap.docs.sort((a, b) =>
                  (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)
                );
                await updateDoc(doc(db, 'holidayBookings', sorted[0].id), {
                  status:      'driver_assigned',
                  driverInfo:  driverInfoPayload,
                  driverId:    user.uid,
                  driverName:  driverInfoPayload.name,
                  driverPhone: driverInfoPayload.phone,
                  updatedAt:   serverTimestamp(),
                });
                console.log('✅ Strategy 3 success, doc:', sorted[0].id);
                updated = true;
              }
            } catch (e) { console.warn('Strategy 3 error:', e.message); }
          }

          // Strategy 4 — search by userEmail
          if (!updated && request.userEmail) {
            try {
              const snap = await getDocs(query(
                collection(db, 'holidayBookings'),
                where('userEmail', '==', request.userEmail),
                limit(5)
              ));
              console.log('🔍 Strategy4 by userEmail results:', snap.size);
              if (!snap.empty) {
                const sorted = snap.docs.sort((a, b) =>
                  (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)
                );
                await updateDoc(doc(db, 'holidayBookings', sorted[0].id), {
                  status:      'driver_assigned',
                  driverInfo:  driverInfoPayload,
                  driverId:    user.uid,
                  driverName:  driverInfoPayload.name,
                  driverPhone: driverInfoPayload.phone,
                  updatedAt:   serverTimestamp(),
                });
                console.log('✅ Strategy 4 success, doc:', sorted[0].id);
                updated = true;
              }
            } catch (e) { console.warn('Strategy 4 error:', e.message); }
          }

          // Strategy 5 — get ALL searching_driver bookings
          if (!updated) {
            try {
              const snap = await getDocs(query(
                collection(db, 'holidayBookings'),
                where('status', 'in', ['searching_driver', 'pending', 'driver_requested']),
                limit(10)
              ));
              console.log('🔍 Strategy5 all pending:', snap.size);
              if (!snap.empty) {
                const sorted = snap.docs.sort((a, b) =>
                  (b.data().createdAt?.seconds || 0) - (a.data().createdAt?.seconds || 0)
                );
                await updateDoc(doc(db, 'holidayBookings', sorted[0].id), {
                  status:      'driver_assigned',
                  driverInfo:  driverInfoPayload,
                  driverId:    user.uid,
                  driverName:  driverInfoPayload.name,
                  driverPhone: driverInfoPayload.phone,
                  updatedAt:   serverTimestamp(),
                });
                console.log('✅ Strategy 5 success, doc:', sorted[0].id);
                updated = true;
              }
            } catch (e) { console.warn('Strategy 5 error:', e.message); }
          }

          if (!updated) {
            throw new Error('Holiday booking not found - could not match to any booking');
          }
        }
      }
      else if (request.type === 'localPickup') {

        if (action === 'accept') {
          if (!driverLocation || !driverLocation.lat || !driverLocation.lng) {
            throw new Error("Driver location not available yet");
          }
          console.log("📤 Sending accept payload:", {
            rideId: requestId,
            driverId: user.uid,
            driverLocation
          });
          const response = await fetch(
            "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/acceptLocalRide",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rideId: requestId,
                driverId: user.uid,
                driverName: userData?.fullName || userData?.displayName || "Driver",
                driverPhone: userData?.phone || userData?.phoneNumber || "",
                vehicleType: userData?.vehicleType || "car",
                vehicleNumber: userData?.vehicleNumber || "",
                driverLocation: {
                  lat: Number(driverLocation.lat),
                  lng: Number(driverLocation.lng),
                  accuracy: driverLocation.accuracy || 0,
                  heading: driverLocation.heading || null,
                  speed: driverLocation.speed || 0,
                  timestamp: Date.now()
                }
              })
            }
          );

          if (!response.ok) {
            throw new Error("Server error while accepting ride");
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || "Failed to accept ride");
          }
          // remove request from driver's incomingRequests
          const incomingRef = doc(
            db,
            `users/${user.uid}/incomingRequests/${requestId}`
          );

          await updateDoc(incomingRef, {
            status: "accepted",
            acceptedAt: serverTimestamp()
          });

        } else {

          // reject logic (just remove from incomingRequests)
          const incomingRef = doc(
            db,
             `users/${user.uid}/incomingRequests/${requestId}`
          );

          await updateDoc(incomingRef, {
            status: "rejected",
            rejectedBy: user.uid,
            rejectedAt: serverTimestamp()
          });

        }
      }
       else {
        // For outstation rides - UPDATED FOR SCHEDULED RIDES
        requestRef = doc(db, `drivers/${user.uid}/incomingRequests/${requestId}`);
        
        updateData = {
          status: action === 'accept' ? 'accepted' : 'rejected',
          updatedAt: serverTimestamp(),
          ...(action === 'accept' ? {
            driverId: user.uid,
            driverName: userData?.fullName || userData?.displayName || 'Driver',
            driverPhone: userData?.phone || userData?.phoneNumber || '',
            driverEmail: userData?.email || '',
            vehicleType: userData?.vehicleType || 'Standard',
            vehicleModel: userData?.vehicleModel || '',
            vehicleNumber: userData?.vehicleNumber || '',
            vehicleColor: userData?.vehicleColor || '',
            driverLocation: driverLocation,
            driverLocationUpdatedAt: serverTimestamp(),
            acceptedAt: serverTimestamp(),
            isScheduledAccepted: request.isScheduled || false
          } : {
            rejectedAt: serverTimestamp()
          })
        };

        // First update the incoming request
        await updateDoc(requestRef, updateData);

        // If this is an outstation request and it's being accepted
        if (action === 'accept') {
          if (!request.bookingId) {
            console.error('❌ Missing bookingId on outstation request:', request.id, request);
             throw new Error('Could not link to booking — bookingId missing. Contact support.');
            return;
          }
          try {
            const bookingRef = doc(db, 'bookings', request.bookingId);
            const bookingDoc = await getDoc(bookingRef);
            
            if (bookingDoc.exists()) {
              const bookingData = bookingDoc.data();
              
              // Determine the status based on ride type
              const bookingStatus = request.isScheduled ? 'driver_assigned' : 'driver_assigned';
              
              await updateDoc(bookingRef, {
                status: bookingStatus,
                driverAssigned: true,
                driverId: user.uid,
                driverName: updateData.driverName,
                driverPhone: updateData.driverPhone,
                driverEmail: updateData.driverEmail,
                vehicleType: updateData.vehicleType,
                vehicleNumber: updateData.vehicleNumber,
                driverLocation: request.isScheduled ? null : driverLocation,
                driverLocationUpdatedAt: request.isScheduled ? null : serverTimestamp(),
                updatedAt: serverTimestamp(),
                // ← ADD THIS BLOCK: nested object that OutstationBooking.jsx reads
                assignedDriver: {
                  name: updateData.driverName,
                  phone: updateData.driverPhone,
                  email: updateData.driverEmail,
                  vehicle: {
                    type: updateData.vehicleType,
                    model: updateData.vehicleModel || '',
                    number: updateData.vehicleNumber || '',
                    name: updateData.vehicleType || ''
                  },
                  rating: 4.8,
                  totalRides: 0,
                  driverId: user.uid,
                  status: 'On the way'
                },
                ...(request.isScheduled && {
                  paymentStatus: 'pending',
                  requiresPayment: true,
                  driverAssignedAt: serverTimestamp(),
                  scheduledConfirmed: true
                })
              });
              
              console.log(`✅ Updated booking document. Scheduled: ${request.isScheduled}`);
              
              // Send confirmation for scheduled rides
              if (request.isScheduled) {
                const emailSent = await sendScheduledRideConfirmation(request.bookingId, {
                  ...bookingData,
                  ...request,
                  driverName: updateData.driverName,
                  driverPhone: updateData.driverPhone,
                  vehicleType: updateData.vehicleType,
                  vehicleModel: updateData.vehicleModel,
                  vehicleNumber: updateData.vehicleNumber
                });
                
                if (emailSent) {
                  console.log('✅ Confirmation email sent for scheduled ride');
                } else {
                  console.warn('⚠️ Failed to send confirmation email for scheduled ride');
                }
              }
            }
          } catch (bookingError) {
            console.error('Error updating booking document:', bookingError);
            // Don't fail the whole operation if booking update fails
          }
        }
      }

      setRideRequests(prev => ({
        ...prev,
        [request.type]: prev[request.type].filter(req => req.id !== requestId)
      }));
      if (action === 'accept') {
        // ── Generate & email OTP to customer ────────────────────────────────
        try {
          // Resolve the correct booking document ID
          // For airport: the request itself IS the doc (requestId)
          // For outstation: the booking doc ID is stored in request.bookingId
          // For holiday: same pattern as outstation
          // For localPickup: requestId is the localRides doc ID
          const bookingDocId =
            isAirportRequest       ? requestId :
            isHolidayRequest       ? (request.bookingId || request.holidayBookingId || requestId) :
            request.type === 'localPickup' ? requestId :
            (request.bookingId || requestId); // outstation
      
          const rideTypeForOtp =
            isAirportRequest             ? 'airport'     :
            isHolidayRequest             ? 'holiday'     :
            request.type === 'localPickup' ? 'localPickup' :
            'outstation';
      
          const otpRes = await fetch(`${CLOUD_FN_BASE}/generateRideOtp`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId:     bookingDocId,
              rideType:      rideTypeForOtp,
              driverName:    userData?.fullName || userData?.displayName || 'Driver',
              driverPhone:   userData?.phone   || userData?.phoneNumber  || '',
              vehicleType:   userData?.vehicleType   || '',
              vehicleNumber: userData?.vehicleNumber || '',
            }),
          });
      
          const otpData = await otpRes.json();
          if (otpData.success) {
            console.log(`✅ OTP generated and sent to customer for ${bookingDocId}`);
          } else {
            // Non-fatal — log but don't block the accept flow
            console.warn('⚠️ OTP generation warning:', otpData.warning || otpData.error);
          }
        } catch (otpErr) {
          // Non-fatal — log but don't break the accept flow
          console.error('❌ OTP generation failed (non-fatal):', otpErr.message);
        }
        // ── End OTP generation ───────────────────────────────────────────────
      }
      let successMessage;
      if (action === 'accept') {
        successMessage = isAirportRequest 
          ? '✅ Airport transfer request accepted! Check "My Rides" tab.' 
          : isHolidayRequest
            ? '✅ Holiday package request accepted!'
            : request.isScheduled
              ? '✅ Scheduled ride accepted! Confirmation sent to customer.'
              : '✅ Ride request accepted!';
      } else {
        successMessage = '❌ Request rejected.';
      }

      toast.update(loadingToast, {
        render: successMessage,
        type: action === 'accept' ? 'success' : 'info',
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });

      if (isAudioEnabledRef.current) {
        playNotification(action === 'accept' ? 'Request accepted successfully' : 'Request rejected successfully');
      }

    } catch (error) {
      console.error(`[DriverDashboard] Error ${action}ing request:`, error);

      let errorMessage;
      if (error.code === 'not-found' || error.message.includes('not found')) {
        errorMessage = 'This request is no longer available.';
      } else if (error.message === 'PERMISSION_DENIED') {
        errorMessage = 'You do not have permission to perform this action.';
      } else {
        errorMessage = error.message || `Failed to ${action} request. Please try again.`;
      }

      toast.update(loadingToast || {}, {
        render: errorMessage,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });

      if (request) {
        setRideRequests(prev => ({
          ...prev,
          [request.type]: [...(prev[request.type] || []), request].sort(
            (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
          )
        }));
      }
    } finally {
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      setProcessingRequest(null);
    }
  };

  // Function to cancel an accepted ride
  // const handleCancelRide = async (rideId, ride) => {
  //   const loadingToast = toast.loading('Cancelling ride...');
    
  //   try {
  //     const rideRef = doc(db, 'airportTransfers', rideId);
      
  //     // Update ride status to cancelled with all details
  //     await updateDoc(rideRef, {
  //       status: 'cancelled',
  //       cancelledAt: serverTimestamp(),
  //       cancelledBy: 'driver',
  //       cancelledReason: 'Driver unavailable',
  //       cancelledDriverId: user.uid,
  //       cancelledDriverName: userData?.fullName || userData?.displayName || 'Driver',
  //       updatedAt: serverTimestamp(),
  //       driverLocation: null,
  //       driverLocationUpdatedAt: null
  //     });
      
  //     // Remove from accepted rides
  //     setAcceptedRides(prev => prev.filter(r => r.id !== rideId));
      
  //     toast.update(loadingToast, {
  //       render: '✅ Ride cancelled successfully. Customer has been notified.',
  //       type: 'success',
  //       isLoading: false,
  //       autoClose: 5000,
  //       closeButton: true
  //     });
      
  //     if (isAudioEnabledRef.current) {
  //       playNotification('Ride cancelled successfully');
  //     }
      
  //   } catch (error) {
  //     console.error('Error cancelling ride:', error);
      
  //     toast.update(loadingToast, {
  //       render: '❌ Failed to cancel ride. Please try again.',
  //       type: 'error',
  //       isLoading: false,
  //       autoClose: 5000,
  //       closeButton: true
  //     });
  //   }
  // };

  // Function to view customer location on map
  const viewCustomerLocation = (ride) => {
    if (!ride.userLocation) {
      toast.warning('Customer location is not available yet. Please wait for the customer to share their location.');
      return;
    }
    
    setRideDetails({
      ...ride,
      driverLocation: driverLocation || { lat: 0, lng: 0 }
    });
    setShowMapModal(true);
    
    console.log('📍 Viewing customer location:', {
      customerLocation: ride.userLocation,
      driverLocation: driverLocation,
      rideId: ride.id,
      customerName: getCustomerName(ride)
    });
  };

  // Function to update ride status
  // const updateRideStatus = async (rideId, status) => {
  //   try {
  //     const rideRef = doc(db, 'airportTransfers', rideId);
  //     await updateDoc(rideRef, {
  //       status: status,
  //       updatedAt: serverTimestamp(),
  //       ...(status === 'driver_arrived' && { driverArrivedAt: serverTimestamp() }),
  //       ...(status === 'in_progress' && { rideStartedAt: serverTimestamp() }),
  //       ...(status === 'completed' && { completedAt: serverTimestamp() })
  //     });
      
  //     toast.success(`Ride status updated to ${status.replace('_', ' ')}`);
  //   } catch (error) {
  //     console.error('Error updating ride status:', error);
  //     toast.error('Failed to update ride status');
  //   }
  // };

  const renderRequestCard = (req) => {
    const props = {
      request: req,
      onAccept: () => {
        setProcessingRequest({ id: req.id, action: 'accept' });
        handleRideAction('accept', req.id, req);
      },
      onReject: () => {
        setProcessingRequest({ id: req.id, action: 'reject' });
        handleRideAction('reject', req.id, req);
      },
    };

    if (req.type === 'holiday') {
      return <HolidayRideRequestCard key={req.id} {...props} />;
    } else if (req.type === 'airport') {
      const isProcessing = processingRequest?.id === req.id;
      const action = isProcessing ? processingRequest.action : null;
      return (
        <AirportTransferRequestCard
          key={req.id}
          request={req}
          onAction={(request, action) => {
            setProcessingRequest({ id: request.id, action });
            handleRideAction(action, request.id, request);
          }}
          isProcessing={isProcessing}
          action={action}
        />
      );
    } else if (req.type === 'localPickup') {
      const isProcessing = processingRequest?.id === req.id;
      const action = isProcessing ? processingRequest.action : null;
      return (
        <LocalPickupRequestCard
           key={`${req.id}-${req.createdAt?.seconds || 0}`}
          request={req}
          onAction={(ride, actionType) => {
            if (processingRequest?.id === ride.id) return; // 🚫 prevent double click

            setProcessingRequest({ id: ride.id, action: actionType });
            handleRideAction(actionType, ride.id, ride);
          }}
          isProcessing={isProcessing}
          action={action}
        />
      );
    } else {
      return <RideRequestCard key={req.id} {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700 font-medium mb-2">Loading your dashboard</p>
        <p className="text-sm text-gray-500 text-center">
          {!user ? 'Checking authentication...' : 'Loading ride requests...'}
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view ride requests.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Map Modal */}
      {showMapModal && rideDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Customer Location & Route</h2>
              <button
                onClick={() => setShowMapModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold mb-1">Customer Details</h3>
                  <p>{getCustomerName(rideDetails)}</p>
                  <p className="text-blue-600 font-medium mt-1">
                    📞 {getCustomerPhoneFromRide(rideDetails)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold mb-1">Pickup</h3>
                  <p>{getLocationText(rideDetails.pickupLocation)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h3 className="font-semibold mb-1">Dropoff</h3>
                  <p>{getLocationText(rideDetails.dropoffLocation)}</p>
                </div>
              </div>
              
              <div className="h-96 bg-gray-200 rounded-lg mb-4">
                <DriverTrackingMap 
                  driverLocation={driverLocation}
                  customerLocation={rideDetails.userLocation}
                  pickupLocation={rideDetails.pickupLocation}
                  dropoffLocation={rideDetails.dropoffLocation}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">
                    Customer Location: {rideDetails.userLocation.lat.toFixed(6)}, {rideDetails.userLocation.lng.toFixed(6)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last updated: {new Date(rideDetails.userLocation.timestamp).toLocaleTimeString()}
                  </p>
                  {rideDetails.userLocation.accuracy && (
                    <p className="text-xs text-gray-500">
                      Accuracy: ±{Math.round(rideDetails.userLocation.accuracy)} meters
                    </p>
                  )}
                </div>
                
                <div className="space-x-2">
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${rideDetails.userLocation.lat},${rideDetails.userLocation.lng}`)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
                    </svg>
                    Open in Google Maps
                  </button>
                  
                  <button
                    onClick={() => setShowMapModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <div className="text-sm text-gray-500">
            {user?.email} ({user?.uid?.substring(0, 8)}...)
            {driverLocation && (
              <span className="ml-2 text-green-600 flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                Live Location: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={isAudioEnabled}
              onChange={() => setIsAudioEnabled(!isAudioEnabled)}
              className="mr-2"
            />
            🔊 Audio Notifications
          </label>
        </div>
      </div>

      {/* Location Tracking Status */}
      {driverLocation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-green-800">📍 Location Tracking Active</h3>
              <p className="text-xs text-green-600">
                Showing requests within 3km of your location
              </p>
            </div>
            <div className="text-xs text-green-700 font-mono">
              {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => handleTabChange('all')}
        >
          All Requests ({filteredRequests.length})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'outstation' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => handleTabChange('outstation')}
        >
          Outstation ({rideRequests.outstation?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'airport' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => handleTabChange('airport')}
        >
          Airport ({rideRequests.airport?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'localPickup'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600'
          }`}
          onClick={() => handleTabChange('localPickup')}
        >
          Local Pickup ({rideRequests.localPickup?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'holiday' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => handleTabChange('holiday')}
        >
          Holiday ({rideRequests.holiday?.length || 0})
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'myrides' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-600'}`}
          onClick={() => handleTabChange('myrides')}
        >
          My Rides ({acceptedRides.length})
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'myrides' ? (
        <MyRidesTab
          acceptedRides={acceptedRides}
          driverUid={user.uid}
          driverName={userData?.fullName || userData?.displayName || 'Driver'}
          driverLocation={driverLocation}
          customerPhones={customerPhones}
          fetchingPhones={fetchingPhones}
          onFetchPhone={fetchCustomerPhone}
          onFetchAllPhones={() => {
            acceptedRides.forEach(ride => {
              if (!customerPhones[ride.id] || customerPhones[ride.id] === 'Not provided') {
                fetchCustomerPhone(ride);
              }
            });
            toast.info(`Fetching phone numbers for ${acceptedRides.length} rides...`);
          }}
          onViewMap={(ride) => {
            if (!ride.userLocation) { toast.warning('Customer location not available yet.'); return; }
            setRideDetails({ ...ride, driverLocation: driverLocation || { lat: 0, lng: 0 } });
            setShowMapModal(true);
          }}
          onRideUpdated={(rideId) => {
            setAcceptedRides(prev => prev.filter(r => r.id !== rideId));
          }}
          cities={CITIES}
        />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">
              {activeTab === 'all' ? 'All Ride Requests' : 
               activeTab === 'outstation' ? 'Outstation Ride Requests' :
               activeTab === 'airport' ? 'Airport Transfer Requests' : 'Holiday Package Requests'}
            </h2>
            
            {filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-lg">No ride requests available</p>
                <p className="text-sm">New requests will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map(renderRequestCard)}
              </div>
            )}
          </div>
          
          <InterestedRoutesSection driverId={user?.uid} cities={CITIES} />
        </div>
      )}
    </div>
  );
}