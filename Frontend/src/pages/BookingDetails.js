import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

const BookingDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (state?.bookingId) {
      console.log('🔍 Loading booking:', state.bookingId);
      setupRealTimeListener(state.bookingId);
    } else {
      toast.error('No booking ID provided');
      navigate('/user-dashboard');
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state?.bookingId, user]);

  const setupRealTimeListener = (bookingId) => {
    if (!bookingId || !user?.uid) return;
    
    console.log('🔍 Setting up listener for booking:', bookingId);
    
    try {
      // FIRST: Check airportTransfers collection (where rides are actually stored)
      const airportBookingRef = doc(db, 'airportTransfers', bookingId);
      
      const unsubscribeListener = onSnapshot(airportBookingRef, (doc) => {
        if (doc.exists()) {
          const bookingData = doc.data();
          console.log('✅ Found booking in airportTransfers:', bookingData);
          
          // Debug log to see the actual structure
          console.log('📊 Booking data structure:', JSON.stringify(bookingData, null, 2));
          
          // Find the fare amount - check multiple possible locations
          let fareAmount = 0;
          
          // Check 1: vehicleDetails.price (as string or number)
          if (bookingData.vehicleDetails?.price) {
            const price = bookingData.vehicleDetails.price;
            console.log('💰 Found price in vehicleDetails.price:', price);
            fareAmount = typeof price === 'string' ? parseInt(price, 10) : price;
          }
          // Check 2: vehiclePrice field
          else if (bookingData.vehiclePrice) {
            const price = bookingData.vehiclePrice;
            console.log('💰 Found price in vehiclePrice:', price);
            fareAmount = typeof price === 'string' ? parseInt(price, 10) : price;
          }
          // Check 3: price field
          else if (bookingData.price) {
            console.log('💰 Found price in price field:', bookingData.price);
            fareAmount = typeof bookingData.price === 'string' ? parseInt(bookingData.price, 10) : bookingData.price;
          }
          // Check 4: fareAmount field
          else if (bookingData.fareAmount) {
            console.log('💰 Found price in fareAmount field:', bookingData.fareAmount);
            fareAmount = typeof bookingData.fareAmount === 'string' ? parseInt(bookingData.fareAmount, 10) : bookingData.fareAmount;
          }
          // Check 5: totalFare field
          else if (bookingData.totalFare) {
            console.log('💰 Found price in totalFare field:', bookingData.totalFare);
            fareAmount = typeof bookingData.totalFare === 'string' ? parseInt(bookingData.totalFare, 10) : bookingData.totalFare;
          }
          
          console.log('💰 FINAL extracted fareAmount:', fareAmount);
          
          // Check vehicle type - handle both string and nested object
          let vehicleType = 'Standard';
          let vehicleName = 'Standard';
          let vehicleCapacity = 4;
          
          if (bookingData.vehicleType) {
            vehicleType = bookingData.vehicleType;
            vehicleName = bookingData.vehicleType;
          }
          
          if (bookingData.vehicleDetails) {
            if (typeof bookingData.vehicleDetails === 'object') {
              vehicleName = bookingData.vehicleDetails.name || vehicleType;
              vehicleType = bookingData.vehicleDetails.name || vehicleType;
              
              // Parse capacity if available
              if (bookingData.vehicleDetails.capacity) {
                const capacityMatch = bookingData.vehicleDetails.capacity.match(/\d+/);
                if (capacityMatch) {
                  vehicleCapacity = parseInt(capacityMatch[0], 10);
                }
              } else if (bookingData.vehicleDetails.seats) {
                vehicleCapacity = bookingData.vehicleDetails.seats;
              }
            } else if (typeof bookingData.vehicleDetails === 'string') {
              vehicleName = bookingData.vehicleDetails;
              vehicleType = bookingData.vehicleDetails;
            }
          }
          
          // Parse coordinates - handle nested location objects
          let pickupLocation = bookingData.pickup || bookingData.pickupLocation;
          let dropoffLocation = bookingData.dropoff || bookingData.dropoffLocation;
          let pickupCoords = null;
          let dropoffCoords = null;
          
          if (pickupLocation && typeof pickupLocation === 'object') {
            if (pickupLocation.lat !== undefined && pickupLocation.lng !== undefined) {
              pickupCoords = { lat: pickupLocation.lat, lng: pickupLocation.lng };
            } else if (pickupLocation.latitude !== undefined && pickupLocation.longitude !== undefined) {
              pickupCoords = { lat: pickupLocation.latitude, lng: pickupLocation.longitude };
            }
          }
          
          if (dropoffLocation && typeof dropoffLocation === 'object') {
            if (dropoffLocation.lat !== undefined && dropoffLocation.lng !== undefined) {
              dropoffCoords = { lat: dropoffLocation.lat, lng: dropoffLocation.lng };
            } else if (dropoffLocation.latitude !== undefined && dropoffLocation.longitude !== undefined) {
              dropoffCoords = { lat: dropoffLocation.latitude, lng: dropoffLocation.longitude };
            }
          }
          
          // Handle driver location
          let driverLocation = null;
          if (bookingData.driverLocation && typeof bookingData.driverLocation === 'object') {
            if (bookingData.driverLocation.lat !== undefined && bookingData.driverLocation.lng !== undefined) {
              driverLocation = { lat: bookingData.driverLocation.lat, lng: bookingData.driverLocation.lng };
            } else if (bookingData.driverLocation.latitude !== undefined && bookingData.driverLocation.longitude !== undefined) {
              driverLocation = { lat: bookingData.driverLocation.latitude, lng: bookingData.driverLocation.longitude };
            }
          }
          
          // Map the data to match your component format
          const updatedBooking = {
            id: doc.id,
            ...bookingData,
            // Map airportTransfers fields to component format
            pickup: pickupLocation?.name || pickupLocation?.address || pickupLocation || 'Pune',
            dropoff: dropoffLocation?.name || dropoffLocation?.address || dropoffLocation || 'Navi Mumbai',
            fare: fareAmount,
            fareAmount: fareAmount,
            vehicleDetails: {
              name: vehicleName,
              capacity: vehicleCapacity
            },
            vehicleModel: vehicleType,
            vehicleNumber: bookingData.vehicleNumber || bookingData.carNumber || bookingData.vehicleRegNumber,
            driverName: bookingData.driverName || 'Lokesh Patil',
            driverPhone: bookingData.driverPhone || bookingData.driverContact || '8412563269',
            driverRating: bookingData.driverRating || 4.5,
            status: bookingData.status || 'searching_driver',
            paymentStatus: bookingData.paymentStatus || 'pending',
            paymentId: bookingData.paymentId || bookingData.razorpayPaymentId || bookingData.transactionId || 'PAY_' + doc.id.substring(0, 8),
            paymentMethod: bookingData.paymentMethod || bookingData.paymentType || 'Online',
            paymentAmount: fareAmount,
            distance: bookingData.distance || bookingData.distanceKm || '15 km',
            estimatedDuration: bookingData.duration || bookingData.estimatedDuration || bookingData.travelTime || '45 mins',
            pickupCoords: pickupCoords,
            dropoffCoords: dropoffCoords,
            driverLocation: driverLocation,
            liveTracking: bookingData.liveTracking,
            cancelledReason: bookingData.cancelledReason || bookingData.cancelReason,
            cancelledDescription: bookingData.cancelledDescription || bookingData.cancelDescription,
            cancelledByType: bookingData.cancelledBy || bookingData.cancelledByType || bookingData.cancelBy,
            cancelledAt: bookingData.cancelledAt || bookingData.cancelAt,
            refundRequested: bookingData.refundRequested,
            refundStatus: bookingData.refundStatus,
            refundAccount: bookingData.refundAccount,
            refundPhone: bookingData.refundPhone,
            createdAt: bookingData.createdAt || bookingData.bookedAt || bookingData.bookingTime || new Date(),
            updatedAt: bookingData.updatedAt || bookingData.modifiedAt || new Date(),
            isActive: bookingData.status && !['cancelled', 'completed'].includes(bookingData.status?.toLowerCase())
          };
          
          console.log('🎯 FINAL booking object:', updatedBooking);
          
          setBooking(updatedBooking);
          setLoading(false);
          
          // Show status change notifications
          if (booking && booking.status !== updatedBooking.status) {
            const statusMessages = {
              'searching_driver': '🔍 Searching for a driver...',
              'accepted': '✅ Driver assigned to your ride!',
              'driver_arrived': '🚗 Driver has arrived',
              'in_progress': '🏁 Ride in progress',
              'completed': '🎉 Ride completed',
              'cancelled': '❌ Ride cancelled'
            };
            
            if (statusMessages[updatedBooking.status]) {
              toast.info(statusMessages[updatedBooking.status]);
            }
          }
          
        } else {
          // If not found in airportTransfers, try user's personal collection
          console.log('🔍 Not found in airportTransfers, checking user collection...');
          setupUserCollectionListener(bookingId);
        }
      }, (error) => {
        console.error('❌ Airport transfers listener error:', error);
        // Try user collection as fallback
        setupUserCollectionListener(bookingId);
      });
      
      setUnsubscribe(() => unsubscribeListener);
      
    } catch (error) {
      console.error('❌ Error setting up airport transfers listener:', error);
      setupUserCollectionListener(bookingId);
    }
  };

  const setupUserCollectionListener = (bookingId) => {
    console.log('🔍 Checking user collection...');
    
    try {
      const userBookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
      
      const unsubscribeListener = onSnapshot(userBookingRef, (doc) => {
        if (doc.exists()) {
          const bookingData = doc.data();
          console.log('✅ Found booking in user collection:', bookingData);
          
          // Parse fare from user collection
          let fareAmount = 0;
          if (bookingData.fareAmount !== undefined && bookingData.fareAmount !== null) {
            fareAmount = bookingData.fareAmount;
          } else if (bookingData.totalFare !== undefined && bookingData.totalFare !== null) {
            fareAmount = bookingData.totalFare;
          } else if (bookingData.fare !== undefined && bookingData.fare !== null) {
            fareAmount = bookingData.fare;
          } else if (bookingData.vehicleDetails?.price) {
            const price = bookingData.vehicleDetails.price;
            fareAmount = typeof price === 'string' ? parseInt(price, 10) : price;
          }
          
          const updatedBooking = {
            id: doc.id,
            ...bookingData,
            fare: fareAmount,
            fareAmount: fareAmount,
            paymentAmount: fareAmount,
            isActive: bookingData.isActive !== undefined ? bookingData.isActive : !['cancelled', 'completed'].includes(bookingData.status)
          };
          
          setBooking(updatedBooking);
          setLoading(false);
          
        } else {
          console.log('❌ Booking not found in any collection');
          toast.error('Booking not found');
          navigate('/user-dashboard');
        }
      }, (error) => {
        console.error('❌ User collection listener error:', error);
        toast.error('Failed to load booking');
        setLoading(false);
      });
      
      setUnsubscribe(() => unsubscribeListener);
      
    } catch (error) {
      console.error('❌ Error setting up user collection listener:', error);
      toast.error('Connection error');
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], {
        weekday: 'short',
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
    if (!location) return 'N/A';
    
    // If it's a string, return it
    if (typeof location === 'string') return location;
    
    // If it's an object with name or address
    if (location.name) return location.name;
    if (location.address) return location.address;
    
    // If it's coordinates object
    if (location.lat !== undefined && location.lng !== undefined) {
      // Format coordinates nicely
      return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    
    // If it's a Firestore GeoPoint
    if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    }
    
    return 'Location specified';
  };

  const formatCoordinates = (coords) => {
    if (!coords) return 'N/A';
    
    try {
      // If it's a string
      if (typeof coords === 'string') return coords;
      
      // If it's an object with lat/lng
      if (coords.lat !== undefined && coords.lng !== undefined) {
        const lat = coords.lat;
        const lng = coords.lng;
        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
        }
        return `${lat}, ${lng}`;
      }
      
      // If it's a Firestore GeoPoint
      if (coords.latitude !== undefined && coords.longitude !== undefined) {
        const lat = coords.latitude;
        const lng = coords.longitude;
        if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
          return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
        }
        return `${lat}, ${lng}`;
      }
      
      return 'N/A';
    } catch (error) {
      console.error('Error formatting coordinates:', error, coords);
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'driver_arrived': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'searching_driver': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Unknown';
    
    switch (status.toLowerCase()) {
      case 'completed': return '✅ Completed';
      case 'cancelled': return '❌ Cancelled';
      case 'accepted': return '✅ Driver Assigned';
      case 'in_progress': return '🏁 Ride in Progress';
      case 'driver_arrived': return '🚗 Driver Arrived';
      case 'pending': return '⏳ Pending';
      case 'searching_driver': return '🔍 Searching Driver';
      default: return status.replace(/_/g, ' ').toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading booking details...</p>
          <p className="text-gray-500 text-sm">Checking airport transfers database</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist</p>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center">
              <h1 className="text-lg font-bold text-gray-900">Booking Details</h1>
              {booking.status && !['cancelled', 'completed'].includes(booking.status.toLowerCase()) && (
                <div className="ml-2 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  <span className="text-xs text-green-600">Live</span>
                </div>
              )}
            </div>
            <div className="w-10"></div>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              ✈️ Airport Transfer
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Real-time Status Banner */}
        {booking.status && !['cancelled', 'completed'].includes(booking.status.toLowerCase()) && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                <div>
                  <h3 className="font-bold">Live Updates Active</h3>
                  <p className="text-sm opacity-90">This ride is being updated in real-time</p>
                </div>
              </div>
              {booking.updatedAt && (
                <div className="text-right">
                  <p className="text-xs opacity-75">Last updated:</p>
                  <p className="text-sm font-semibold">{formatDate(booking.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Booking #{booking.id.substring(0, 8)}</h2>
              <p className="text-sm text-gray-500">{formatDate(booking.createdAt)}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusText(booking.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Booking ID</p>
              <p className="font-medium text-xs truncate">{booking.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className={`font-medium ${
                booking.paymentStatus === 'paid' ? 'text-green-600' : 
                booking.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {booking.paymentStatus?.toUpperCase() || 'PENDING'}
              </p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-900 mb-3">Trip Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-medium">₹{booking.fare || booking.fareAmount || '0'}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-lg text-gray-900">₹{booking.fare || booking.fareAmount || booking.paymentAmount || '0'}</span>
              </div>
            </div>
            {/* Debug info - remove in production */}
            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <p className="font-semibold text-yellow-800">Debug Info:</p>
              <p>fare: {booking.fare || 'null'}</p>
              <p>fareAmount: {booking.fareAmount || 'null'}</p>
              <p>paymentAmount: {booking.paymentAmount || 'null'}</p>
              <p>vehicleDetails.price: {booking.vehicleDetails?.price || 'null'}</p>
              <p>vehiclePrice: {booking.vehiclePrice || 'null'}</p>
              <p>price: {booking.price || 'null'}</p>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Route Information</h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Pickup Location</p>
                <p className="font-medium">{formatAddress(booking.pickup)}</p>
                {booking.pickupCoords && (
                  <p className="text-xs text-gray-400 mt-1">
                    Coordinates: {formatCoordinates(booking.pickupCoords)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-3 h-3 bg-red-500 rounded-full mt-2 mr-3"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Dropoff Location</p>
                <p className="font-medium">{formatAddress(booking.dropoff)}</p>
                {booking.dropoffCoords && (
                  <p className="text-xs text-gray-400 mt-1">
                    Coordinates: {formatCoordinates(booking.dropoffCoords)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
            <div>
              <p className="text-sm text-gray-500 mb-1">Distance</p>
              <p className="font-medium">{booking.distance || '15 km'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Estimated Duration</p>
              <p className="font-medium">{booking.estimatedDuration || '45 mins'}</p>
            </div>
          </div>
        </div>

        {/* Vehicle & Driver Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Vehicle & Driver Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Vehicle Information</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-medium">{booking.vehicleDetails?.name || booking.vehicleModel || 'Standard'}</p>
                </div>
                {booking.vehicleModel && (
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="font-medium">{booking.vehicleModel}</p>
                  </div>
                )}
                {booking.vehicleNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Number</p>
                    <p className="font-medium">{booking.vehicleNumber}</p>
                  </div>
                )}
                {booking.vehicleDetails?.capacity && (
                  <div>
                    <p className="text-sm text-gray-500">Capacity</p>
                    <p className="font-medium">{booking.vehicleDetails.capacity} seats</p>
                  </div>
                )}
              </div>
            </div>

            {booking.driverName && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Driver Information</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Driver Name</p>
                    <p className="font-medium">{booking.driverName}</p>
                  </div>
                  {booking.driverPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Contact Number</p>
                      <a href={`tel:${booking.driverPhone}`} className="font-medium text-blue-600 hover:underline">
                        {booking.driverPhone}
                      </a>
                    </div>
                  )}
                  {booking.driverRating && (
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="font-medium flex items-center">
                        <span className="text-yellow-500 mr-1">⭐</span> {booking.driverRating}
                      </p>
                    </div>
                  )}
                  {booking.driverLocation && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Current Location</p>
                      <p className="font-medium text-xs">
                        {formatCoordinates(booking.driverLocation)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Tracking */}
        {booking.liveTracking && booking.status && !['cancelled', 'completed'].includes(booking.status.toLowerCase()) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-blue-900 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2"></div>
                Live Tracking
              </h3>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                Real-time
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Driver Location</p>
                  <p className="font-medium text-sm">
                    {booking.liveTracking.driverLocation ? 
                      formatCoordinates(booking.liveTracking.driverLocation) : 
                      formatCoordinates(booking.driverLocation)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Your Location</p>
                  <p className="font-medium text-sm">
                    {booking.liveTracking.customerLocation ? 
                      formatCoordinates(booking.liveTracking.customerLocation) : 
                      'N/A'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Distance</p>
                  <p className="font-medium">{booking.liveTracking.distance || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">ETA</p>
                  <p className="font-medium">{booking.liveTracking.eta || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-blue-700">Last Updated</p>
                <p className="font-medium">
                  {booking.liveTracking.timestamp ? 
                    formatDate(booking.liveTracking.timestamp) : 
                    (booking.liveTracking.updatedAt ? 
                      formatDate(booking.liveTracking.updatedAt) : 
                      'N/A')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">Payment Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment ID</span>
              <span className="font-medium">{booking.paymentId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">{booking.paymentMethod || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-medium">₹{booking.paymentAmount || booking.fare || booking.fareAmount || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Date</span>
              <span className="font-medium">{formatDate(booking.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Cancellation Details */}
        {booking.status?.toLowerCase() === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="font-bold text-red-900 mb-4">Cancellation Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-red-700 mb-1">Reason for Cancellation</p>
                <p className="font-medium text-red-900">{booking.cancelledReason || 'Not specified'}</p>
              </div>
              {booking.cancelledDescription && (
                <div>
                  <p className="text-sm text-red-700 mb-1">Additional Details</p>
                  <p className="text-red-900">{booking.cancelledDescription}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-red-700 mb-1">Cancelled By</p>
                <p className="font-medium text-red-900">
                  {booking.cancelledByType === 'customer' ? 'You' : 'Driver'}
                  {booking.cancelledAt && ` on ${formatDate(booking.cancelledAt)}`}
                </p>
              </div>
              {booking.refundRequested && (
                <div className="bg-white p-4 rounded-lg border border-red-300">
                  <h4 className="font-bold text-red-900 mb-2">Refund Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Status</span>
                      <span className={`font-medium ${
                        booking.refundStatus === 'approved' ? 'text-green-600' :
                        booking.refundStatus === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {booking.refundStatus?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Refund Account</span>
                      <span className="font-medium">{booking.refundAccount || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Contact for Refund</span>
                      <span className="font-medium">{booking.refundPhone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/user-dashboard')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>
          
          {booking.status?.toLowerCase() === 'accepted' && booking.isActive && (
            <button
              onClick={() => navigate('/track-ride', { state: { bookingId: booking.id } })}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
            >
              Track Ride
            </button>
          )}
          
          {booking.status?.toLowerCase() === 'completed' && (
            <button
              onClick={() => navigate('/local-pickup', {
                state: {
                  pickup: booking.pickup,
                  dropoff: booking.dropoff,
                  vehicleDetails: booking.vehicleDetails
                }
              })}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium"
            >
              Book Same Route
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;