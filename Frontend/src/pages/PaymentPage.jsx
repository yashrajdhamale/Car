import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import QrPayment from "../assets/images/Qrpayment.jpg";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const apiRequest = async (path, { method = 'GET', body } = {}, user) => {
  const idToken = user?.getIdToken ? await user.getIdToken() : null;
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }
  return data;
};

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const bookingId = state?.bookingId;
  const details = state?.bookingDetails || {};
  
  const { pickup, dropoff, travelDate, hour, minute, adults, children, vehicleDetails } = details;

  const [isLoading, setIsLoading] = useState(false);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCancellation, setAcceptedCancellation] = useState(false);

  if (!pickup || !dropoff || !vehicleDetails) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-orange-600">No booking details found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handlePaymentConfirm = async () => {
    if (!user) {
      alert("You must be logged in to complete payment.");
      return;
    }

    if (!acceptedTerms) {
      alert("Please accept the Terms & Conditions to proceed with payment.");
      return;
    }

    if (!acceptedCancellation) {
      alert("Please accept the Cancellation Policy to proceed with payment.");
      return;
    }

    setIsLoading(true);

    try {
      const actualBookingId = bookingId;
      
      if (!actualBookingId) {
        alert("Booking ID is missing. Please go back and try again.");
        setIsLoading(false);
        return;
      }

      // Get phone number from user or local storage or booking details
      const getUserPhoneNumber = () => {
        // Check Firebase Auth first
        if (user.phoneNumber) return user.phoneNumber;
        
        // Check booking details
        if (details.phone) return details.phone;
        if (details.userPhone) return details.userPhone;
        if (details.phoneNumber) return details.phoneNumber;
        
        // Check localStorage for saved phone number
        const savedPhone = localStorage.getItem('userPhone');
        if (savedPhone) return savedPhone;
        
        // Return empty string if not found
        return '';
      };

      const customerPhone = getUserPhoneNumber();
      
      const customerName = user.displayName || 
                          details.customerName ||
                          details.userName ||
                          'Customer';
      
      const customerEmail = user.email || details.email || '';

      // Prepare update data
      const paymentPayload = {
        customerName,
        customerEmail,
        customerPhone,
        pickup,
        dropoff,
        travelDate,
        hour,
        minute,
        adults,
        children,
        price: Number(vehicleDetails?.price || 0),
        vehicleType: vehicleDetails?.name || 'Vehicle',
        time: `${hour || '12'}:${minute || '00'}`,
      };

      await apiRequest(`/airport-bookings/${actualBookingId}/payment-confirmation`, {
        method: 'POST',
        body: paymentPayload,
      }, user);
      
      console.log('✅ Payment confirmed. Customer phone saved:', customerPhone);

      // ========== INVOICE SENDING ==========
      
      alert("✅ Payment successful! Invoice sent to your email.");

      // Show location popup regardless of invoice result
      setShowLocationPopup(true);

    } catch (err) {
      console.error("❌ Error processing payment:", err);
      alert("Error processing payment: " + err.message);
    }

    setIsLoading(false);
  };

  const handleShareLocation = async (retryOrEvent = 0) => {
    // Handle both direct calls and button click events
    let retryCount = 0;
    if (typeof retryOrEvent === 'object' && retryOrEvent !== null) {
      // This is a button click event, start with retryCount = 0
      retryCount = 0;
    } else if (typeof retryOrEvent === 'number') {
      // This is a retry call with retryCount
      retryCount = retryOrEvent;
    }
    
    console.log('🔘 Share Location button clicked! Starting location sharing...');
    console.log('📍 Retry count:', retryCount);
    
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported');
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    if (!bookingId) {
      console.log('❌ No booking ID found');
      alert("Cannot share location: Booking ID not found.");
      return;
    }

    console.log(`📍 Attempting location share (attempt ${retryCount + 1})...`);
    
    // Progressive timeouts and accuracy settings
    const timeouts = [20000, 10000, 5000]; // More lenient timeouts
    const useHighAccuracy = retryCount === 0;
    const maxAge = retryCount > 0 ? 120000 : 60000; // Use older cached data on retries
    
    try {
      const position = await new Promise((resolve, reject) => {
        console.log(`🌍 Getting location with timeout: ${timeouts[Math.min(retryCount, timeouts.length - 1)]}ms, accuracy: ${useHighAccuracy ? 'high' : 'low'}`);
        
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: useHighAccuracy,
            timeout: timeouts[Math.min(retryCount, timeouts.length - 1)],
            maximumAge: maxAge
          }
        );
      });
      
      console.log('✅ Location obtained successfully:', position.coords.latitude, position.coords.longitude);
      
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy
      };

      // Update booking with user location
      await apiRequest(`/airport-bookings/${bookingId}/location`, {
        method: 'POST',
        body: {
          userLocation,
          locationShared: true,
          waitingForLocation: false,
          locationSkipped: false,
          status: 'searching_driver'
        }
      }, user);

      console.log('✅ Location shared successfully with driver!');
      alert("✅ Location shared successfully with your driver!\n\n" +
            "Your driver can now see your location and will be on their way.");
      
      navigate('/track-ride', { 
        state: { 
          bookingId: bookingId,
          bookingDetails: details 
        } 
      });

    } catch (error) {
      console.log(`❌ Location attempt ${retryCount + 1} failed:`, error.code === 3 ? 'timeout' : error.message);
      
      // Handle different error types
      if (error.code === 3) {
        // Timeout error
        if (retryCount < 2) {
          // Offer user-initiated retry
          const retry = confirm(
            `⏰ Location request timed out (attempt ${retryCount + 1}/3).\n\n` +
            "This can happen due to poor GPS signal or network issues.\n\n" +
            "Would you like to try again with more lenient settings?"
          );
          
          if (retry) {
            // User chose to retry - call function with increased retry count
            setTimeout(() => handleShareLocation(retryCount + 1), 100);
            return;
          } else {
            // User chose not to retry - offer fallback
            await offerLocationFallback();
          }
        } else {
          // All retries failed
          console.log('⏰ All location attempts timed out');
          await offerLocationFallback();
        }
      } else if (error.code === 1) {
        // Permission denied
        console.log('🚫 Location permission denied');
        alert("📍 Location permission denied.\n\n" +
              "Please enable location permissions in your browser settings and try again, or continue without location sharing.");
      } else {
        // Other errors
        console.log('❌ Other location error:', error.message);
        const proceedAnyway = confirm(
          "❌ Unable to get your location.\n\n" +
          "Would you like to continue anyway? Your driver will use the pickup address to find you."
        );
        
        if (proceedAnyway) {
          await proceedWithoutLocation();
        }
      }
    }
  };

  const offerLocationFallback = async () => {
    const useFallback = confirm(
      "⏰ Location requests are taking too long or failing.\n\n" +
      "Would you like to:\n" +
      "• Click OK to continue without exact location (driver will use pickup address)\n" +
      "• Click Cancel to try again later"
    );
    
    if (useFallback) {
      await proceedWithoutLocation();
    }
  };

  const proceedWithoutLocation = async () => {
    if (!bookingId) return;
    
    try {
      const bookingRef = doc(db, 'airportTransfers', bookingId);
      const bookingDoc = await getDoc(bookingRef);
      
      if (bookingDoc.exists()) {
        const currentData = bookingDoc.data();
        await updateDoc(bookingRef, {
          locationShared: false,
          waitingForLocation: false,
          locationSkipped: true,
          locationSkippedAt: serverTimestamp(),
          status: currentData.status === 'accepted' ? 'accepted' : 'searching_driver'
        });
      }
      
      navigate('/track-ride', { 
        state: { 
          bookingId: bookingId,
          bookingDetails: details 
        } 
      });
    } catch (err) {
      console.error('Error proceeding without location:', err);
      alert("Unable to proceed. Please try again or contact support.");
    }
  };

  const handleSkipLocation = async () => {
    if (bookingId) {
      try {
        const bookingRef = doc(db, 'airportTransfers', bookingId);
        const bookingDoc = await getDoc(bookingRef);
        
        if (bookingDoc.exists()) {
          const currentData = bookingDoc.data();
          await updateDoc(bookingRef, {
            locationShared: false,
            waitingForLocation: false,
            locationSkipped: true,
            locationSkippedAt: serverTimestamp(),
            status: currentData.status === 'accepted' ? 'accepted' : 'searching_driver'
          });
        }
      } catch (err) {
        console.error('Error updating skip status:', err);
      }
    }
    
    navigate('/track-ride', { 
      state: { 
        bookingId: bookingId,
        bookingDetails: details 
      } 
    });
  };

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Booking</h1>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
          {/* Trip Details Card */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-md p-4 border border-orange-100">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Trip Details
              </h2>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8">
                    <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-medium text-gray-800">{pickup.name || pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8">
                    <div className="h-2 w-2 bg-red-500 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Drop-off</p>
                    <p className="font-medium text-gray-800">{dropoff.name || dropoff.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-8">
                    <svg className="h-5 w-5 text-orange-500 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium text-gray-800">
                      {new Date(travelDate).toLocaleDateString()} at {hour}:{minute}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-md p-4 border border-orange-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selected Vehicle
              </h2>
              <div className="flex items-center">
                <img 
                  className="h-24 w-32 object-cover rounded-lg mr-4 border-2 border-orange-200"
                  src={vehicleDetails.image}
                  alt={vehicleDetails.name} 
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{vehicleDetails.name}</h3>
                  <p className="text-sm text-gray-600 mb-1">{vehicleDetails.description}</p>
                  <p className="text-2xl font-bold text-orange-600">₹{vehicleDetails.price}</p>
                  <p className="text-xs text-gray-500">{vehicleDetails.seats} seats • {vehicleDetails.type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions - Enhanced 3D Style */}
          <div className="mb-6">
            {/* 3D Header */}
            <div className="relative mb-4">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-t-xl px-4 py-3 shadow-lg">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Terms & Conditions
                </h2>
              </div>
              {/* 3D effect shadow */}
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-orange-400/30 to-transparent rounded-full"></div>
            </div>

            {/* Terms Card with Orange Accent */}
            <div className="relative">
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-orange-400 rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-orange-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-orange-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-orange-400 rounded-br-lg"></div>
              
              <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl border-2 border-orange-300 shadow-lg p-5 relative z-10">
                <div className="space-y-5">
                  {/* Included Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-green-500 text-white rounded-full p-1 mr-3">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-green-800">Included in Your Fare</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 ml-2">
                      {[
                        "Driver allowances as per itinerary",
                        "Road tolls, parking fees, and state taxes",
                        "All sightseeing as mentioned",
                        "Fuel charges for the confirmed route"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2 mt-1">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Not Included Section */}
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-lg p-4 border border-red-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-red-500 text-white rounded-full p-1 mr-3">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-red-800">Not Included</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 ml-2">
                      {[
                        "Entry tickets for attractions",
                        "Guest food and accommodation",
                        "Personal expenses",
                        "Off-itinerary detours",
                        "Tips or gratuities"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-2 mt-1">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Terms Acceptance with Orange Theme */}
                  <div className="mt-6 pt-5 border-t border-orange-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`relative cursor-pointer group ${acceptedTerms ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
                          <input
                            type="checkbox"
                            id="terms-checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="absolute opacity-0 w-0 h-0"
                          />
                          <div 
                            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-200
                              ${acceptedTerms 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 border-orange-600' 
                                : 'bg-white border-orange-300 group-hover:border-orange-500'}`}
                            onClick={() => setAcceptedTerms(!acceptedTerms)}
                          >
                            {acceptedTerms && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <label 
                        htmlFor="terms-checkbox" 
                        className="flex-1 cursor-pointer group"
                        onClick={() => setAcceptedTerms(!acceptedTerms)}
                      >
                        <p className="text-sm font-medium text-gray-800 group-hover:text-orange-700 transition-colors">
                          I agree to the Terms & Conditions
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-snug">
                          By checking this box, you acknowledge that you have read and accepted all terms mentioned above
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Policy - New Section */}
          <div className="mb-6">
            {/* 3D Header */}
            <div className="relative mb-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-t-xl px-4 py-3 shadow-lg">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Cancellation Policy
                </h2>
              </div>
              {/* 3D effect shadow */}
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-gradient-to-b from-red-400/30 to-transparent rounded-full"></div>
            </div>

            {/* Cancellation Card with Red Accent */}
            <div className="relative">
              {/* Decorative corner accents */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-red-400 rounded-tl-lg"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-red-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-red-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-red-400 rounded-br-lg"></div>
              
              <div className="bg-gradient-to-br from-white to-red-50 rounded-xl border-2 border-red-300 shadow-lg p-5 relative z-10">
                <div className="space-y-5">
                  {/* Cancellation Timeline */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200 shadow-sm">
                    <div className="flex items-center mb-4">
                      <div className="bg-red-500 text-white rounded-full p-1 mr-3">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-red-800">Cancellation Timeline & Refunds</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="bg-red-100 text-red-700 rounded-full p-2 mr-3 flex-shrink-0">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">More than 24 hours before pickup</p>
                          <p className="text-xs text-gray-600 mt-1">Full refund (100% of payment)</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-red-100 text-red-700 rounded-full p-2 mr-3 flex-shrink-0">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">6-24 hours before pickup</p>
                          <p className="text-xs text-gray-600 mt-1">Partial refund (50% of payment)</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="bg-red-100 text-red-700 rounded-full p-2 mr-3 flex-shrink-0">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">Less than 6 hours before pickup</p>
                          <p className="text-xs text-gray-600 mt-1">No refund (0% of payment)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="bg-orange-500 text-white rounded-full p-1 mr-3">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-orange-800">Important Notes</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700 ml-2">
                      {[
                        "Refunds are processed within 5-7 business days",
                        "No-show at pickup time will be considered as last-minute cancellation",
                        "Flight delays or cancellations require official documentation for refund consideration",
                        "Contact customer support for any cancellation requests"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-2 mt-1">•</span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cancellation Policy Acceptance */}
                  <div className="mt-6 pt-5 border-t border-red-200">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`relative cursor-pointer group ${acceptedCancellation ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
                          <input
                            type="checkbox"
                            id="cancellation-checkbox"
                            checked={acceptedCancellation}
                            onChange={(e) => setAcceptedCancellation(e.target.checked)}
                            className="absolute opacity-0 w-0 h-0"
                          />
                          <div 
                            className={`w-7 h-7 rounded-md border-2 flex items-center justify-center transition-all duration-200
                              ${acceptedCancellation 
                                ? 'bg-gradient-to-r from-red-500 to-red-600 border-red-600' 
                                : 'bg-white border-red-300 group-hover:border-red-500'}`}
                            onClick={() => setAcceptedCancellation(!acceptedCancellation)}
                          >
                            {acceptedCancellation && (
                              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                      <label 
                        htmlFor="cancellation-checkbox" 
                        className="flex-1 cursor-pointer group"
                        onClick={() => setAcceptedCancellation(!acceptedCancellation)}
                      >
                        <p className="text-sm font-medium text-gray-800 group-hover:text-red-700 transition-colors">
                          I agree to the Cancellation Policy
                        </p>
                        <p className="text-xs text-gray-500 mt-1 leading-snug">
                          By checking this box, I acknowledge that I have read and understood the cancellation policy and refund terms
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Payment Card */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-5 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3 text-center">
                Complete Payment
              </h2>
              <div className="text-center mb-4">
                <div className="inline-flex items-center bg-gradient-to-r from-orange-100 to-amber-100 rounded-full px-4 py-2 mb-3">
                  <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                  <span className="text-sm font-medium text-orange-700">Secure Payment</span>
                </div>
                <p className="text-gray-600 mb-4">Scan QR code with any UPI app</p>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg border-2 border-dashed border-orange-200">
                <img
                  src={QrPayment}
                  alt="QR Payment"
                  className="mx-auto w-60 h-60 object-contain rounded-lg"
                />
              </div>
              <div className="mt-4 flex justify-center space-x-2">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">GP</span>
                </div>
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <div className="h-10 w-10 bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">Ptm</span>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">BHIM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Extra padding at the bottom for scroll */}
          <div className="h-24"></div>
        </div>
      </div>

      {/* Payment Button at Bottom */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={handlePaymentConfirm}
            disabled={isLoading || !acceptedTerms || !acceptedCancellation}
            className={`w-full px-6 py-4 text-white rounded-xl font-bold text-lg transition-all transform duration-200 
              ${!acceptedTerms || !acceptedCancellation
                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] shadow-lg hover:shadow-xl'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Payment...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Confirm Payment
              </span>
            )}
          </button>
          <div className="flex items-center justify-center mt-3 space-x-4">
            {!acceptedTerms && (
              <p className="text-center text-xs text-red-500">
                Please accept Terms & Conditions
              </p>
            )}
            {!acceptedCancellation && (
              <p className="text-center text-xs text-red-500">
                Please accept Cancellation Policy
              </p>
            )}
            {acceptedTerms && acceptedCancellation && (
              <p className="text-center text-xs text-gray-500">
                Your booking will be confirmed immediately after payment
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Location Sharing Popup */}
      {showLocationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-16 pb-8 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="text-center mb-4">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Share Your Location</h3>
              <p className="text-gray-600 text-sm mb-1">
                Help your driver find you faster by sharing your current location
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleShareLocation}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Share My Location
              </button>
              
              <button
                onClick={handleSkipLocation}
                className="w-full px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg font-medium hover:from-gray-200 hover:to-gray-300 transition shadow-sm hover:shadow"
              >
                Skip for Now
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              <svg className="inline h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Your location will be visible to your driver only
            </p>
          </div>
        </div>
      )} 
    </div>
  );
};

export default PaymentPage;
