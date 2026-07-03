

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { auth, db } from "@config/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { 
//   doc, 
//   getDoc,
//   onSnapshot,
//   updateDoc,
//   serverTimestamp
// } from "firebase/firestore";
// import FindingDriver from "./booking/FindingDriver";
// import {
//   FaCheckCircle,
//   FaSpinner,
//   FaUser,
//   FaPhone,
//   FaCar,
//   FaClock,
//   FaFileInvoice,
//   FaEnvelope,
//   FaCalendarAlt,
//   FaMapMarkerAlt,
//   FaShareAlt
// } from "react-icons/fa";
// import qrImg from "../assets/images/Qrpayment.jpg";

// function BookingForm() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { state } = location;
//   const { 
//     car, 
//     pickupCity, 
//     destinationCity, 
//     price, 
//     distance, 
//     passengerCount, 
//     days, 
//     pickupSublocality, 
//     destinationSublocality,
//     bookingId,
//     requiresLogin: propRequiresLogin = false,
//     vehicleCapacity,
//     rideType,
//     rideDate,
//     rideTime,
//     scheduledDateTime,
//     isScheduled
//   } = state || {};
  
//   const requiresLogin = propRequiresLogin || false;

//   const [bookingStatus, setBookingStatus] = useState("pending");
//   const [paymentSuccess, setPaymentSuccess] = useState(false);
//   const [driverDetails, setDriverDetails] = useState(null);
//   const [estimatedArrival, setEstimatedArrival] = useState("5-10 minutes");
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [authChecked, setAuthChecked] = useState(false);
//   const [savedBookingData, setSavedBookingData] = useState(null);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [isFindingDriver, setIsFindingDriver] = useState(false);
//   const [invoiceSent, setInvoiceSent] = useState(false);
//   const [sendingInvoice, setSendingInvoice] = useState(false);
//   const [isSharingLocation, setIsSharingLocation] = useState(false);
//   const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
//   const [locationWatchId, setLocationWatchId] = useState(null);
//   const [locationError, setLocationError] = useState(null);
//   const audioContextRef = useRef(null);
//   const audioElementRef = useRef(null);
//   const bookingDataRef = useRef(null);
//   const [error, setError] = useState(null);
//   const [userEmail, setUserEmail] = useState("");
//   const [userName, setUserName] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Get user email and name
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setIsAuthenticated(!!user);
//       setAuthChecked(true);
//       if (user) {
//         setUserEmail(user.email || "");
//         setUserName(user.displayName || user.email?.split('@')[0] || "Customer");
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Clean up location watcher on unmount
//   useEffect(() => {
//     return () => {
//       if (locationWatchId !== null && navigator.geolocation) {
//         navigator.geolocation.clearWatch(locationWatchId);
//       }
//     };
//   }, [locationWatchId]);

//   // Function to request location sharing
//   const requestLocationSharing = async () => {
//     if (!bookingId) {
//       console.error("No booking ID available");
//       return;
//     }

//     if (!('geolocation' in navigator)) {
//       console.warn("Geolocation is not supported by this browser");
//       // Mark as skipped and go to tracking
//       try {
//         const bookingRef = doc(db, "bookings", bookingId);
//         await updateDoc(bookingRef, {
//           locationSkipped: true,
//           waitingForLocation: false,
//           updatedAt: serverTimestamp()
//         });
//       } catch (error) {
//         console.error("Error updating location skipped status:", error);
//       }
//       navigate(`/track-outstation/${bookingId}`);
//       return;
//     }

//     // Show location sharing prompt
//     const shouldShare = window.confirm(
//       'To provide better service and allow your driver to reach you easily, would you like to share your live location? (Recommended)\n\nClick "OK" to share your live location, or "Cancel" to skip.'
//     );
    
//     if (shouldShare) {
//       setIsSharingLocation(true);
//       await startLocationSharing();
//     } else {
//       // Mark that user skipped location sharing
//       try {
//         const bookingRef = doc(db, "bookings", bookingId);
//         await updateDoc(bookingRef, {
//           locationSkipped: true,
//           waitingForLocation: false,
//           updatedAt: serverTimestamp()
//         });
//         console.log("User skipped location sharing");
//       } catch (error) {
//         console.error("Error updating location skipped status:", error);
//       }
      
//       // Redirect to tracking page
//       navigate(`/track-outstation/${bookingId}`);
//     }
//   };

//   // Function to start location sharing
//   const startLocationSharing = async () => {
//     if (!bookingId) {
//       console.error("No booking ID available");
//       setIsSharingLocation(false);
//       return;
//     }

//     try {
//       // First get current position to check permission
//       const position = await new Promise((resolve, reject) => {
//         navigator.geolocation.getCurrentPosition(resolve, reject, {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0
//         });
//       });

//       const location = {
//         lat: position.coords.latitude,
//         lng: position.coords.longitude,
//         timestamp: Date.now(),
//         accuracy: position.coords.accuracy,
//         speed: position.coords.speed || 0,
//         heading: position.coords.heading || null
//       };

//       // Update Firestore with initial location
//       const bookingRef = doc(db, "bookings", bookingId);
//       await updateDoc(bookingRef, {
//         userLocation: location,
//         userLocationUpdatedAt: serverTimestamp(),
//         locationShared: true,
//         waitingForLocation: false,
//         updatedAt: serverTimestamp()
//       });

//       console.log("✅ Initial location shared");
//       setLocationPermissionGranted(true);

//       // Start continuous location tracking
//       startContinuousLocationTracking(bookingRef);

//       // Redirect to tracking page
//       navigate(`/track-outstation/${bookingId}`);

//     } catch (error) {
//       console.error("Location error:", error);
//       setLocationError("Unable to get location. You can still track your ride.");
      
//       // Update Firestore with error status
//       try {
//         const bookingRef = doc(db, "bookings", bookingId);
//         await updateDoc(bookingRef, {
//           locationSkipped: true,
//           waitingForLocation: false,
//           locationError: error.message,
//           updatedAt: serverTimestamp()
//         });
//       } catch (firestoreError) {
//         console.error("Error updating location error status:", firestoreError);
//       }
      
//       // Still redirect to tracking page
//       navigate(`/track-outstation/${bookingId}`);
//     } finally {
//       setIsSharingLocation(false);
//     }
//   };

//   // Function for continuous location tracking
//   const startContinuousLocationTracking = (bookingRef) => {
//     if (!navigator.geolocation) {
//       console.warn("Geolocation not available for continuous tracking");
//       return;
//     }

//     // Store location updates in buffer to avoid too many Firestore writes
//     let locationBuffer = null;
//     const updateInterval = 5000; // Update every 5 seconds

//     const watchId = navigator.geolocation.watchPosition(
//       (position) => {
//         const location = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//           timestamp: Date.now(),
//           accuracy: position.coords.accuracy,
//           speed: position.coords.speed || 0,
//           heading: position.coords.heading || null
//         };

//         locationBuffer = location;
//       },
//       (error) => {
//         console.error("Continuous location error:", error);
//         setLocationError("Location sharing stopped");
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 3000,
//         timeout: 10000
//       }
//     );

//     setLocationWatchId(watchId);

//     // Periodically update Firestore with buffered location
//     const intervalId = setInterval(async () => {
//       if (locationBuffer && bookingRef) {
//         try {
//           await updateDoc(bookingRef, {
//             userLocation: locationBuffer,
//             userLocationUpdatedAt: serverTimestamp(),
//             updatedAt: serverTimestamp()
//           });
//           console.log("📍 Location updated");
//           locationBuffer = null;
//         } catch (error) {
//           console.error("Error updating location:", error);
//         }
//       }
//     }, updateInterval);

//     return () => {
//       if (watchId) {
//         navigator.geolocation.clearWatch(watchId);
//       }
//       clearInterval(intervalId);
//     };
//   };

//   // Function to send invoice email
//   const sendInvoiceEmail = async () => {
//     if (!userEmail) {
//       console.error("No user email available");
//       return false;
//     }

//     setSendingInvoice(true);
//     try {
//       const invoiceData = {
//         to: userEmail,
//         customerName: userName,
//         bookingId: bookingId,
//         vehicleType: car?.name || "Outstation Vehicle",
//         vehicleCapacity: vehicleCapacity || car?.capacity || 4,
//         pickup: pickupSublocality || pickupCity,
//         destination: destinationSublocality || destinationCity,
//         travelDate: rideDate || new Date().toLocaleDateString(),
//         time: rideTime || new Date().toLocaleTimeString(),
//         passengerCount: passengerCount || 1,
//         days: days || 1,
//         distance: distance || 0,
//         price: price || 0
//       };

//       const response = await fetch(
//         "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendOutstationInvoice",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(invoiceData),
//         }
//       );

//       const result = await response.json();
      
//       if (result.success) {
//         setInvoiceSent(true);
//         return true;
//       } else {
//         console.error("Failed to send invoice:", result.error);
//         return false;
//       }
//     } catch (error) {
//       console.error("Error sending invoice:", error);
//       return false;
//     } finally {
//       setSendingInvoice(false);
//     }
//   };

//   // Handle driver assignment
//   const handleDriverAssigned = useCallback(async (bookingData) => {
//     try {
//       console.log('Driver assigned - received data:', bookingData);
      
//       const driverInfo = bookingData.driverInfo || bookingData.assignedDriver || {
//         id: bookingData.driverId,
//         name: bookingData.driverName || 'Your Driver',
//         phone: bookingData.driverPhone || 'Not available',
//         vehicle: bookingData.vehicle || { name: 'Standard Vehicle' },
//         photoURL: bookingData.driverPhotoURL || null,
//         rating: bookingData.driverRating || 4.5,
//         totalRides: bookingData.driverTotalRides || 0
//       };
      
//       setDriverDetails(driverInfo);
//       setBookingStatus('driver_assigned');
//       setIsFindingDriver(false);
      
//       // Update Firestore if needed
//       if (bookingData.id && bookingData.status !== 'driver_assigned') {
//         try {
//           await updateDoc(doc(db, 'bookings', bookingData.id), {
//             status: 'driver_assigned',
//             updatedAt: serverTimestamp(),
//             driverId: driverInfo.id,
//             driverName: driverInfo.name,
//             driverPhone: driverInfo.phone,
//             driverPhotoURL: driverInfo.photoURL,
//             driverRating: driverInfo.rating,
//             driverTotalRides: driverInfo.totalRides,
//             vehicle: driverInfo.vehicle
//           });
//         } catch (error) {
//           console.error('Error updating booking status:', error);
//         }
//       }
      
//     } catch (error) {
//       console.error('Error in handleDriverAssigned:', error);
//       setError('Failed to process driver assignment.');
//       setBookingStatus('error');
//     }
//   }, []);

//   // Handle driver search timeout
//   const handleDriverSearchTimeout = async () => {
//     setError("We couldn't find a driver in time. Please try again.");
//     setBookingStatus("timeout");
    
//     if (bookingId) {
//       try {
//         const bookingRef = doc(db, "bookings", bookingId);
//         await updateDoc(bookingRef, {
//           status: "timeout",
//           updatedAt: serverTimestamp()
//         });
//       } catch (error) {
//         console.error("Error updating booking status:", error);
//       }
//     }
//   };

//   // Handle payment completion
//   const handlePaymentDone = async () => {
//     if (!auth.currentUser) {
//       const bookingData = {
//         car,
//         pickupCity,
//         destinationCity,
//         price,
//         distance,
//         passengerCount: passengerCount || 1,
//         days: days || 1,
//         pickupSublocality: pickupSublocality || '',
//         destinationSublocality: destinationSublocality || '',
//         isHolidayPackage: true,
//         location: location.state?.location || {},
//         dateRange: location.state?.dateRange || {},
//         searchQuery: location.state?.searchQuery || "",
//         requiresLogin: false,
//         vehicleCapacity,
//         rideType,
//         rideDate,
//         rideTime
//       };
      
//       localStorage.setItem('pendingHolidayBooking', JSON.stringify(bookingData));
      
//       navigate('/login', { 
//         state: { 
//           from: { 
//             pathname: '/book',
//             state: bookingData
//           },
//           message: 'Please log in to complete your payment'
//         },
//         replace: true
//       });
//       return;
//     }
    
//     setSendingInvoice(true);
    
//     // Send invoice email first
//     const invoiceSent = await sendInvoiceEmail();
    
//     if (invoiceSent) {
//       setPaymentSuccess(true);
      
//       // Update booking status in bookings collection
//       if (bookingId) {
//         try {
//           const bookingRef = doc(db, "bookings", bookingId);
//           await updateDoc(bookingRef, {
//             status: "payment_confirmed",
//             paymentStatus: "paid",
//             paymentDate: serverTimestamp(),
//             invoiceSent: true,
//             waitingForLocation: true, // IMPORTANT: Flag for location sharing
//             updatedAt: serverTimestamp()
//           });
          
//           console.log("✅ Booking marked as payment_confirmed");
          
//           // Also check if booking exists in holidayBookings and update it too
//           try {
//             const holidayBookingRef = doc(db, "holidayBookings", bookingId);
//             const holidayDoc = await getDoc(holidayBookingRef);
//             if (holidayDoc.exists()) {
//               await updateDoc(holidayBookingRef, {
//                 status: "completed",
//                 paymentStatus: "paid",
//                 paymentDate: serverTimestamp(),
//                 invoiceSent: true
//               });
//             }
//           } catch (error) {
//             console.log("No holiday booking found, continuing...");
//           }
          
//           // Request location sharing after successful payment
//           setTimeout(() => {
//             requestLocationSharing();
//           }, 1000);
          
//         } catch (error) {
//           console.error("❌ Error updating booking status:", error);
//           alert("Payment recorded but failed to update booking. Please contact support.");
//           setPaymentSuccess(true);
//         }
//       }
      
//     } else {
//       alert("Payment recorded but failed to send invoice. Please contact support.");
//       setPaymentSuccess(true);
//     }
//   };

//   // Listen to booking updates
//   useEffect(() => {
//     if (!bookingId) return;

//     let unsubscribe;
    
//     const setupListener = async () => {
//       // First check bookings collection (where tracking happens)
//       const bookingsRef = doc(db, "bookings", bookingId);
//       const holidayBookingsRef = doc(db, "holidayBookings", bookingId);
      
//       const [bookingDoc, holidayDoc] = await Promise.all([
//         getDoc(bookingsRef),
//         getDoc(holidayBookingsRef)
//       ]);
      
//       let bookingRef;
//       let bookingData;
      
//       if (bookingDoc.exists()) {
//         bookingRef = bookingsRef;
//         bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
//       } else if (holidayDoc.exists()) {
//         bookingRef = holidayBookingsRef;
//         bookingData = { id: holidayDoc.id, ...holidayDoc.data() };
//       } else {
//         console.error("Booking not found");
//         return;
//       }
      
//       unsubscribe = onSnapshot(bookingRef, (docSnap) => {
//         if (!docSnap.exists()) return;
        
//         const data = { id: docSnap.id, ...docSnap.data() };
//         const currentStatus = data.status || "pending";
//         setBookingStatus(currentStatus);
        
//         // Check for driver info
//         const hasDriverInfo = data.driverId || data.driverName || data.driverInfo;
        
//         if (hasDriverInfo) {
//           const driverInfo = data.driverInfo || {};
//           const vehicleInfo = driverInfo.vehicle || {};
          
//           const formattedDriverData = {
//             id: data.driverId || driverInfo.id || 'unknown',
//             name: data.driverName || driverInfo.name || 'Driver',
//             phone: data.driverPhone || driverInfo.phone || 'Not provided',
//             photoURL: data.driverPhotoURL || driverInfo.photoURL || null,
//             status: data.status === 'driver_assigned' ? 'On the way' : data.status,
//             vehicle: {
//               type: data.vehicleType || vehicleInfo.type || 'Car',
//               model: data.vehicleModel || vehicleInfo.model || 'Standard',
//               number: data.vehicleNumber || vehicleInfo.number || 'N/A'
//             },
//             rating: data.driverRating || driverInfo.rating || 5,
//             totalRides: data.totalRides || driverInfo.totalRides || 0
//           };
          
//           setDriverDetails(formattedDriverData);
          
//           if (data.status === 'driver_assigned') {
//             setEstimatedArrival("5-10 minutes");
//             setBookingStatus('driver_assigned');
//           }
//         }
//       });
//     };
    
//     setupListener();
    
//     return () => {
//       if (unsubscribe) unsubscribe();
//     };
//   }, [bookingId]);

//   // Show login prompt for unauthenticated users
//   if (authChecked && !isAuthenticated && requiresLogin) {
//     return (
//       <div className="max-w-4xl mx-auto p-6">
//         <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
//           <div className="flex">
//             <div className="ml-3">
//               <p className="text-sm text-yellow-700">
//                 Please <button 
//                   onClick={() => navigate('/login', { state: { from: location } })}
//                   className="font-medium text-yellow-700 underline hover:text-yellow-600"
//                 >
//                   log in
//                 </button> to complete your booking.
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // Handle missing state
//   if (!state) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h2 className="text-2xl font-bold text-gray-800 mb-4">No Booking Details Found</h2>
//           <button
//             onClick={() => navigate("/")}
//             className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//           >
//             Go to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Show location sharing modal after payment
//   if (paymentSuccess && !isSharingLocation) {
//     return (
//       <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
//           <div className="mb-6">
//             <FaShareAlt className="text-blue-500 text-5xl mx-auto mb-4" />
//             <h2 className="text-2xl font-bold text-gray-800 mb-2">Share Your Live Location</h2>
//             <p className="text-gray-600 mb-4">
//               Help your driver find you easily by sharing your live location.
//             </p>
            
//             <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
//               <div className="flex items-start space-x-3">
//                 <FaMapMarkerAlt className="text-blue-500 mt-1" />
//                 <div>
//                   <h3 className="font-semibold text-blue-700">Benefits:</h3>
//                   <ul className="text-sm text-gray-600 mt-2 space-y-1">
//                     <li>• Driver sees your exact pickup location</li>
//                     <li>• Real-time tracking on map</li>
//                     <li>• Accurate ETA calculations</li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
            
//             <div className="space-y-3">
//               <button
//                 onClick={requestLocationSharing}
//                 disabled={isSharingLocation}
//                 className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
//                   isSharingLocation 
//                     ? 'bg-blue-400 cursor-not-allowed' 
//                     : 'bg-blue-600 hover:bg-blue-700'
//                 } text-white transition-colors`}
//               >
//                 {isSharingLocation ? (
//                   <>
//                     <FaSpinner className="animate-spin" />
//                     <span>Setting up location sharing...</span>
//                   </>
//                 ) : (
//                   <>
//                     <FaShareAlt />
//                     <span>Share My Live Location</span>
//                   </>
//                 )}
//               </button>
              
//               <button
//                 onClick={() => {
//                   if (bookingId) {
//                     const bookingRef = doc(db, "bookings", bookingId);
//                     updateDoc(bookingRef, {
//                       locationSkipped: true,
//                       waitingForLocation: false,
//                       updatedAt: serverTimestamp()
//                     }).catch(console.error);
//                   }
//                   navigate(`/track-outstation/${bookingId}`);
//                 }}
//                 className="w-full py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
//               >
//                 Skip Location Sharing
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // State 1: Driver assigned, payment completed
//   if (paymentSuccess && driverDetails) {
//     return (
//       <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
//           <div className="text-center mb-6">
//             <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
//             <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
//             <p className="text-gray-600 mb-4">Invoice has been sent to your email.</p>
            
//             {invoiceSent && (
//               <div className="bg-green-50 p-3 rounded-lg mb-4">
//                 <div className="flex items-center justify-center space-x-2 text-green-700">
//                   <FaEnvelope />
//                   <span>Invoice sent to {userEmail}</span>
//                 </div>
//               </div>
//             )}
//           </div>
          
//           <div className="text-center">
//             <button
//               onClick={() => navigate(`/track-outstation/${bookingId}`)}
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
//             >
//               Go to Live Tracking
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // State 2: Driver assigned, waiting for payment
//   if (bookingStatus === "driver_assigned" && !paymentSuccess) {
//     return (
//       <div className="min-h-screen bg-gray-50 py-8 px-4">
//         <div className="max-w-3xl mx-auto">
//           <div className="bg-white shadow rounded-lg overflow-hidden">
//             <div className="px-6 py-5 border-b border-gray-200">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-2xl font-bold text-gray-900">Driver Assigned!</h2>
//                 {isScheduled && (
//                   <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
//                     Scheduled Trip
//                   </span>
//                 )}
//               </div>
//             </div>
            
//             <div className="px-6 py-5">
//               {driverDetails ? (
//                 <div className="mb-6">
//                   <h3 className="text-lg font-medium text-gray-900 mb-4">Your Driver is on the way!</h3>
//                   <div className="bg-blue-50 p-4 rounded-lg flex items-start">
//                     <div className="flex-shrink-0">
//                       {driverDetails.photoURL ? (
//                         <img 
//                           className="h-16 w-16 rounded-full object-cover" 
//                           src={driverDetails.photoURL} 
//                           alt={driverDetails.name}
//                         />
//                       ) : (
//                         <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
//                           <FaUser className="h-8 w-8 text-blue-500" />
//                         </div>
//                       )}
//                     </div>
//                     <div className="ml-4 flex-1">
//                       <div className="flex items-center justify-between">
//                         <h4 className="text-lg font-medium text-gray-900">{driverDetails.name}</h4>
//                         {driverDetails.rating && (
//                           <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
//                             ⭐ {parseFloat(driverDetails.rating).toFixed(1)}
//                           </span>
//                         )}
//                       </div>
                      
//                       <div className="mt-2">
//                         <div className="flex items-center">
//                           <FaCar className="h-4 w-4 text-gray-500 mr-2" />
//                           <span className="text-sm text-gray-600">
//                             {driverDetails.vehicle?.type || 'Car'}
//                             {driverDetails.vehicle?.model && ` • ${driverDetails.vehicle.model}`}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
//                     <div className="flex items-center">
//                       <FaClock className="h-5 w-5 text-yellow-400 mr-3" />
//                       <div>
//                         <p className="text-sm font-medium text-yellow-800">Estimated Arrival</p>
//                         <p className="text-sm text-yellow-700">{estimatedArrival}</p>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Payment Section */}
//                   <div className="mt-6 border-t border-gray-200 pt-6">
//                     <div className="bg-blue-50 p-4 rounded-lg">
//                       <div className="flex flex-col md:flex-row gap-6">
//                         <div className="w-full">
//                           <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
//                             <div className="flex items-center mb-3">
//                               <FaFileInvoice className="text-blue-500 mr-2" />
//                               <p className="text-sm text-gray-600">Invoice will be sent to:</p>
//                             </div>
//                             <p className="font-medium text-gray-800 text-center mb-3">{userEmail}</p>
//                             <div className="flex justify-center mb-3">
//                               <img 
//                                 src={qrImg} 
//                                 alt="UPI QR Code" 
//                                 className="h-40 w-40 object-contain border border-gray-200 rounded"
//                               />
//                             </div>
//                             <p className="text-center text-xs text-gray-500">
//                               UPI ID: carziholidays@upi
//                             </p>
//                           </div>
                          
//                           <div className="space-y-4">
//                             <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
//                               <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
//                               <div className="space-y-2">
//                                 <div className="flex justify-between text-sm">
//                                   <span className="text-gray-500">Total Amount:</span>
//                                   <span className="font-medium text-lg">₹{price || '0'}</span>
//                                 </div>
//                               </div>
//                             </div>
                            
//                             <button
//                               onClick={handlePaymentDone}
//                               disabled={sendingInvoice}
//                               className={`w-full ${
//                                 sendingInvoice 
//                                   ? 'bg-gray-400 cursor-not-allowed' 
//                                   : 'bg-green-500 hover:bg-green-600'
//                               } text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2`}
//                             >
//                               {sendingInvoice ? (
//                                 <>
//                                   <FaSpinner className="animate-spin" />
//                                   Sending Invoice...
//                                 </>
//                               ) : (
//                                 <>
//                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                                   </svg>
//                                   I've Made the Payment
//                                 </>
//                               )}
//                             </button>
                            
//                             <div className="text-xs text-gray-500 text-center">
//                               <p>After payment, you'll be asked to share your live location.</p>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
//                     <FaSpinner className="h-6 w-6 text-blue-600 animate-spin" />
//                   </div>
//                   <h3 className="mt-2 text-lg font-medium text-gray-900">
//                     Processing your booking...
//                   </h3>
//                 </div>
//               )}

//               {/* Trip Details */}
//               <div className="border-t border-gray-200 pt-6">
//                 <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Details</h3>
//                 <div className="bg-gray-50 p-4 rounded-lg">
//                   <div className="space-y-4">
//                     <div className="flex items-start">
//                       <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3"></div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">Pickup</p>
//                         <p className="text-sm text-gray-500">{pickupSublocality || pickupCity}</p>
//                       </div>
//                     </div>
                    
//                     <div className="flex items-start">
//                       <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3"></div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">Destination</p>
//                         <p className="text-sm text-gray-500">{destinationSublocality || destinationCity}</p>
//                       </div>
//                     </div>
                    
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="flex items-start">
//                         <FaCar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">Vehicle</p>
//                           <p className="text-sm text-gray-500">{car?.name || 'Standard Car'}</p>
//                         </div>
//                       </div>
                      
//                       <div className="flex items-start">
//                         <FaUser className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">Passengers</p>
//                           <p className="text-sm text-gray-500">{passengerCount}</p>
//                         </div>
//                       </div>
//                     </div>
                    
//                     {isScheduled && rideDate && (
//                       <div className="flex items-start">
//                         <FaCalendarAlt className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
//                         <div>
//                           <p className="text-sm font-medium text-gray-900">Scheduled Time</p>
//                           <p className="text-sm text-gray-500">{rideDate} at {rideTime}</p>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   // Show FindingDriver component when searching for a driver
//   if (isFindingDriver) {
//     return (
//       <FindingDriver
//         bookingId={bookingId}
//         isHoliday={true}
//         onDriverFound={(data) => handleDriverAssigned(data)}
//         onTimeout={() => {
//           handleDriverSearchTimeout();
//           setIsFindingDriver(false);
//         }}
//       />
//     );
//   }

//   // Default state: Ride requested, waiting for driver
//   return (
//     <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//         <div className="flex flex-col items-center mb-6">
//           <div className="flex justify-center mb-4">
//             <FaCheckCircle className="text-green-500 text-6xl" />
//           </div>
//           <h2 className="text-3xl font-bold mb-2 text-green-600">Ride Requested!</h2>
//           <p className="text-gray-600 mb-6">We're finding you the best available driver...</p>
//         </div>

//         <div className="bg-blue-50 p-4 rounded-lg mb-6">
//           <div className="flex items-center justify-center space-x-4 mb-3">
//             <FaSpinner className="animate-spin text-blue-500 text-2xl" />
//             <span className="font-medium text-blue-700">
//               {bookingStatus === "pending" ? "Waiting for driver" : `Status: ${bookingStatus}`}
//             </span>
//           </div>
//           <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
          
//           <div className="bg-gray-50 p-4 rounded-lg text-left mt-4">
//             <h3 className="font-semibold mb-2">Trip Summary:</h3>
//             <div className="space-y-1 text-sm text-gray-700">
//               <p><strong>From:</strong> {pickupCity}</p>
//               <p><strong>To:</strong> {destinationCity}</p>
//               <p><strong>Distance:</strong> {distance ? `${distance.toFixed(2)} km` : 'N/A'}</p>
//               <p><strong>Passengers:</strong> {passengerCount}</p>
//               <p><strong>Duration:</strong> {days} Day{days > 1 ? 's' : ''}</p>
//               <p className="text-green-600 font-bold"><strong>Fare:</strong> ₹{price ? Number(price).toFixed(2) : '0.00'}</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default BookingForm;

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "@config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  doc, 
  getDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import FindingDriver from "./booking/FindingDriver";
import TermsAndCancellationPolicy from "./TermsAndCancellationPolicy"; // <-- NEW IMPORT
import {
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaPhone,
  FaCar,
  FaClock,
  FaFileInvoice,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaShareAlt,
  FaShieldAlt  // <-- NEW ICON for Terms button
} from "react-icons/fa";
import qrImg from "../assets/images/Qrpayment.jpg";

function BookingForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { 
    car, 
    pickupCity, 
    destinationCity, 
    price,          // legacy fallback
    totalPrice,     // ✅ correct field from OutstationPage
    basePrice,      // ✅ base fare without GST
    gstAmount,      // ✅ GST portion
    distance, 
    passengerCount, 
    days, 
    pickupSublocality, 
    destinationSublocality,
    bookingId,
    requiresLogin: propRequiresLogin = false,
    vehicleCapacity,
    rideType,
    rideDate,
    rideTime,
    scheduledDateTime,
    isScheduled
  } = state || {};

  // Resolve final price — prefer totalPrice, fall back to price
  const resolvedPrice    = totalPrice    || price || 0;
  const resolvedBase     = basePrice     || price || 0;
  const resolvedGst      = gstAmount     || 0;

  const requiresLogin = propRequiresLogin || false;

  const [bookingStatus, setBookingStatus] = useState("pending");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState("5-10 minutes");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedBookingData, setSavedBookingData] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFindingDriver, setIsFindingDriver] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // ─── NEW: Terms & Conditions state ───────────────────────────────────────
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  // ─────────────────────────────────────────────────────────────────────────

  const audioContextRef = useRef(null);
  const audioElementRef = useRef(null);
  const bookingDataRef = useRef(null);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  // Get user email and name
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setAuthChecked(true);
      if (user) {
        setUserEmail(user.email || "");
        setUserName(user.displayName || user.email?.split('@')[0] || "Customer");
      }
    });
    return () => unsubscribe();
  }, []);

  // Clean up location watcher on unmount
  useEffect(() => {
    return () => {
      if (locationWatchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId]);

  // Function to request location sharing
  const requestLocationSharing = async () => {
    if (!bookingId) {
      console.error("No booking ID available");
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn("Geolocation is not supported by this browser");
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
          locationSkipped: true,
          waitingForLocation: false,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating location skipped status:", error);
      }
      navigate(`/track-outstation/${bookingId}`);
      return;
    }

    const shouldShare = window.confirm(
      'To provide better service and allow your driver to reach you easily, would you like to share your live location? (Recommended)\n\nClick "OK" to share your live location, or "Cancel" to skip.'
    );
    
    if (shouldShare) {
      setIsSharingLocation(true);
      await startLocationSharing();
    } else {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
          locationSkipped: true,
          waitingForLocation: false,
          updatedAt: serverTimestamp()
        });
        console.log("User skipped location sharing");
      } catch (error) {
        console.error("Error updating location skipped status:", error);
      }
      navigate(`/track-outstation/${bookingId}`);
    }
  };

  // Function to start location sharing
  const startLocationSharing = async () => {
    if (!bookingId) {
      console.error("No booking ID available");
      setIsSharingLocation(false);
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || null
      };

      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        userLocation: location,
        userLocationUpdatedAt: serverTimestamp(),
        locationShared: true,
        waitingForLocation: false,
        updatedAt: serverTimestamp()
      });

      console.log("✅ Initial location shared");
      setLocationPermissionGranted(true);
      startContinuousLocationTracking(bookingRef);
      navigate(`/track-outstation/${bookingId}`);

    } catch (error) {
      console.error("Location error:", error);
      setLocationError("Unable to get location. You can still track your ride.");
      
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
          locationSkipped: true,
          waitingForLocation: false,
          locationError: error.message,
          updatedAt: serverTimestamp()
        });
      } catch (firestoreError) {
        console.error("Error updating location error status:", firestoreError);
      }
      navigate(`/track-outstation/${bookingId}`);
    } finally {
      setIsSharingLocation(false);
    }
  };

  // Function for continuous location tracking
  const startContinuousLocationTracking = (bookingRef) => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not available for continuous tracking");
      return;
    }

    let locationBuffer = null;
    const updateInterval = 5000;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || null
        };
        locationBuffer = location;
      },
      (error) => {
        console.error("Continuous location error:", error);
        setLocationError("Location sharing stopped");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000
      }
    );

    setLocationWatchId(watchId);

    const intervalId = setInterval(async () => {
      if (locationBuffer && bookingRef) {
        try {
          await updateDoc(bookingRef, {
            userLocation: locationBuffer,
            userLocationUpdatedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          console.log("📍 Location updated");
          locationBuffer = null;
        } catch (error) {
          console.error("Error updating location:", error);
        }
      }
    }, updateInterval);

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  };

  // Function to send invoice email
  const sendInvoiceEmail = async () => {
    if (!userEmail) {
      console.error("No user email available");
      return false;
    }

    setSendingInvoice(true);
    try {
      const invoiceData = {
        to: userEmail,
        customerName: userName,
        bookingId: bookingId,
        vehicleType: car?.name || "Outstation Vehicle",
        vehicleCapacity: vehicleCapacity || car?.capacity || 4,
        pickup: pickupSublocality || pickupCity,
        destination: destinationSublocality || destinationCity,
        travelDate: rideDate || new Date().toLocaleDateString(),
        time: rideTime || new Date().toLocaleTimeString(),
        passengerCount: passengerCount || 1,
        days: days || 1,
        distance: distance || 0,
        // ✅ FIXED: use totalPrice / basePrice / gstAmount from OutstationPage
        price: resolvedPrice,
        basePrice: resolvedBase,
        gstAmount: resolvedGst,
        totalPrice: resolvedPrice,
      };

      const response = await fetch(
        "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendOutstationInvoice",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(invoiceData),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setInvoiceSent(true);
        return true;
      } else {
        console.error("Failed to send invoice:", result.error);
        return false;
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      return false;
    } finally {
      setSendingInvoice(false);
    }
  };

  // Handle driver assignment
  const handleDriverAssigned = useCallback(async (bookingData) => {
    try {
      console.log('Driver assigned - received data:', bookingData);
      
      const driverInfo = bookingData.driverInfo || bookingData.assignedDriver || {
        id: bookingData.driverId,
        name: bookingData.driverName || 'Your Driver',
        phone: bookingData.driverPhone || 'Not available',
        vehicle: bookingData.vehicle || { name: 'Standard Vehicle' },
        photoURL: bookingData.driverPhotoURL || null,
        rating: bookingData.driverRating || 4.5,
        totalRides: bookingData.driverTotalRides || 0
      };
      
      setDriverDetails(driverInfo);
      setBookingStatus('driver_assigned');
      setIsFindingDriver(false);
      
      if (bookingData.id && bookingData.status !== 'driver_assigned') {
        try {
          await updateDoc(doc(db, 'bookings', bookingData.id), {
            status: 'driver_assigned',
            updatedAt: serverTimestamp(),
            driverId: driverInfo.id,
            driverName: driverInfo.name,
            driverPhone: driverInfo.phone,
            driverPhotoURL: driverInfo.photoURL,
            driverRating: driverInfo.rating,
            driverTotalRides: driverInfo.totalRides,
            vehicle: driverInfo.vehicle
          });
        } catch (error) {
          console.error('Error updating booking status:', error);
        }
      }
      
    } catch (error) {
      console.error('Error in handleDriverAssigned:', error);
      setError('Failed to process driver assignment.');
      setBookingStatus('error');
    }
  }, []);

  // Handle driver search timeout
  const handleDriverSearchTimeout = async () => {
    setError("We couldn't find a driver in time. Please try again.");
    setBookingStatus("timeout");
    
    if (bookingId) {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
          status: "timeout",
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        console.error("Error updating booking status:", error);
      }
    }
  };

  // ─── NEW: Open terms modal (called when user clicks "I've Made the Payment") ──
  const handleOpenTermsForPayment = () => {
    if (!termsAccepted) {
      setShowTermsModal(true);
    } else {
      handlePaymentDone();
    }
  };

  // ─── NEW: Called when user accepts terms inside the modal ─────────────────
  const handleTermsAccepted = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    handlePaymentDone();
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Handle payment completion
  const handlePaymentDone = async () => {
    if (!auth.currentUser) {
      const bookingData = {
        car,
        pickupCity,
        destinationCity,
        price,
        distance,
        passengerCount: passengerCount || 1,
        days: days || 1,
        pickupSublocality: pickupSublocality || '',
        destinationSublocality: destinationSublocality || '',
        isHolidayPackage: true,
        location: location.state?.location || {},
        dateRange: location.state?.dateRange || {},
        searchQuery: location.state?.searchQuery || "",
        requiresLogin: false,
        vehicleCapacity,
        rideType,
        rideDate,
        rideTime
      };
      
      localStorage.setItem('pendingHolidayBooking', JSON.stringify(bookingData));
      
      navigate('/login', { 
        state: { 
          from: { 
            pathname: '/book',
            state: bookingData
          },
          message: 'Please log in to complete your payment'
        },
        replace: true
      });
      return;
    }
    
    setSendingInvoice(true);
    
    const invoiceSentResult = await sendInvoiceEmail();
    
    if (invoiceSentResult) {
      setPaymentSuccess(true);
      
      if (bookingId) {
        try {
          const bookingRef = doc(db, "bookings", bookingId);
          await updateDoc(bookingRef, {
            status: "payment_confirmed",
            paymentStatus: "paid",
            paymentDate: serverTimestamp(),
            invoiceSent: true,
            waitingForLocation: true,
            updatedAt: serverTimestamp()
          });
          
          console.log("✅ Booking marked as payment_confirmed");
          
          try {
            const holidayBookingRef = doc(db, "holidayBookings", bookingId);
            const holidayDoc = await getDoc(holidayBookingRef);
            if (holidayDoc.exists()) {
              await updateDoc(holidayBookingRef, {
                status: "completed",
                paymentStatus: "paid",
                paymentDate: serverTimestamp(),
                invoiceSent: true
              });
            }
          } catch (error) {
            console.log("No holiday booking found, continuing...");
          }
          
          setTimeout(() => {
            requestLocationSharing();
          }, 1000);
          
        } catch (error) {
          console.error("❌ Error updating booking status:", error);
          alert("Payment recorded but failed to update booking. Please contact support.");
          setPaymentSuccess(true);
        }
      }
      
    } else {
      alert("Payment recorded but failed to send invoice. Please contact support.");
      setPaymentSuccess(true);
    }
  };

  // Listen to booking updates
  useEffect(() => {
    if (!bookingId) return;

    let unsubscribe;
    
    const setupListener = async () => {
      const bookingsRef = doc(db, "bookings", bookingId);
      const holidayBookingsRef = doc(db, "holidayBookings", bookingId);
      
      const [bookingDoc, holidayDoc] = await Promise.all([
        getDoc(bookingsRef),
        getDoc(holidayBookingsRef)
      ]);
      
      let bookingRef;
      let bookingData;
      
      if (bookingDoc.exists()) {
        bookingRef = bookingsRef;
        bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
      } else if (holidayDoc.exists()) {
        bookingRef = holidayBookingsRef;
        bookingData = { id: holidayDoc.id, ...holidayDoc.data() };
      } else {
        console.error("Booking not found");
        return;
      }
      
      unsubscribe = onSnapshot(bookingRef, (docSnap) => {
        if (!docSnap.exists()) return;
        
        const data = { id: docSnap.id, ...docSnap.data() };
        const currentStatus = data.status || "pending";
        setBookingStatus(currentStatus);
        
        const hasDriverInfo = data.driverId || data.driverName || data.driverInfo;
        
        if (hasDriverInfo) {
          const driverInfo = data.driverInfo || {};
          const vehicleInfo = driverInfo.vehicle || {};
          
          const formattedDriverData = {
            id: data.driverId || driverInfo.id || 'unknown',
            name: data.driverName || driverInfo.name || 'Driver',
            phone: data.driverPhone || driverInfo.phone || 'Not provided',
            photoURL: data.driverPhotoURL || driverInfo.photoURL || null,
            status: data.status === 'driver_assigned' ? 'On the way' : data.status,
            vehicle: {
              type: data.vehicleType || vehicleInfo.type || 'Car',
              model: data.vehicleModel || vehicleInfo.model || 'Standard',
              number: data.vehicleNumber || vehicleInfo.number || 'N/A'
            },
            rating: data.driverRating || driverInfo.rating || 5,
            totalRides: data.totalRides || driverInfo.totalRides || 0
          };
          
          setDriverDetails(formattedDriverData);
          
          if (data.status === 'driver_assigned') {
            setEstimatedArrival("5-10 minutes");
            setBookingStatus('driver_assigned');
          }
        }
      });
    };
    
    setupListener();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [bookingId]);

  // Show login prompt for unauthenticated users
  if (authChecked && !isAuthenticated && requiresLogin) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please <button 
                  onClick={() => navigate('/login', { state: { from: location } })}
                  className="font-medium text-yellow-700 underline hover:text-yellow-600"
                >
                  log in
                </button> to complete your booking.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle missing state
  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Booking Details Found</h2>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Show location sharing modal after payment
  if (paymentSuccess && !isSharingLocation) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <FaShareAlt className="text-blue-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Share Your Live Location</h2>
            <p className="text-gray-600 mb-4">
              Help your driver find you easily by sharing your live location.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
              <div className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-700">Benefits:</h3>
                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                    <li>• Driver sees your exact pickup location</li>
                    <li>• Real-time tracking on map</li>
                    <li>• Accurate ETA calculations</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={requestLocationSharing}
                disabled={isSharingLocation}
                className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 ${
                  isSharingLocation 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white transition-colors`}
              >
                {isSharingLocation ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Setting up location sharing...</span>
                  </>
                ) : (
                  <>
                    <FaShareAlt />
                    <span>Share My Live Location</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  if (bookingId) {
                    const bookingRef = doc(db, "bookings", bookingId);
                    updateDoc(bookingRef, {
                      locationSkipped: true,
                      waitingForLocation: false,
                      updatedAt: serverTimestamp()
                    }).catch(console.error);
                  }
                  navigate(`/track-outstation/${bookingId}`);
                }}
                className="w-full py-3 px-4 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Skip Location Sharing
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // State 1: Driver assigned, payment completed
  if (paymentSuccess && driverDetails) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="text-center mb-6">
            <FaCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Invoice has been sent to your email.</p>
            
            {invoiceSent && (
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <FaEnvelope />
                  <span>Invoice sent to {userEmail}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <button
              onClick={() => navigate(`/track-outstation/${bookingId}`)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              Go to Live Tracking
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Driver assigned, waiting for payment
  if (bookingStatus === "driver_assigned" && !paymentSuccess) {
    return (
      <>
        {/* ─── Terms & Cancellation Modal ────────────────────────────────── */}
        {showTermsModal && (
          <TermsAndCancellationPolicy
            onAccept={handleTermsAccepted}
            onClose={() => setShowTermsModal(false)}
          />
        )}
        {/* ─────────────────────────────────────────────────────────────── */}

        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Driver Assigned!</h2>
                  {isScheduled && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                      Scheduled Trip
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-5">
                {driverDetails ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Your Driver is on the way!</h3>
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                      <div className="flex-shrink-0">
                        {driverDetails.photoURL ? (
                          <img 
                            className="h-16 w-16 rounded-full object-cover" 
                            src={driverDetails.photoURL} 
                            alt={driverDetails.name}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <FaUser className="h-8 w-8 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">{driverDetails.name}</h4>
                          {driverDetails.rating && (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ {parseFloat(driverDetails.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex items-center">
                            <FaCar className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="text-sm text-gray-600">
                              {driverDetails.vehicle?.type || 'Car'}
                              {driverDetails.vehicle?.model && ` • ${driverDetails.vehicle.model}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <FaClock className="h-5 w-5 text-yellow-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Estimated Arrival</p>
                          <p className="text-sm text-yellow-700">{estimatedArrival}</p>
                        </div>
                      </div>
                    </div>

                    {/* ─── Payment Section ─────────────────────────────────── */}
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-full">
                            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4">
                              <div className="flex items-center mb-3">
                                <FaFileInvoice className="text-blue-500 mr-2" />
                                <p className="text-sm text-gray-600">Invoice will be sent to:</p>
                              </div>
                              <p className="font-medium text-gray-800 text-center mb-3">{userEmail}</p>
                              <div className="flex justify-center mb-3">
                                <img 
                                  src={qrImg} 
                                  alt="UPI QR Code" 
                                  className="h-40 w-40 object-contain border border-gray-200 rounded"
                                />
                              </div>
                              <p className="text-center text-xs text-gray-500">
                                UPI ID: carziholidays@upi
                              </p>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-2">Payment Details</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Base Fare:</span>
                                    <span className="text-gray-700">₹{resolvedBase}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">GST (5%):</span>
                                    <span className="text-gray-700">₹{resolvedGst}</span>
                                  </div>
                                  <div className="flex justify-between text-sm border-t border-orange-200 pt-2 mt-1">
                                    <span className="font-bold text-gray-800">Total Amount:</span>
                                    <span className="font-bold text-lg text-orange-600">₹{resolvedPrice}</span>
                                  </div>
                                </div>
                              </div>

                              {/* ─── Terms preview strip (orange) ────────────── */}
                              {!termsAccepted && (
                                <div
                                  onClick={() => setShowTermsModal(true)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px 16px",
                                    borderRadius: "12px",
                                    background: "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                    border: "1.5px solid #fdba74",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "#f97316";
                                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(234,88,12,0.12)";
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "#fdba74";
                                    e.currentTarget.style.boxShadow = "none";
                                  }}
                                >
                                  <div style={{
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #ea580c, #f97316)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "18px",
                                    boxShadow: "0 3px 10px rgba(234,88,12,0.3)",
                                  }}>
                                    🛡️
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "700", fontSize: "13px", color: "#7c2d12" }}>
                                      Review Terms & Cancellation Policy
                                    </div>
                                    <div style={{ fontSize: "11.5px", color: "#c2410c", marginTop: "2px", opacity: 0.85 }}>
                                      Required before payment • Tap to view refund rules
                                    </div>
                                  </div>
                                  <div style={{
                                    fontSize: "11px",
                                    color: "#ffffff",
                                    fontWeight: "700",
                                    background: "linear-gradient(135deg, #ea580c, #f97316)",
                                    padding: "4px 12px",
                                    borderRadius: "100px",
                                    boxShadow: "0 2px 6px rgba(234,88,12,0.3)",
                                  }}>
                                    View →
                                  </div>
                                </div>
                              )}

                              {/* ─── Terms accepted badge (orange) ───────────── */}
                              {termsAccepted && (
                                <div style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  padding: "12px 16px",
                                  borderRadius: "12px",
                                  background: "#fff7ed",
                                  border: "1.5px solid #fb923c",
                                }}>
                                  <div style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    background: "linear-gradient(135deg, #ea580c, #f97316)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    boxShadow: "0 2px 8px rgba(234,88,12,0.3)",
                                  }}>
                                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </div>
                                  <span style={{ fontSize: "13px", color: "#7c2d12", fontWeight: "700" }}>
                                    Terms & Cancellation Policy accepted
                                  </span>
                                  <button
                                    onClick={() => setShowTermsModal(true)}
                                    style={{
                                      marginLeft: "auto",
                                      fontSize: "11px",
                                      color: "#ea580c",
                                      background: "none",
                                      border: "none",
                                      cursor: "pointer",
                                      textDecoration: "underline",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Review
                                  </button>
                                </div>
                              )}
                              {/* ──────────────────────────────────────────────── */}
                              
                              <button
                                onClick={handleOpenTermsForPayment}
                                disabled={sendingInvoice}
                                className={`w-full ${
                                  sendingInvoice 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-green-500 hover:bg-green-600'
                                } text-white font-medium py-3 px-4 rounded-lg shadow-sm transition flex items-center justify-center gap-2`}
                              >
                                {sendingInvoice ? (
                                  <>
                                    <FaSpinner className="animate-spin" />
                                    Sending Invoice...
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    I've Made the Payment
                                  </>
                                )}
                              </button>
                              
                              <div className="text-xs text-gray-500 text-center">
                                <p>After payment, you'll be asked to share your live location.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                      <FaSpinner className="h-6 w-6 text-blue-600 animate-spin" />
                    </div>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">
                      Processing your booking...
                    </h3>
                  </div>
                )}

                {/* Trip Details */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Trip Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Pickup</p>
                          <p className="text-sm text-gray-500">{pickupSublocality || pickupCity}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Destination</p>
                          <p className="text-sm text-gray-500">{destinationSublocality || destinationCity}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <FaCar className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Vehicle</p>
                            <p className="text-sm text-gray-500">{car?.name || 'Standard Car'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <FaUser className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Passengers</p>
                            <p className="text-sm text-gray-500">{passengerCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      {isScheduled && rideDate && (
                        <div className="flex items-start">
                          <FaCalendarAlt className="h-4 w-4 text-gray-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Scheduled Time</p>
                            <p className="text-sm text-gray-500">{rideDate} at {rideTime}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Show FindingDriver component when searching for a driver
  if (isFindingDriver) {
    return (
      <FindingDriver
        bookingId={bookingId}
        isHoliday={true}
        onDriverFound={(data) => handleDriverAssigned(data)}
        onTimeout={() => {
          handleDriverSearchTimeout();
          setIsFindingDriver(false);
        }}
      />
    );
  }

  // Default state: Ride requested, waiting for driver
  return (
    <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="flex justify-center mb-4">
            <FaCheckCircle className="text-green-500 text-6xl" />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-green-600">Ride Requested!</h2>
          <p className="text-gray-600 mb-6">We're finding you the best available driver...</p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
            <span className="font-medium text-blue-700">
              {bookingStatus === "pending" ? "Waiting for driver" : `Status: ${bookingStatus}`}
            </span>
          </div>
          <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg text-left mt-4">
            <h3 className="font-semibold mb-2">Trip Summary:</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>From:</strong> {pickupSublocality || pickupCity}</p>
              <p><strong>To:</strong> {destinationSublocality || destinationCity}</p>
              <p><strong>Distance:</strong> {distance ? `${distance.toFixed(2)} km` : 'N/A'}</p>
              <p><strong>Passengers:</strong> {passengerCount}</p>
              <p><strong>Duration:</strong> {days} Day{days > 1 ? 's' : ''}</p>
              <p className="text-orange-600 font-bold"><strong>Fare:</strong> ₹{resolvedPrice ? Number(resolvedPrice).toFixed(2) : '0.00'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;