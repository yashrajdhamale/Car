import React, { useState, useEffect } from "react";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  onSnapshot,
  updateDoc,
  getDoc,
  setDoc
} from "firebase/firestore";
import { db, auth } from "@config/firebase";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

// Country codes data
const countryCodes = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
];

const BookingPage = () => {
  const location = useLocation();
  const { vehicle, transferDetails = {} } = location.state || {};
  
  const [form, setForm] = useState({
    fullName: "",
    countryCode: "+91",
    contact: "",
    email: "",
    pickup: transferDetails.pickup?.address || "",
    drop: transferDetails.dropoff?.address || "",
    travelDate: transferDetails.travelDate || "",
    travelTime: transferDetails.hour && transferDetails.minute 
      ? `${transferDetails.hour}:${transferDetails.minute}` 
      : "",
    vehicle: vehicle || null,
    numberOfPassengers: transferDetails.adults 
      ? (transferDetails.adults + (transferDetails.children || 0)) 
      : 1,
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Test Firestore connection
  const testFirestore = async () => {
    try {
      console.log('Testing Firestore connection...');
      const testData = {
        testField: 'testValue',
        timestamp: new Date().toISOString(),
        message: 'This is a test document from BookingPage'
      };
      
      const docRef = await addDoc(collection(db, 'test_connection'), testData);
      console.log('Test document written with ID: ', docRef.id);
      
      // Verify the document was saved
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        console.log('Test document verified:', docSnap.data());
        toast.success('Firestore connection test successful!');
      } else {
        console.log('Test document not found after save');
        toast.error('Failed to verify test document');
      }
    } catch (error) {
      console.error('Firestore test failed:', error);
      toast.error(`Firestore test failed: ${error.message}`);
    }
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!/^\+?[0-9\s-]{10,}$/.test(form.contact)) {
      toast.error("Please enter a valid contact number");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!form.pickup) {
      toast.error("Please enter pickup location");
      return false;
    }
    if (!form.drop) {
      toast.error("Please enter drop location");
      return false;
    }
    if (!form.agree) {
      toast.error("You must accept the terms and conditions");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Starting form submission...');
    
    if (!form.agree) {
      const errorMsg = 'Please accept the terms and conditions';
      console.error('❌ Validation failed:', errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    console.log('✅ Form validation passed');
    console.log('📋 Form data:', form);
    console.log('🚗 Vehicle data:', vehicle);
    console.log('📍 Transfer details:', transferDetails);
    
    // Verify Firebase initialization
    if (!db) {
      console.error('❌ Firestore not initialized');
      toast.error('Database connection error. Please refresh the page.');
      setIsSubmitting(false);
      return;
    }

    let unsubscribe;
    let rideDocRef = null;
    
    try {
      console.log('📝 Preparing booking data...');
      const bookingData = {
        customerName: form.fullName,
        contact: form.contact,
        email: form.email,
        pickup: form.pickup,
        drop: form.drop,
        travelDate: form.travelDate,
        travelTime: form.travelTime,
        numberOfPassengers: form.numberOfPassengers,
        vehicle: form.vehicle ? {
          id: form.vehicle.id || '',
          name: form.vehicle.name || '',
          type: form.vehicle.type || 'standard',
          price: form.vehicle.price || 0,
          passengers: form.vehicle.passengers || 4
        } : null,
        transferDetails: {
          pickup: transferDetails.pickup || {},
          dropoff: transferDetails.dropoff || {},
          destination: transferDetails.destination || {},
          adults: transferDetails.adults || 1,
          children: transferDetails.children || 0,
          nationality: transferDetails.nationality || 'Indian'
        },
        status: 'pending',
        bookingDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        to: form.email,
        template: {
          name: 'booking_confirmation',
          data: {
            name: form.fullName,
            contact: form.contact,
            email: form.email,
            pickup: form.pickup,
            drop: form.drop,
            travelDate: form.travelDate,
            travelTime: form.travelTime,
            vehicle: form.vehicle?.name || 'Not specified',
            bookingDate: new Date().toLocaleDateString(),
            bookingId: ''
          }
        }
      };

      console.log('📤 Attempting to save booking to Firestore...');
      console.log('📄 Booking data:', JSON.stringify(bookingData, null, 2));
      
      // Call the Firebase Function to handle the booking
      console.log('📡 Calling submitBooking Cloud Function...');
      const functionUrl = 'https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/submitBooking';
      
      // Add a timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `${functionUrl}?_t=${timestamp}`;
      
      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process booking');
      }
      
      console.log('✅ Booking processed successfully:', result);
      
      // Create ride document in Firestore
      try {
        console.log('🚕 Creating ride document...');
        const rideData = {
          customerName: form.fullName,
          customerEmail: form.email,
          pickup: form.pickup,
          drop: form.drop,
          pickupTime: form.travelDate + ' ' + form.travelTime,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        rideDocRef = await addDoc(collection(db, 'rides'), rideData);
        console.log('🚖 Ride created with ID:', rideDocRef.id);
        
        // Show success message to user
        toast.success('Ride requested. Waiting for a driver to accept...');
        
        // Update the booking with the ride ID if booking exists
        if (result.bookingId) {
          try {
            await updateDoc(doc(db, 'bookings', result.bookingId), {
              rideId: rideDocRef.id,
              updatedAt: serverTimestamp()
            });
            console.log('📝 Updated booking with ride ID');
          } catch (updateError) {
            console.error('⚠️ Failed to update booking with ride ID:', updateError);
            // Non-critical error, continue
          }
        }
      } catch (rideError) {
        console.error('❌ Failed to create ride:', rideError);
        toast.error('Ride request created, but there was an error processing additional details.');
        // Continue to show success since the main booking was successful
      }
      
      // Set booking details for the success popup
      setBookingDetails({
        bookingId: result.bookingId || 'N/A',
        rideId: rideDocRef?.id || 'N/A',
        email: form.email,
        vehicle: form.vehicle?.name || 'Selected Vehicle',
        pickup: form.pickup,
        drop: form.drop,
        date: form.travelDate
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Reset form
      setForm({
        fullName: "",
        countryCode: "+91",
        contact: "",
        email: "",
        pickup: "",
        drop: "",
        travelDate: "",
        travelTime: "",
        vehicle: null,
        numberOfPassengers: 1,
        agree: false,
      });

      // Email delivery has been disabled as per requirements

    } catch (error) {
      console.error('❌ CRITICAL ERROR during booking:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to save booking. ';
      
      if (error.code) {
        errorMessage += `Error code: ${error.code}. `;
        
        switch(error.code) {
          case 'permission-denied':
            errorMessage += 'Permission denied. Check your Firestore security rules.';
            break;
          case 'unavailable':
            errorMessage += 'Network error. Please check your internet connection.';
            break;
          default:
            errorMessage += 'Please try again or contact support.';
        }
      } else {
        errorMessage += error.message || 'Please try again later.';
      }
      
      toast.error(errorMessage);
    } finally {
      console.log('🏁 Form submission completed');
      setIsSubmitting(false);
    }
};

const renderTripSummary = () => {
  if (!transferDetails || !Object.keys(transferDetails).length) return null;
  
  return (
    
    <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h1 className="text-2xl font-semibold mb-3 text-gray-800">hello</h1>
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Trip Summary</h3>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>From:</span>
          <span className="font-medium">{transferDetails.pickup?.address || 'Not specified'}</span>
        </div>
        <div className="flex justify-between">
          <span>To:</span>
          <span className="font-medium">{transferDetails.dropoff?.address || 'Not specified'}</span>
        </div>
        {transferDetails.travelDate && (
          <div className="flex justify-between">
            <span>Travel Date:</span>
            <span className="font-medium">
              {new Date(transferDetails.travelDate).toLocaleDateString()}
              {transferDetails.hour && transferDetails.minute && (
                <span> at {transferDetails.hour}:{transferDetails.minute}</span>
              )}
            </span>
          </div>
        )}
        {form.vehicle && (
          <div className="flex justify-between">
            <span>Vehicle:</span>
            <span className="font-medium">{form.vehicle.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
    <div className="max-w-4xl mx-auto bg-white bg-opacity-90 rounded-2xl shadow-xl overflow-hidden mt-20">
      <div className="px-6 py-8 sm:p-10">
        {renderTripSummary()}
        
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4 border-gray-200">
            Contact & Trip Details
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            {/* Contact Number with Country Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <div className="relative w-1/3 mr-2">
                  <select
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className="w-full h-10 pl-3 pr-8 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {countryCodes.map((country, index) => (
                      <option key={index} value={country.code}>
                        {country.flag} {country.code} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="tel"
                  name="contact"
                  value={form.contact}
                  onChange={handleChange}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="98765 43210"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                We'll use this to contact you about your booking
              </p>
            </div>

            {/* Pickup Location */}
            <div>
              <label htmlFor="pickup" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="pickup"
                name="pickup"
                value={form.pickup}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter pickup address"
              />
            </div>

            {/* Drop-off Location */}
            <div>
              <label htmlFor="drop" className="block text-sm font-medium text-gray-700 mb-1">
                Drop-off Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="drop"
                name="drop"
                value={form.drop}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter drop-off address"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={handleChange}
                  required
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agree" className="font-medium text-gray-700">
                  I agree to the <a href="/terms" className="text-orange-600 hover:text-orange-500">Terms and Conditions</a>
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-gray-500">You must agree to the terms and conditions to proceed with the booking.</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
          
          {isSubmitting && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mb-6"></div>
                <p className="text-xl font-semibold text-gray-800">Processing your booking...</p>
                <p className="text-md text-gray-600 mt-2">Please do not close this window</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Success Popup */}
    {showSuccessPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ride Requested!</h3>
          <p className="text-gray-600 mb-6">
            We're finding you the best driver. You'll be notified once your ride is confirmed.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 text-center">
              Waiting for a driver to accept your ride request...
            </p>
          </div>
          <button
            onClick={() => setShowSuccessPopup(false)}
            className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Close
          </button>
        </div>
      </div>
    )}
    </div>
  );
};

export default BookingPage;