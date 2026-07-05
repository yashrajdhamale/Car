import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { 
  FaUser, FaCarAlt, FaMapMarkerAlt, FaCheckCircle, FaInfoCircle, FaPhone, FaEnvelope, FaRupeeSign, FaSync 
} from 'react-icons/fa';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: bookingId } = useParams();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(true);
  const [packageDetails, setPackageDetails] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, completed, failed

  useEffect(() => {
    const fetchBookingAndDriverDetails = async () => {
      if (!bookingId) {
        console.log('No booking ID provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching booking with ID:', bookingId);
        const bookingRes = await fetch(`${API_BASE}/api/holiday-bookings/${bookingId}`);
        if (!bookingRes.ok) {
          throw new Error('Booking not found');
        }
        const bookingPayload = await bookingRes.json();
        let bookingData = bookingPayload.booking;
        
        setBooking(bookingData);

        // Log all possible driver-related fields
        const driverFields = [
          'driverInfo', 'driver', 'driverData', 'assignedDriver', 
          'driver_info', 'assigned_driver', 'driverDetails', 'driverId'
        ];
        
        console.log('Checking for driver data in booking object:');
        driverFields.forEach(field => {
          if (bookingData[field]) {
            console.log(`Found driver data in '${field}':`, bookingData[field]);
          }
        });
        
        // Log the complete booking status
        console.log('Booking status:', bookingData.status);
        
        // Set payment status based on booking status
        if (['payment_pending', 'driver_assigned', 'accepted'].includes(bookingData.status)) {
          console.log('Setting payment status to: pending');
          setPaymentStatus('pending');
        } else if (bookingData.status === 'paid') {
          console.log('Setting payment status to: success');
          setPaymentStatus('success');
        } else if (bookingData.status === 'cancelled') {
          console.log('Setting payment status to: cancelled');
          setPaymentStatus('cancelled');
        }
        
        // Fetch package details if not already loaded
        if (bookingData.packageId && !packageDetails) {
          console.log('Fetching package details for ID:', bookingData.packageId);
          setPackageDetails(bookingData.package || null);
        }

        // Set payment status
        if (bookingData.status === 'driver_assigned' && bookingData.driverInfo) {
          console.log('Driver assigned:', bookingData.driverInfo);
        } else if (bookingData.status === 'payment_pending') {
          setPaymentStatus('processing');
        }

      } catch (error) {
        console.error('Error fetching booking details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingAndDriverDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Loading Your Booking Details</h2>
          <p className="text-gray-600 mt-2">Please wait while we prepare your payment information...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <div className="flex items-start">
              <FaInfoCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Booking Not Found</p>
                <p className="text-sm">We couldn't find the requested booking. It may have been cancelled or already completed.</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return format(date, 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const calculateTotal = () => {
    try {
      if (!packageDetails || packageDetails.price === undefined || packageDetails.price === null) {
        return 0;
      }
      
      // Handle case where price might be a string with currency symbol
      let price = packageDetails.price;
      if (typeof price === 'string') {
        // Remove any non-numeric characters except decimal point
        price = price.replace(/[^0-9.]/g, '');
      }
      
      const basePrice = parseFloat(price);
      
      if (isNaN(basePrice)) {
        console.error('Invalid price value:', packageDetails.price);
        return 0;
      }
      
      const tax = basePrice * 0.18; // 18% GST
      const total = basePrice + tax;
      
      // Format to 2 decimal places without rounding issues
      return parseFloat(total.toFixed(2));
    } catch (error) {
      console.error('Error calculating total:', error);
      return 0;
    }
  };

  const handlePayment = async () => {
    if (!bookingId) return;
    
    setPaymentStatus('processing');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetch(`${API_BASE}/api/holiday-bookings/${bookingId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: `PAY_${Date.now()}` })
      });
      
      setPaymentStatus('completed');
      
      setTimeout(() => {
        navigate(`/booking/${bookingId}`, { 
          state: { booking: { ...booking, status: 'payment_completed' } } 
        });
      }, 2000);
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
    }
  };

  // Log the current booking state for debugging
  console.log('Current booking state:', booking);

  // Check all possible locations for driver info in the booking object
  const findDriverInfo = (booking) => {
    if (!booking) return null;
    
    // Check direct properties first
    if (booking.driverInfo) return booking.driverInfo;
    if (booking.driver) return booking.driver;
    if (booking.assignedDriver) return booking.assignedDriver;
    
    // Check nested properties
    if (booking.driverData?.driver) return booking.driverData.driver;
    if (booking.driverData?.driverInfo) return booking.driverData.driverInfo;
    
    // If we have driverId but no driverInfo, try to fetch it
    if (booking.driverId) {
      console.log('Found driverId, attempting to fetch driver info');
      fetch(`${API_BASE}/api/airport-bookings/${booking.driverId}`)
        .catch(() => null);
    }
    
    return null;
  };

  const driverInfo = findDriverInfo(booking) || {};
  console.log('Driver info from booking:', driverInfo);

  // Extract driver details with comprehensive fallbacks
  const driverName = driverInfo?.name || 
                    driverInfo?.displayName || 
                    driverInfo?.fullName ||
                    (driverInfo?.firstName ? 
                      `${driverInfo.firstName} ${driverInfo.lastName || ''}`.trim() : 
                      'Driver');
                      
  const driverPhone = driverInfo?.phoneNumber || 
                     driverInfo?.phone || 
                     driverInfo?.contactNumber || 
                     'Not available';
                     
  // Use a base64-encoded transparent pixel as fallback
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  const driverPhoto = driverInfo?.photoURL || 
                     driverInfo?.photo || 
                     driverInfo?.profilePicture || 
                     'https://ui-avatars.com/api/?name=' + encodeURIComponent(driverName) + '&background=random';
                     
  const driverRating = driverInfo?.rating || '5.0';

  // Extract vehicle info with comprehensive fallbacks
  const vehicleInfo = {
    make: driverInfo?.vehicle?.make || 
         driverInfo?.carDetails?.make || 
         driverInfo?.car?.make || 
         'Car',
          
    model: driverInfo?.vehicle?.model || 
          driverInfo?.carDetails?.model || 
          driverInfo?.car?.model || 
          'Model',
          
    color: driverInfo?.vehicle?.color || 
          driverInfo?.carDetails?.color || 
          driverInfo?.car?.color || 
          'Color',
          
    number: driverInfo?.vehicle?.number || 
           driverInfo?.carDetails?.number || 
           driverInfo?.car?.number || 
           driverInfo?.vehicleNumber || 
           'DL 01 AB 1234',
    
    // Include all possible vehicle properties
    ...(driverInfo?.vehicle || {}),
    ...(driverInfo?.carDetails || {}),
    ...(driverInfo?.car || {})
  };

  // Check if driver is assigned based on status and driver info
  const isDriverAssigned = (
    booking?.status === 'driver_assigned' || 
    booking?.status === 'payment_pending' ||
    booking?.status === 'accepted' ||
    booking?.status === 'driver_accepted' ||
    booking?.status === 'confirmed' ||
    (booking?.driverId && booking?.status !== 'cancelled') ||
    (driverInfo && Object.keys(driverInfo).length > 0)
  );
  
  // If we have a driverId but no driverInfo, try to fetch it
  useEffect(() => {
    if (booking?.driverId && (!driverInfo || Object.keys(driverInfo).length === 0)) {
      console.log('Driver ID found but no driver info, attempting to fetch...');
      fetch(`${API_BASE}/api/airport-bookings/${booking.driverId}`).catch(() => null);
    }
  }, [booking?.driverId, driverInfo]);

  console.log('Driver assignment status:', {
    isDriverAssigned,
    bookingStatus: booking?.status,
    hasDriverInfo: !!driverInfo && Object.keys(driverInfo).length > 0,
    driverInfoKeys: driverInfo ? Object.keys(driverInfo) : [],
    bookingKeys: booking ? Object.keys(booking) : []
  });

  // Set payment pending status
  const isPaymentPending = booking?.status === 'payment_pending';

  const refreshBooking = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/holiday-bookings/${bookingId}`);
      if (response.ok) {
        const payload = await response.json();
        setBooking(payload.booking);
      }
    } catch (error) {
      console.error('Error refreshing booking:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 sm:flex sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
              <div className="flex items-center mt-1">
                <p className="text-gray-600">Booking ID: {booking.id}</p>
                <button 
                  onClick={refreshBooking}
                  className="ml-3 text-blue-600 hover:text-blue-800 flex items-center text-sm"
                  disabled={loading}
                >
                  <FaSync className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              isDriverAssigned 
                ? 'bg-green-100 text-green-800' 
                : isPaymentPending 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-blue-100 text-blue-800'
            }`}>
              {isDriverAssigned ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                  Driver Assigned
                </>
              ) : isPaymentPending ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                  Payment Pending
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                  {booking.status || 'Processing'}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Driver & Package */}
          <div className="lg:col-span-2 space-y-6">
            {/* Driver Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <FaUser className="mr-2 text-blue-500" />
                Driver & Vehicle Details
              </h2>
              
              {isDriverAssigned ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={driverPhoto} 
                      alt={driverName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        // Fallback to initial with name if available
                        if (driverName) {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driverName)}&background=random`;
                        } else {
                          // If no name, use the transparent pixel
                          e.target.src = transparentPixel;
                        }
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {driverName}
                        <span className="ml-2 text-blue-500">
                          <FaCheckCircle className="inline" />
                        </span>
                      </h3>
                      <div className="flex items-center text-yellow-500">
                        <span className="font-bold">{driverRating}</span>
                        <span className="ml-1">★</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center">
                      <FaPhone className="text-blue-500 mr-2" />
                      <a href={`tel:${driverPhone}`} className="hover:underline">
                        {driverPhone}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <FaCarAlt className="text-blue-500 mr-2" />
                      <span className="capitalize">
                        {vehicleInfo.make} {vehicleInfo.model} • {vehicleInfo.color} • {vehicleInfo.number}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <p className="mt-4 text-gray-600">
                    {isDriverAssigned ? 'Loading driver information...' : 'Waiting for driver assignment'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isDriverAssigned ? 'Please wait while we load driver details...' : "We're finding the best driver for your trip. This page will update automatically."}
                  </p>
                </div>
              )}
            </div>

            {/* Package Card */}
            {packageDetails && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5">
                  <h2 className="text-xl font-semibold flex items-center">
                    <FaCarAlt className="mr-3" /> Package Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {packageDetails.image && (
                      <div className="w-full md:w-1/3 h-48 overflow-hidden rounded-lg">
                        <img 
                          src={packageDetails.image} 
                          alt={packageDetails.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900">{packageDetails.title || 'Package Name'}</h3>
                      
                      <div className="mt-4 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Overview</h4>
                          <p className="text-gray-700 mt-1">{packageDetails.description}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="text-purple-600 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-500">Destination</p>
                                <p className="font-medium">{packageDetails.destination || packageDetails.location || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {packageDetails.duration && (
                              <div className="flex items-center">
                                <FaClock className="text-purple-600 mr-2 flex-shrink-0" />
                                <div>
                                  <p className="text-sm text-gray-500">Duration</p>
                                  <p className="font-medium">{packageDetails.duration}</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <FaRupeeSign className="text-purple-600 mr-2 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-500">Price</p>
                                <p className="font-medium">
                                  ₹{packageDetails.price?.toLocaleString('en-IN') || '0'}
                                  {packageDetails.priceType && (
                                    <span className="text-sm text-gray-500 ml-1">
                                      ({packageDetails.priceType === 'per_person' ? 'per person' : packageDetails.priceType})
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            {packageDetails.included && packageDetails.included.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-1">Includes:</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                  {packageDetails.included.slice(0, 3).map((item, index) => (
                                    <li key={index} className="flex items-start">
                                      <FaCheckCircle className="text-green-500 mt-0.5 mr-2 flex-shrink-0" size={14} />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                  {packageDetails.included.length > 3 && (
                                    <li className="text-blue-600 text-sm">+{packageDetails.included.length - 3} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FaRupeeSign className="mr-2" /> Payment
              </h2>
              <div className="text-gray-700 mb-4">
                <p>Total Amount: <span className="font-bold text-gray-900">{calculateTotal()}</span></p>
                <p>GST (18% included)</p>
              </div>
              <button
                onClick={handlePayment}
                disabled={paymentStatus === 'processing' || paymentStatus === 'completed'}
                className={`w-full py-3 rounded-md font-medium text-white transition-colors ${
                  paymentStatus === 'completed'
                    ? 'bg-green-600 cursor-not-allowed'
                    : paymentStatus === 'processing'
                      ? 'bg-yellow-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {paymentStatus === 'processing' ? 'Processing...' : paymentStatus === 'completed' ? 'Payment Completed' : 'Pay Now'}
              </button>

              {paymentStatus === 'failed' && (
                <p className="text-red-600 mt-2 text-sm">Payment failed. Please try again.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
