import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OutstationBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [bookingStatus, setBookingStatus] = useState('searching');
  const [error, setError] = useState(null);
  const bookingDataRef = useRef(null);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const auth = getAuth();

  // Check authentication state and setup booking listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        // If we have a booking ID in the URL, fetch the booking
        const params = new URLSearchParams(location.search);
        const bookingId = params.get('id');
        
        console.log('Auth state changed, user:', user);
        console.log('Booking ID from URL:', bookingId);
        
        if (bookingId) {
          setCurrentBookingId(bookingId);
          const unsubscribeBooking = setupBookingListener(bookingId);
          
          // Also fetch the booking data immediately
          const fetchBooking = async () => {
            try {
              const bookingRef = doc(db, 'bookings', bookingId);
              const bookingSnap = await getDoc(bookingRef);
              
              if (bookingSnap.exists()) {
                const bookingData = { id: bookingSnap.id, ...bookingSnap.data() };
                console.log('Fetched booking data:', bookingData);
                
                setBooking(bookingData);
                setBookingStatus(bookingData.status || 'pending');
                
                if (bookingData.assignedDriver) {
                  console.log('Found assigned driver in initial fetch:', bookingData.assignedDriver);
                  setDriverInfo({
                    ...bookingData.assignedDriver,
                    vehicle: formatVehicleInfo(bookingData.assignedDriver.vehicle || {})
                  });
                }
              } else {
                console.error('No such booking document!');
                setError('Booking not found');
                setBookingStatus('error');
              }
            } catch (error) {
              console.error('Error fetching booking:', error);
              setError('Error loading booking details');
              setBookingStatus('error');
            } finally {
              setLoading(false);
            }
          };
          
          fetchBooking();
          
          return () => {
            if (unsubscribeBooking) unsubscribeBooking();
          };
        } else {
          setLoading(false);
          setError('No booking ID provided');
          setBookingStatus('error');
        }
      } else {
        // Redirect to login if not authenticated
        console.log('User not authenticated, redirecting to login');
        navigate('/login', { 
          state: { 
            from: `${location.pathname}${location.search}`,
            message: 'Please log in to view your booking' 
          } 
        });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [location, navigate]);

  // Set up real-time listener for booking updates
  const setupBookingListener = (bookingId) => {
    console.log('🚀 [OutstationBooking] Setting up listener for booking:', bookingId);
    
    const bookingRef = doc(db, 'bookings', bookingId);
    
    // First, get the current booking data immediately
    getDoc(bookingRef).then(docSnap => {
      if (docSnap.exists()) {
        const bookingData = { id: docSnap.id, ...docSnap.data() };
        console.log('📋 [OutstationBooking] Initial booking data:', {
          ...bookingData,
          assignedDriver: bookingData.assignedDriver ? '[...driver data]' : null
        });
        
        // Update booking status
        const status = bookingData.status || 'pending';
        setBookingStatus(status);
        
        // If driver is assigned, update driver info
        if (bookingData.assignedDriver || bookingData.driverName) {
          const driverData = bookingData.assignedDriver || {
            name: bookingData.driverName,
            phone: bookingData.driverPhone,
            email: bookingData.driverEmail,
            vehicle: {
              type: bookingData.vehicleType || '',
              number: bookingData.vehicleNumber || ''
            },
            driverId: bookingData.driverId,
            status: 'On the way'
          };
          const driverInfo = {
            ...driverData,
            vehicle: formatVehicleInfo(driverData.vehicle || {})
          };
          setDriverInfo(driverInfo);
        }
      }
    }).catch(error => {
      console.error('❌ [OutstationBooking] Error getting initial booking:', error);
      setError('Error loading booking details');
      setBookingStatus('error');
    });
    
    // Then set up the real-time listener
    return onSnapshot(bookingRef, 
      async (docSnap) => {
        console.log('📡 [OutstationBooking] Received booking update:', docSnap.exists() ? 'Document exists' : 'Document does not exist');
        
        if (!docSnap.exists()) {
          console.error('❌ [OutstationBooking] No such document!');
          setError('Booking not found');
          setBookingStatus('error');
          return;
        }
        
        const bookingData = { id: docSnap.id, ...docSnap.data() };
        console.log('📋 [OutstationBooking] Booking data updated:', {
          ...bookingData,
          assignedDriver: bookingData.assignedDriver ? '[...driver data]' : null
        });
        
        // Update booking status
        const status = bookingData.status || 'pending';
        console.log('🔄 [OutstationBooking] Updating status to:', status);
        setBookingStatus(status);
        
        // If driver is assigned, update driver info
        if (bookingData.assignedDriver) {
          console.log('👤 [OutstationBooking] Assigned driver found in update');
          const driverInfo = {
            ...bookingData.assignedDriver,
            vehicle: formatVehicleInfo(bookingData.assignedDriver.vehicle || {})
          };
          console.log('🎨 [OutstationBooking] Formatted driver info:', driverInfo);
          setDriverInfo(driverInfo);
          
          // If this is the first time we're seeing this driver assignment
          if (status === 'driver_assigned' && !bookingData.notifiedCustomer) {
            try {
              // Mark as notified to prevent duplicate notifications
              await updateDoc(bookingRef, {
                notifiedCustomer: true,
                updatedAt: serverTimestamp()
              });
              
              // Show notification to user
              toast.success(`Your driver ${driverInfo.name} is on the way!`, {
                position: 'top-center',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
              });
            } catch (error) {
              console.error('Error updating notification status:', error);
            }
          }
        } else {
          console.log('No assigned driver found in booking data');
          setDriverInfo(null);
        }
        
        // Update booking data
        bookingDataRef.current = bookingData;
        setBooking(bookingData);
      },
      (error) => {
        console.error('Error listening to booking updates:', error);
        setError('Failed to load booking details');
        setBookingStatus('error');
      }
    );
  };

  // Format vehicle info for display with better error handling
  const formatVehicleInfo = (vehicle) => {
    try {
      if (!vehicle) return 'Not specified';
      
      // If vehicle is a string, return it as is
      if (typeof vehicle === 'string') return vehicle;
      
      // Handle vehicle object
      const parts = [];
      
      // Check for different possible field names
      if (vehicle.type) parts.push(vehicle.type);
      if (vehicle.model) parts.push(vehicle.model);
      if (vehicle.number) parts.push(`(${vehicle.number})`);
      
      // If we have a name but no type/model, use the name
      if (parts.length === 0 && vehicle.name) {
        return vehicle.name;
      }
      
      return parts.length > 0 ? parts.join(' ') : 'Vehicle details not available';
    } catch (error) {
      console.error('Error formatting vehicle info:', error);
      return 'Vehicle details available';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Booking</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render booking status
  // if (loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //     </div>
  //   );
  // }

  // if (error) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center p-4">
  //       <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
  //         <div className="text-red-500 text-5xl mb-4">⚠️</div>
  //         <h2 className="text-2xl font-bold mb-4">Error</h2>
  //         <p className="text-gray-600 mb-6">{error}</p>
  //         <button
  //           onClick={() => window.location.reload()}
  //           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Try Again
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          {/* Booking Header */}
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {bookingStatus === 'driver_assigned' ? 'Your Driver is On the Way!' : 'Booking Status'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {bookingStatus === 'driver_assigned' 
                ? 'Your driver is on the way to your pickup location.'
                : `Status: ${(bookingStatus || 'loading').replace(/_/g, ' ')}`}
            </p>
          </div>

          {/* Booking Details */}
          <div className="px-6 py-6">
            {booking && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Trip Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">From:</p>
                      <p className="text-gray-700">{booking.pickupSublocality || booking.pickupCity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">To:</p>
                      <p className="text-gray-700">{booking.destinationSublocality || booking.destinationCity}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="font-medium">Date & Time:</p>
                    <p className="text-gray-700">
                      {new Date(booking.createdAt?.toDate() || new Date()).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium">Distance:</p>
                    <p className="text-gray-700">{booking.distance ? `${booking.distance.toFixed(1)} km` : 'N/A'}</p>
                  </div>
                  <div className="mt-2">
                    <p className="font-medium">Total Price:</p>
                    <p className="text-lg font-semibold text-green-600">
                      ₹{booking.price ? booking.price.toFixed(2) : '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Information */}
            {driverInfo && (bookingStatus === 'driver_assigned' || bookingStatus === 'accepted') && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {bookingStatus === 'driver_assigned' ? 'Your Driver is On the Way' : 'Driver Assigned'}
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg flex items-start border border-blue-100">
                  <div className="flex-shrink-0 relative">
                    <div className="relative">
                      {driverInfo.photoURL ? (
                        <img 
                          className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-sm" 
                          src={driverInfo.photoURL} 
                          alt={driverInfo.name || 'Driver'}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            const fallback = e.target.parentNode.querySelector('.driver-avatar-fallback');
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`driver-avatar-fallback h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ${driverInfo.photoURL ? 'hidden' : ''}`}>
                        <span className="text-2xl font-semibold text-blue-600">
                          {driverInfo.name ? driverInfo.name.charAt(0).toUpperCase() : 'D'}
                        </span>
                      </div>
                      {bookingStatus === 'driver_assigned' && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">{driverInfo.name || 'Driver'}</h4>
                        <div className="flex items-center mt-1">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star}>
                                {star <= Math.floor(driverInfo.rating || 5) ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {driverInfo.rating ? driverInfo.rating.toFixed(1) : '5.0'}
                            <span className="text-gray-500 ml-1">({driverInfo.totalRides || 0} rides)</span>
                          </span>
                        </div>
                      </div>
                      {driverInfo.phone && (
                        <a 
                          href={`tel:${driverInfo.phone}`}
                          className="ml-2 p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 text-blue-600 hover:text-blue-700"
                          title="Call driver"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                          <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10v-4.5a1.5 1.5 0 011.5-1.5H15V5a1 1 0 00-1-1h-1.05a2.5 2.5 0 01-4.9 0H3z" />
                        </svg>
                        <span className="text-gray-700">
                          {formatVehicleInfo(driverInfo.vehicle)}
                        </span>
                      </div>
                      
                      {driverInfo.phone && (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <a 
                            href={`tel:${driverInfo.phone}`} 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {driverInfo.phone}
                          </a>
                        </div>
                      )}
                      
                      {driverInfo.status && (
                        <div className="flex items-center">
                          <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-700 font-medium">{driverInfo.status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Message */}
            {!driverInfo && bookingStatus === 'searching_driver' && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Looking for a driver</h3>
                <p className="text-gray-600">We're finding the best driver for your trip...</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 text-right">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Home
            </button>
            {driverInfo?.phone && (
              <a
                href={`tel:${driverInfo.phone}`}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Call Driver
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutstationBooking;
