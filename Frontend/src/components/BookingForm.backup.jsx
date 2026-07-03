// import { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { auth, db } from "@config/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, setDoc, serverTimestamp, collection, onSnapshot } from "firebase/firestore";
// import { FaCheckCircle, FaSpinner, FaUser, FaPhone, FaCar } from "react-icons/fa";

// export default function BookingForm() {
//   const { state } = useLocation();
//   const { car, pickup, destination, passengerCount, days, distance, price } = state || {};
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [bookingSuccess, setBookingSuccess] = useState(false);
//   const [bookingId, setBookingId] = useState(null);
//   const [bookingStatus, setBookingStatus] = useState('pending');
//   const [driverDetails, setDriverDetails] = useState(null);

//   // Check if user is authenticated
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         navigate('/login', { state: { from: 'booking' } });
//       }
//     });
//     return () => unsubscribe();
//   }, [navigate]);

//   if (!state || !pickup || !destination) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <p className="text-center text-red-500 font-semibold text-lg mb-4">
//           No booking details provided. Please select pickup and destination locations.
//         </p>
//         <button 
//           onClick={() => navigate('/')} 
//           className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
//         >
//           Return to Home
//         </button>
//       </div>
//     );
//   }

//   const handleConfirmBooking = async () => {
//     if (!pickup || !destination) {
//       alert("Please select both pickup and destination locations.");
//       return;
//     }

//     if (!auth.currentUser) {
//       navigate('/login', { state: { from: 'booking' } });
//       return;
//     }

//     try {
//       setIsLoading(true);
      
//       // Create a new booking document in Firestore
//       const bookingData = {
//         from: pickup,
//         to: destination,
//         status: 'pending',
//         createdAt: serverTimestamp(),
//         vehicleType: car?.type || 'Standard',
//         passengerCount: passengerCount || 1,
//         price: price || 0,
//         driverId: null,
//         userId: auth.currentUser.uid,
//         customerName: auth.currentUser.displayName || 'Guest',
//         email: auth.currentUser.email || '',
//         contact: auth.currentUser.phoneNumber || ''
//       };

//       // Add a new document with a generated ID
//       const bookingRef = doc(collection(db, 'bookings'));
//       await setDoc(bookingRef, bookingData);
      
//       // Store the booking ID for reference
//       setBookingId(bookingRef.id);
//       setBookingSuccess(true);
      
//       // Set up real-time listener for booking updates
//       const unsubscribe = onSnapshot(bookingRef, 
//         (docSnapshot) => {
//           console.log('Booking document updated:', docSnapshot.id, docSnapshot.data());
//           if (docSnapshot.exists()) {
//             const data = docSnapshot.data();
//             console.log('Booking data:', data);
//             setBookingStatus(data.status || 'pending');
            
//             // If driver is assigned, fetch driver details
//             if (data.driverId) {
//               console.log('Driver assigned, fetching driver details for ID:', data.driverId);
//               const driverRef = doc(db, 'drivers', data.driverId);
//               const driverUnsubscribe = onSnapshot(
//                 driverRef,
//                 (driverDoc) => {
//                   console.log('Driver document updated:', driverDoc.id, driverDoc.exists() ? driverDoc.data() : 'Does not exist');
//                   if (driverDoc.exists()) {
//                     const driverData = driverDoc.data();
//                     console.log('Driver data:', driverData);
//                     setDriverDetails({
//                       name: driverData.name || 'Driver',
//                       phone: driverData.phone || 'Not available',
//                       vehicle: driverData.vehicleDetails || {}
//                     });
//                   }
//                 },
//                 (error) => {
//                   console.error('Error in driver listener:', error);
//                 }
//               );
              
//               // Clean up driver listener when component unmounts
//               return () => {
//                 console.log('Cleaning up driver listener');
//                 driverUnsubscribe();
//               };
//             }
//           }
//         },
//         (error) => {
//           console.error('Error in booking listener:', error);
//         }
//       );
      
//       // Cleanup listener on component unmount
//       return () => {
//         console.log('Cleaning up booking listener');
//         unsubscribe();
//       };
      
//     } catch (error) {
//       console.error("Error creating booking:", error);
//       alert("Failed to create booking. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Debug information
//   useEffect(() => {
//     console.log('Current booking status:', bookingStatus);
//     console.log('Driver details:', driverDetails);
//   }, [bookingStatus, driverDetails]);

//   if (bookingSuccess) {
//     return (
//       <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//           {bookingStatus === 'accepted' && driverDetails ? (
//             <>
//               <div className="bg-green-50 p-6 rounded-lg mb-6">
//                 <div className="flex justify-center mb-4">
//                   <FaCheckCircle className="text-green-500 text-6xl" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2 text-green-600">Driver Assigned!</h2>
//                 <p className="text-gray-600 mb-4">Your driver is on the way</p>
                
//                 <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
//                   <div className="flex items-center space-x-3 mb-3">
//                     <div className="bg-green-100 p-3 rounded-full">
//                       <FaUser className="text-green-600 text-xl" />
//                     </div>
//                     <div className="text-left">
//                       <h3 className="font-semibold text-lg">{driverDetails.name}</h3>
//                       <div className="flex items-center text-gray-600 text-sm">
//                         <FaCar className="mr-1" />
//                         <span>{driverDetails.vehicle.model || 'Car'} • {driverDetails.vehicle.number || 'NA'}</span>
//                       </div>
//                     </div>
//                   </div>
                  
//                   <a 
//                     href={`tel:${driverDetails.phone}`}
//                     className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors"
//                   >
//                     <FaPhone />
//                     <span>Call Driver</span>
//                   </a>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="flex justify-center mb-6">
//                 <FaCheckCircle className="text-green-500 text-6xl" />
//               </div>
//               <h2 className="text-3xl font-bold mb-4 text-green-600">Ride Requested!</h2>
//               <p className="text-gray-600 mb-6">We're finding you the best available driver. Please wait...</p>
              
//               <div className="bg-blue-50 p-4 rounded-lg mb-6">
//                 <div className="flex items-center justify-center space-x-4 mb-3">
//                   <FaSpinner className="animate-spin text-blue-500 text-2xl" />
//                   <span className="font-medium text-blue-700">
//                     {bookingStatus === 'pending' 
//                       ? 'Waiting for driver to accept' 
//                       : 'Processing your request...'}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
//               </div>
//             </>
//           )}
          
//           {/* Driver Details Section */}
//           {driverDetails && bookingStatus === 'accepted' && (
//             <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
//               <h3 className="font-semibold text-lg text-blue-800 mb-3">Your Driver</h3>
//               <div className="flex items-start space-x-4">
//                 <div className="bg-blue-100 p-3 rounded-full">
//                   <FaUser className="text-blue-600 text-xl" />
//                 </div>
//                 <div className="flex-1">
//                   <h4 className="font-medium text-gray-900">{driverDetails.name}</h4>
//                   <div className="mt-2 space-y-2">
//                     <div className="flex items-center text-sm text-gray-600">
//                       <FaPhone className="mr-2 text-blue-600" />
//                       <a href={`tel:${driverDetails.phone}`} className="hover:text-blue-600 hover:underline">
//                         {driverDetails.phone}
//                       </a>
//                     </div>
//                     {driverDetails.vehicle && (
//                       <div className="flex items-center text-sm text-gray-600">
//                         <FaCar className="mr-2 text-blue-600" />
//                         <span>
//                           {driverDetails.vehicle.make || 'Car'} {driverDetails.vehicle.model || ''} 
//                           {driverDetails.vehicle.color ? `(${driverDetails.vehicle.color})` : ''}
//                         </span>
//                       </div>
//                     )}
//                     {driverDetails.vehicle && driverDetails.vehicle.plateNumber && (
//                       <div className="text-xs text-gray-500 mt-1">
//                         License Plate: {driverDetails.vehicle.plateNumber}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}
          
//           <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6">
//             <h3 className="font-semibold text-gray-700">Trip Details</h3>
//             <div className="flex items-center">
//               <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//               <p className="text-gray-700">{pickup}</p>
//             </div>
//             <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
//             <div className="flex items-center">
//               <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
//               <p className="text-gray-700">{destination}</p>
//             </div>
//           </div>
          
//           <button
//             onClick={() => navigate('/my-bookings')}
//             className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium"
//           >
//             View My Bookings
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-6 flex justify-center items-start bg-gray-100">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full mt-10">
//         <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
//           Confirm Your Booking
//         </h2>

//         <div className="space-y-6">
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h3 className="font-semibold text-lg mb-2">Trip Details</h3>
//             <div className="space-y-2">
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{pickup}</p>
//               </div>
//               <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{destination}</p>
//               </div>
//             </div>
//           </div>

//           {car && (
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-lg mb-2">Vehicle Details</h3>
//               <p className="text-gray-700">{car.name} ({car.type})</p>
//               <p className="text-gray-700">Passengers: {passengerCount || 1}</p>
//               {distance && <p className="text-gray-700">Distance: {distance} km</p>}
//               {days > 1 && <p className="text-gray-700">Days: {days}</p>}
//               {price && (
//                 <p className="text-xl font-bold text-orange-600 mt-2">
//                   Total: ₹{price}
//                 </p>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleConfirmBooking}
//             disabled={isLoading}
//             className={`w-full py-3 px-4 rounded-lg transition font-semibold ${
//               isLoading 
//                 ? 'bg-gray-400 cursor-not-allowed' 
//                 : 'bg-orange-500 hover:bg-orange-600 text-white'
//             }`}
//           >
//             {isLoading ? 'Processing...' : 'Confirm Booking'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


// import { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { auth, db } from "@config/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import {
//   doc,
//   setDoc,
//   serverTimestamp,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   FaCheckCircle,
//   FaSpinner,
//   FaUser,
//   FaPhone,
//   FaCar,
// } from "react-icons/fa";
// import axios from "axios";
// import qrImg from "../assets/images/Qrpayment.jpg"; // <-- place your QR image inside src/assets/qr.png

// export default function BookingForm() {
//   const { state } = useLocation();
//   const { car, pickup, destination, passengerCount, days, distance, price } =
//     state || {};
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [bookingSuccess, setBookingSuccess] = useState(false);
//   const [bookingId, setBookingId] = useState(null);
//   const [bookingStatus, setBookingStatus] = useState("pending");
//   const [driverDetails, setDriverDetails] = useState(null);

//   // Check if user is authenticated
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         navigate("/login", { state: { from: "booking" } });
//       }
//     });
//     return () => unsubscribe();
//   }, [navigate]);

//   if (!state || !pickup || !destination) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <p className="text-center text-red-500 font-semibold text-lg mb-4">
//           No booking details provided. Please select pickup and destination
//           locations.
//         </p>
//         <button
//           onClick={() => navigate("/")}
//           className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
//         >
//           Return to Home
//         </button>
//       </div>
//     );
//   }

//   const handleConfirmBooking = async () => {
//     if (!pickup || !destination) {
//       alert("Please select both pickup and destination locations.");
//       return;
//     }

//     if (!auth.currentUser) {
//       navigate("/login", { state: { from: "booking" } });
//       return;
//     }

//     try {
//       setIsLoading(true);

//       // Create a new booking document in Firestore
//       const bookingData = {
//         from: pickup,
//         to: destination,
//         status: "pending",
//         createdAt: serverTimestamp(),
//         vehicleType: car?.type || "Standard",
//         passengerCount: passengerCount || 1,
//         price: price || 0,
//         driverId: null,
//         userId: auth.currentUser.uid,
//         customerName: auth.currentUser.displayName || "Guest",
//         email: auth.currentUser.email || "",
//         contact: auth.currentUser.phoneNumber || "",
//       };

//       // Add a new document with a generated ID
//       const bookingRef = doc(collection(db, "bookings"));
//       await setDoc(bookingRef, bookingData);

//       // Store the booking ID for reference
//       setBookingId(bookingRef.id);
//       setBookingSuccess(true);

//       // Set up real-time listener for booking updates
//       const unsubscribe = onSnapshot(
//         bookingRef,
//         (docSnapshot) => {
//           if (docSnapshot.exists()) {
//             const data = docSnapshot.data();
//             setBookingStatus(data.status || "pending");

//             // If driver is assigned, fetch driver details
//             if (data.driverId) {
//               const driverRef = doc(db, "drivers", data.driverId);
//               const driverUnsubscribe = onSnapshot(
//                 driverRef,
//                 (driverDoc) => {
//                   if (driverDoc.exists()) {
//                     const driverData = driverDoc.data();
//                     setDriverDetails({
//                       name: driverData.name || "Driver",
//                       phone: driverData.phone || "Not available",
//                       vehicle: driverData.vehicleDetails || {},
//                     });
//                   }
//                 },
//                 (error) => {
//                   console.error("Error in driver listener:", error);
//                 }
//               );

//               // Clean up driver listener when component unmounts
//               return () => driverUnsubscribe();
//             }
//           }
//         },
//         (error) => {
//           console.error("Error in booking listener:", error);
//         }
//       );

//       // Cleanup listener on component unmount
//       return () => unsubscribe();
//     } catch (error) {
//       console.error("Error creating booking:", error);
//       alert("Failed to create booking. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePaymentDone = async () => {
//     try {
//       if (!auth.currentUser) {
//         navigate("/login", { state: { from: "booking" } });
//         return;
//       }

//       await axios.post(
//   "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendInvoiceEmailV2",
//   {
//     to: auth.currentUser.email,
//     customerName: auth.currentUser.displayName || "Guest",
//     car: car?.type,
//     pickup,
//     destination,
//     passengerCount,
//     days,
//     distance,
//     price,
//     bookingId,
//     driverName: driverDetails?.name,
//     driverPhone: driverDetails?.phone,
//     driverVehicle: driverDetails?.vehicle?.model || "Car",
//   },
//   {
//     headers: {
//       "Content-Type": "application/json",
//     },
//     withCredentials: false,
//   }
// );

//       alert("Invoice sent to your email!");
//       navigate("/my-bookings");
//     } catch (error) {
//       console.error("Error sending invoice:", error);
//       alert("Failed to send invoice. Please try again.");
//     }
//   };

//   if (bookingSuccess) {
//     return (
//       <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//           {bookingStatus === "accepted" && driverDetails ? (
//             <>
//               <div className="bg-green-50 p-6 rounded-lg mb-6">
//                 <div className="flex justify-center mb-4">
//                   <FaCheckCircle className="text-green-500 text-6xl" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2 text-green-600">
//                   Driver Assigned!
//                 </h2>
//                 <p className="text-gray-600 mb-4">Your driver is on the way</p>

//                 <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
//                   <div className="flex items-center space-x-3 mb-3">
//                     <div className="bg-green-100 p-3 rounded-full">
//                       <FaUser className="text-green-600 text-xl" />
//                     </div>
//                     <div className="text-left">
//                       <h3 className="font-semibold text-lg">
//                         {driverDetails.name}
//                       </h3>
//                       <div className="flex items-center text-gray-600 text-sm">
//                         <FaCar className="mr-1" />
//                         <span>
//                           {driverDetails.vehicle.model || "Car"} •{" "}
//                           {driverDetails.vehicle.number || "NA"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <a
//                     href={`tel:${driverDetails.phone}`}
//                     className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors"
//                   >
//                     <FaPhone />
//                     <span>Call Driver</span>
//                   </a>
//                 </div>
//               </div>

//               {/* Payment Section */}
//               <div className="bg-white p-6 rounded-lg border mt-6">
//                 <h3 className="font-semibold text-lg mb-4">Payment Details</h3>

//                 <img
//                   src={qrImg}
//                   alt="QR Code"
//                   className="mx-auto w-40 h-40 mb-4 border p-2 rounded-lg shadow"
//                 />

//                 <p className="text-gray-600 text-center mb-4">
//                   Scan the QR code to pay{" "}
//                   <span className="font-bold text-orange-600">₹{price}</span>
//                 </p>

//                 <button
//                   onClick={handlePaymentDone}
//                   className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
//                 >
//                   Payment Done
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="flex justify-center mb-6">
//                 <FaCheckCircle className="text-green-500 text-6xl" />
//               </div>
//               <h2 className="text-3xl font-bold mb-4 text-green-600">
//                 Ride Requested!
//               </h2>
//               <p className="text-gray-600 mb-6">
//                 We're finding you the best available driver. Please wait...
//               </p>

//               <div className="bg-blue-50 p-4 rounded-lg mb-6">
//                 <div className="flex items-center justify-center space-x-4 mb-3">
//                   <FaSpinner className="animate-spin text-blue-500 text-2xl" />
//                   <span className="font-medium text-blue-700">
//                     {bookingStatus === "pending"
//                       ? "Waiting for driver to accept"
//                       : "Processing your request..."}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-6 flex justify-center items-start bg-gray-100">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full mt-10">
//         <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
//           Confirm Your Booking
//         </h2>

//         <div className="space-y-6">
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h3 className="font-semibold text-lg mb-2">Trip Details</h3>
//             <div className="space-y-2">
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{pickup}</p>
//               </div>
//               <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{destination}</p>
//               </div>
//             </div>
//           </div>

//           {car && (
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-lg mb-2">Vehicle Details</h3>
//               <p className="text-gray-700">
//                 {car.name} ({car.type})
//               </p>
//               <p className="text-gray-700">
//                 Passengers: {passengerCount || 1}
//               </p>
//               {distance && <p className="text-gray-700">Distance: {distance} km</p>}
//               {days > 1 && <p className="text-gray-700">Days: {days}</p>}
//               {price && (
//                 <p className="text-xl font-bold text-orange-600 mt-2">
//                   Total: ₹{price}
//                 </p>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleConfirmBooking}
//             disabled={isLoading}
//             className={`w-full py-3 px-4 rounded-lg transition font-semibold ${
//               isLoading
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-orange-500 hover:bg-orange-600 text-white"
//             }`}
//           >
//             {isLoading ? "Processing..." : "Confirm Booking"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { auth, db } from "@config/firebase";
// import { onAuthStateChanged } from "firebase/auth";
// import {
//   doc,
//   setDoc,
//   serverTimestamp,
//   collection,
//   onSnapshot,
// } from "firebase/firestore";
// import {
//   FaCheckCircle,
//   FaSpinner,
//   FaUser,
//   FaPhone,
//   FaCar,
// } from "react-icons/fa";
// import { getFunctions, httpsCallable } from "firebase/functions";
// import qrImg from "../assets/images/Qrpayment.jpg";

// export default function BookingForm() {
//   const { state } = useLocation();
//   const { car, pickup, destination, passengerCount, days, distance, price } =
//     state || {};
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const [bookingSuccess, setBookingSuccess] = useState(false);
//   const [bookingId, setBookingId] = useState(null);
//   const [bookingStatus, setBookingStatus] = useState("pending");
//   const [driverDetails, setDriverDetails] = useState(null);

//   // ✅ Initialize functions instance at component level
//   const functions = getFunctions();

//   // Check if user is authenticated
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (!user) {
//         navigate("/login", { state: { from: "booking" } });
//       }
//     });
//     return () => unsubscribe();
//   }, [navigate]);

//   if (!state || !pickup || !destination) {
//     return (
//       <div className="flex flex-col items-center justify-center min-h-screen">
//         <p className="text-center text-red-500 font-semibold text-lg mb-4">
//           No booking details provided. Please select pickup and destination
//           locations.
//         </p>
//         <button
//           onClick={() => navigate("/")}
//           className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
//         >
//           Return to Home
//         </button>
//       </div>
//     );
//   }

//   const handleConfirmBooking = async () => {
//     if (!pickup || !destination) {
//       alert("Please select both pickup and destination locations.");
//       return;
//     }

//     if (!auth.currentUser) {
//       navigate("/login", { state: { from: "booking" } });
//       return;
//     }

//     try {
//       setIsLoading(true);

//       // Create a new booking document in Firestore
//       const bookingData = {
//         from: pickup,
//         to: destination,
//         status: "pending",
//         createdAt: serverTimestamp(),
//         vehicleType: car?.type || "Standard",
//         passengerCount: passengerCount || 1,
//         price: price || 0,
//         driverId: null,
//         userId: auth.currentUser.uid,
//         customerName: auth.currentUser.displayName || "Guest",
//         email: auth.currentUser.email || "",
//         contact: auth.currentUser.phoneNumber || "",
//       };

//       // Add a new document with a generated ID
//       const bookingRef = doc(collection(db, "bookings"));
//       await setDoc(bookingRef, bookingData);

//       // Store the booking ID for reference
//       setBookingId(bookingRef.id);
//       setBookingSuccess(true);

//       // Set up real-time listener for booking updates
//       const unsubscribe = onSnapshot(
//         bookingRef,
//         (docSnapshot) => {
//           if (docSnapshot.exists()) {
//             const data = docSnapshot.data();
//             setBookingStatus(data.status || "pending");

//             // If driver is assigned, fetch driver details
//             if (data.driverId) {
//               const driverRef = doc(db, "drivers", data.driverId);
//               const driverUnsubscribe = onSnapshot(
//                 driverRef,
//                 (driverDoc) => {
//                   if (driverDoc.exists()) {
//                     const driverData = driverDoc.data();
//                     setDriverDetails({
//                       name: driverData.name || "Driver",
//                       phone: driverData.phone || "Not available",
//                       vehicle: driverData.vehicleDetails || {},
//                     });
//                   }
//                 },
//                 (error) => {
//                   console.error("Error in driver listener:", error);
//                 }
//               );

//               // Clean up driver listener when component unmounts
//               return () => driverUnsubscribe();
//             }
//           }
//         },
//         (error) => {
//           console.error("Error in booking listener:", error);
//         }
//       );

//       // Cleanup listener on component unmount
//       return () => unsubscribe();
//     } catch (error) {
//       console.error("Error creating booking:", error);
//       alert("Failed to create booking. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handlePaymentDone = async () => {
//   try {
//     if (!auth.currentUser) {
//       navigate("/login", { state: { from: "booking" } });
//       return;
//     }

//     // Set this to your real Cloud Function region and project
//     const functionUrl = "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendInvoiceEmailV2";

//     const res = await fetch(functionUrl, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         to: auth.currentUser.email,
//         customerName: auth.currentUser.displayName || "Guest",
//         car: car?.type || "Standard",
//         pickup,
//         destination,
//         passengerCount: passengerCount || 1,
//         days: days || 1,
//         distance: distance || "N/A",
//         price,
//         bookingId,
//         driverName: driverDetails?.name || "To be assigned",
//         driverPhone: driverDetails?.phone || "N/A",
//         driverVehicle: driverDetails?.vehicle?.model || "N/A",
//       }),
//     });

//     const data = await res.json();
//     if (data.success) {
//       alert("Invoice sent to your email!");
//       navigate("/my-bookings");
//     } else {
//       throw new Error(data.error || "Failed to send invoice");
//     }
//   } catch (error) {
//     console.error("Error sending invoice:", error);
//     const errorMessage = error.message || "Failed to send invoice. Please try again.";
//     alert(errorMessage);
//   }
// };


//   if (bookingSuccess) {
//     return (
//       <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
//         <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
//           {bookingStatus === "accepted" && driverDetails ? (
//             <>
//               <div className="bg-green-50 p-6 rounded-lg mb-6">
//                 <div className="flex justify-center mb-4">
//                   <FaCheckCircle className="text-green-500 text-6xl" />
//                 </div>
//                 <h2 className="text-2xl font-bold mb-2 text-green-600">
//                   Driver Assigned!
//                 </h2>
//                 <p className="text-gray-600 mb-4">Your driver is on the way</p>

//                 <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
//                   <div className="flex items-center space-x-3 mb-3">
//                     <div className="bg-green-100 p-3 rounded-full">
//                       <FaUser className="text-green-600 text-xl" />
//                     </div>
//                     <div className="text-left">
//                       <h3 className="font-semibold text-lg">
//                         {driverDetails.name}
//                       </h3>
//                       <div className="flex items-center text-gray-600 text-sm">
//                         <FaCar className="mr-1" />
//                         <span>
//                           {driverDetails.vehicle.model || "Car"} •{" "}
//                           {driverDetails.vehicle.number || "NA"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <a
//                     href={`tel:${driverDetails.phone}`}
//                     className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors"
//                   >
//                     <FaPhone />
//                     <span>Call Driver</span>
//                   </a>
//                 </div>
//               </div>

//               {/* Payment Section */}
//               <div className="bg-white p-6 rounded-lg border mt-6">
//                 <h3 className="font-semibold text-lg mb-4">Payment Details</h3>

//                 <img
//                   src={qrImg}
//                   alt="QR Code"
//                   className="mx-auto w-40 h-40 mb-4 border p-2 rounded-lg shadow"
//                 />

//                 <p className="text-gray-600 text-center mb-4">
//                   Scan the QR code to pay{" "}
//                   <span className="font-bold text-orange-600">₹{price}</span>
//                 </p>

//                 <button
//                   onClick={handlePaymentDone}
//                   className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
//                 >
//                   Payment Done
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="flex justify-center mb-6">
//                 <FaCheckCircle className="text-green-500 text-6xl" />
//               </div>
//               <h2 className="text-3xl font-bold mb-4 text-green-600">
//                 Ride Requested!
//               </h2>
//               <p className="text-gray-600 mb-6">
//                 We're finding you the best available driver. Please wait...
//               </p>

//               <div className="bg-blue-50 p-4 rounded-lg mb-6">
//                 <div className="flex items-center justify-center space-x-4 mb-3">
//                   <FaSpinner className="animate-spin text-blue-500 text-2xl" />
//                   <span className="font-medium text-blue-700">
//                     {bookingStatus === "pending"
//                       ? "Waiting for driver to accept"
//                       : "Processing your request..."}
//                   </span>
//                 </div>
//                 <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen p-6 flex justify-center items-start bg-gray-100">
//       <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full mt-10">
//         <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
//           Confirm Your Booking
//         </h2>

//         <div className="space-y-6">
//           <div className="bg-gray-50 p-4 rounded-lg">
//             <h3 className="font-semibold text-lg mb-2">Trip Details</h3>
//             <div className="space-y-2">
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{pickup}</p>
//               </div>
//               <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
//               <div className="flex items-center">
//                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
//                 <p className="text-gray-700">{destination}</p>
//               </div>
//             </div>
//           </div>

//           {car && (
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <h3 className="font-semibold text-lg mb-2">Vehicle Details</h3>
//               <p className="text-gray-700">
//                 {car.name} ({car.type})
//               </p>
//               <p className="text-gray-700">
//                 Passengers: {passengerCount || 1}
//               </p>
//               {distance && <p className="text-gray-700">Distance: {distance} km</p>}
//               {days > 1 && <p className="text-gray-700">Days: {days}</p>}
//               {price && (
//                 <p className="text-xl font-bold text-orange-600 mt-2">
//                   Total: ₹{price}
//                 </p>
//               )}
//             </div>
//           )}

//           <button
//             onClick={handleConfirmBooking}
//             disabled={isLoading}
//             className={`w-full py-3 px-4 rounded-lg transition font-semibold ${
//               isLoading
//                 ? "bg-gray-400 cursor-not-allowed"
//                 : "bg-orange-500 hover:bg-orange-600 text-white"
//             }`}
//           >
//             {isLoading ? "Processing..." : "Confirm Booking"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "@config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  FaCheckCircle,
  FaSpinner,
  FaUser,
  FaPhone,
  FaCar,
} from "react-icons/fa";
import qrImg from "../assets/images/Qrpayment.jpg";

export default function BookingForm() {
  const { state } = useLocation();
  const {
    car,
    pickupCity,
    pickupSublocality,
    pickupSublocalityAddress,
    destinationCity,
    destinationSublocality,
    destinationSublocalityAddress,
    passengerCount,
    days,
    distance,
    price,
  } = state || {};
  
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [bookingStatus, setBookingStatus] = useState("pending");
  const [driverDetails, setDriverDetails] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login", { state: { from: "booking" } });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (!state || !pickupCity || !destinationCity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-center text-red-500 font-semibold text-lg mb-4">
          No booking details provided. Please select pickup and destination locations.
        </p>
        <button
          onClick={() => navigate("/")}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const handleConfirmBooking = async () => {
    try {
      setIsLoading(true);

      const user = auth.currentUser;
      if (!user) {
        navigate("/login", { state: { from: "booking" } });
        return;
      }

      const normalizeCity = (city) => city?.split(",")[0].trim() || "";

      const bookingData = {
        from: normalizeCity(pickupCity),
        fromSublocality: pickupSublocality || null,
        pickupSublocalityAddress: pickupSublocalityAddress || pickupCity,
        to: normalizeCity(destinationCity),
        toSublocality: destinationSublocality || null,
        destinationSublocalityAddress: destinationSublocalityAddress || destinationCity,
        status: "pending",
        createdAt: serverTimestamp(),
        vehicleType: car?.type || "Standard",
        passengerCount: passengerCount || 1,
        price: price || 0,
        fare: price || 0,
        driverId: null,
        userId: user.uid,
        customerName: user.displayName || "Guest",
        email: user.email || "",
        contact: user.phoneNumber || "",
        days: days || 1,
        distance: distance || 0,
        carName: car?.name || "Standard",
      };

      const bookingRef = doc(collection(db, "bookings"));
      await setDoc(bookingRef, bookingData);

      setBookingId(bookingRef.id);
      setBookingSuccess(true);

      const unsubscribe = onSnapshot(
        bookingRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setBookingStatus(data.status || "pending");

            if (data.driverId) {
              const driverRef = doc(db, "drivers", data.driverId);
              const driverUnsubscribe = onSnapshot(
                driverRef,
                (driverDoc) => {
                  if (driverDoc.exists()) {
                    const driverData = driverDoc.data();
                    setDriverDetails({
                      name: driverData.name || "Driver",
                      phone: driverData.phone || "Not available",
                      vehicle: driverData.vehicleDetails || {},
                    });
                  }
                },
                (error) => {
                  console.error("Error in driver listener:", error);
                }
              );

              return () => driverUnsubscribe();
            }
          }
        },
        (error) => {
          console.error("Error in booking listener:", error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentDone = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/login", { state: { from: "booking" } });
        return;
      }

      const functionUrl =
        "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendInvoiceEmailV2";

      const res = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          customerName: user.displayName || "Guest",
          car: car?.name || "Standard",
          pickup: pickupCity || "",
          pickupSublocality: pickupSublocality || "",
          pickupSublocalityAddress: pickupSublocalityAddress || "",
          destination: destinationCity || "",
          destinationSublocality: destinationSublocality || "",
          destinationSublocalityAddress: destinationSublocalityAddress || "",
          passengerCount: passengerCount || 1,
          days: days || 1,
          distance: distance || "N/A",
          price,
          bookingId,
          driverName: driverDetails?.name || "To be assigned",
          driverPhone: driverDetails?.phone || "N/A",
          driverVehicle: driverDetails?.vehicle?.model || "N/A",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Invoice sent to your email!");
        navigate("/my-bookings");
      } else {
        throw new Error(data.error || "Failed to send invoice");
      }
    } catch (error) {
      console.error("Error sending invoice:", error);
      alert(error.message || "Failed to send invoice. Please try again.");
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen p-6 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center">
          {bookingStatus === "accepted" && driverDetails ? (
            <>
              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <div className="flex justify-center mb-4">
                  <FaCheckCircle className="text-green-500 text-6xl" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-green-600">
                  Driver Assigned!
                </h2>
                <p className="text-gray-600 mb-4">Your driver is on the way</p>

                <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FaUser className="text-green-600 text-xl" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{driverDetails.name}</h3>
                      <div className="flex items-center text-gray-600 text-sm">
                        <FaCar className="mr-1" />
                        <span>
                          {driverDetails.vehicle.model || "Car"} •{" "}
                          {driverDetails.vehicle.number || "NA"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${driverDetails.phone}`}
                    className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 py-2 px-4 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <FaPhone />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border mt-6">
                <h3 className="font-semibold text-lg mb-4">Payment Details</h3>

                <img
                  src={qrImg}
                  alt="QR Code"
                  className="mx-auto w-40 h-40 mb-4 border p-2 rounded-lg shadow"
                />

                <p className="text-gray-600 text-center mb-4">
                  Scan the QR code to pay{" "}
                  <span className="font-bold text-orange-600">₹{price}</span>
                </p>

                <button
                  onClick={handlePaymentDone}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Payment Done
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <FaCheckCircle className="text-green-500 text-6xl" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-green-600">Ride Requested!</h2>
              <p className="text-gray-600 mb-6">
                We're finding you the best available driver. Please wait...
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <div className="flex items-center justify-center space-x-4 mb-3">
                  <FaSpinner className="animate-spin text-blue-500 text-2xl" />
                  <span className="font-medium text-blue-700">
                    {bookingStatus === "pending"
                      ? "Waiting for driver to accept"
                      : "Processing your request..."}
                  </span>
                </div>
                <p className="text-sm text-gray-500">Booking ID: {bookingId}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-left">
                <h3 className="font-semibold mb-2">Trip Summary:</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p><strong>From:</strong> {pickupSublocality ? `${pickupSublocality}, ` : ''}{pickupCity}</p>
                  <p><strong>To:</strong> {destinationSublocality ? `${destinationSublocality}, ` : ''}{destinationCity}</p>
                  <p><strong>Distance:</strong> {distance} km</p>
                  <p><strong>Passengers:</strong> {passengerCount}</p>
                  {days > 1 && <p><strong>Days:</strong> {days}</p>}
                  <p className="text-green-600 font-bold"><strong>Fare:</strong> ₹{price}</p>
                </div>
              </div>
            </>
          )}
=======
            </>
          )}
          
          <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700">Trip Details</h3>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <p className="text-gray-700">{pickup}</p>
            </div>
            <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <p className="text-gray-700">{destination}</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/my-bookings')}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium"
          >
            View My Bookings
          </button>
>>>>>>> Stashed changes
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 flex justify-center items-start bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full mt-10">
        <h2 className="text-3xl font-bold mb-6 text-orange-600 text-center">
          Confirm Your Booking
        </h2>

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Trip Details</h3>
            <div className="space-y-2">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-2"></div>
                <div>
                  <p className="text-gray-900 font-medium">{pickupCity}</p>
                  {pickupSublocality && (
                    <p className="text-sm text-blue-600">Area: {pickupSublocality}</p>
                  )}
                </div>
              </div>
              <div className="border-l-2 border-gray-300 h-6 ml-1"></div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 mt-2"></div>
                <div>
                  <p className="text-gray-900 font-medium">{destinationCity}</p>
                  {destinationSublocality && (
                    <p className="text-sm text-orange-600">Area: {destinationSublocality}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {car && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Vehicle Details</h3>
              <p className="text-gray-700">{car.name}</p>
              <p className="text-gray-700">Passengers: {passengerCount || 1}</p>
              {distance && <p className="text-gray-700">Distance: {distance} km</p>}
              {days > 1 && <p className="text-gray-700">Days: {days}</p>}
              {price && (
                <p className="text-xl font-bold text-orange-600 mt-2">Total: ₹{price}</p>
              )}
            </div>
          )}

          <button
            onClick={handleConfirmBooking}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg transition font-semibold ${
              isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {isLoading ? "Processing..." : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}