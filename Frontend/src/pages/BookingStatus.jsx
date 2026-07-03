// import React, { useState, useEffect } from 'react';
// import { doc, onSnapshot, getDoc } from 'firebase/firestore';
// import { db } from '@config/firebase';
// import { Clock, User, Phone, Mail, Loader2, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react';

// const BookingStatus = ({ rideId }) => {
//   const [ride, setRide] = useState(null);
//   const [driver, setDriver] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Format date helper
//   const formatDate = (timestamp) => {
//     if (!timestamp?.seconds) return 'N/A';
//     return new Date(timestamp.seconds * 1000).toLocaleString('en-IN', {
//       day: 'numeric',
//       month: 'short',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // Fetch driver details when ride is accepted
//   useEffect(() => {
//     const fetchDriverDetails = async (driverId) => {
//       try {
//         const driverDoc = await getDoc(doc(db, 'drivers', driverId));
//         if (driverDoc.exists()) {
//           setDriver({ id: driverId, ...driverDoc.data() });
//         }
//       } catch (err) {
//         console.error('Error fetching driver details:', err);
//       }
//     };

//     if (ride?.driverId) {
//       fetchDriverDetails(ride.driverId);
//     }
//   }, [ride?.driverId]);

//   // Set up real-time ride status listener
//   useEffect(() => {
//     if (!rideId) {
//       setError('No ride ID provided');
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     const rideRef = doc(db, 'rides', rideId);
    
//     const unsubscribe = onSnapshot(
//       rideRef,
//       (snapshot) => {
//         if (snapshot.exists()) {
//           setRide({ id: snapshot.id, ...snapshot.data() });
//           setError(null);
//         } else {
//           setError('Ride not found');
//         }
//         setLoading(false);
//       },
//       (error) => {
//         console.error('Error getting ride:', error);
//         setError('Failed to load ride details');
//         setLoading(false);
//       }
//     );

//     // Clean up subscription on unmount
//     return () => unsubscribe();
//   }, [rideId]);

//   // Render loading state
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
//           <p className="mt-4 text-gray-600">Loading ride details...</p>
//         </div>
//       </div>
//     );
//   }

//   // Render error state
//   if (error || !ride) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="text-center p-6 bg-white rounded-lg shadow-md">
//           <XCircle className="h-12 w-12 mx-auto text-red-500" />
//           <h2 className="mt-4 text-xl font-semibold text-gray-900">Error</h2>
//           <p className="mt-2 text-gray-600">{error || 'Unable to load ride details'}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-3xl mx-auto">
//         <div className="bg-white shadow overflow-hidden sm:rounded-lg">
//           {/* Ride Status Header */}
//           <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
//             <h3 className="text-lg leading-6 font-medium text-gray-900">
//               Ride Status
//             </h3>
//             <div className="mt-2 flex items-center">
//               <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
//                 {ride.status.toUpperCase()}
//               </span>
//               <span className="ml-4 text-sm text-gray-500">
//                 <ClockIcon className="inline h-4 w-4 mr-1" />
//                 {formatDate(ride.createdAt)}
//               </span>
//             </div>
//           </div>

//           {/* Ride Details */}
//           <div className="px-4 py-5 sm:p-6">
//             <div className="space-y-6">
//               {/* Pickup and Drop */}
//               <div>
//                 <h4 className="text-sm font-medium text-gray-500">Route</h4>
//                 <div className="mt-1 space-y-2">
//                   <div className="flex items-center">
//                     <div className="h-2 w-2 rounded-full bg-green-500 mr-3"></div>
//                     <span className="font-medium">{ride.pickup}</span>
//                   </div>
//                   <div className="flex items-center">
//                     <div className="h-2 w-2 rounded-full bg-red-500 mr-3"></div>
//                     <span className="font-medium">{ride.drop}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Driver Information */}
//               {ride.status === 'accepted' && (
//                 <div>
//                   <h4 className="text-sm font-medium text-gray-500">Your Driver</h4>
//                   {driver ? (
//                     <div className="mt-2 flex items-center space-x-4">
//                       <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
//                         <User className="h-6 w-6 text-gray-500" />
//                       </div>
//                       <div>
//                         <p className="text-sm font-medium text-gray-900">
//                           {driver.name || 'Driver'}
//                         </p>
//                         <div className="flex items-center text-sm text-gray-500">
//                           <Phone className="h-4 w-4 mr-1" />
//                           <a href={`tel:${driver.phone}`} className="hover:text-blue-600">
//                             {driver.phone}
//                           </a>
//                         </div>
//                         {driver.email && (
//                           <div className="flex items-center text-sm text-gray-500">
//                             <Mail className="h-4 w-4 mr-1" />
//                             <a href={`mailto:${driver.email}`} className="hover:text-blue-600">
//                               {driver.email}
//                             </a>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       <span>Loading driver details...</span>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* Status-specific information */}
//               <div className="pt-4 border-t border-gray-200">
//                 {ride.status === 'pending' && (
//                   <div className="text-center py-4">
//                     <Clock className="h-12 w-12 mx-auto text-blue-400" />
//                     <h3 className="mt-2 text-lg font-medium text-gray-900">Ride requested</h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       Waiting for a driver to accept...
//                     </p>
//                   </div>
//                 )}

//                 {ride.status === 'accepted' && (
//                   <div className="space-y-6">
//                     <div className="text-center">
//                       <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
//                       <h3 className="mt-2 text-xl font-semibold text-gray-900">Ride confirmed!</h3>
//                     </div>
                    
//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <h4 className="text-sm font-medium text-gray-500 mb-3">Driver Details</h4>
//                       <div className="space-y-2">
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Driver:</span>
//                           <span className="font-medium">{driver?.name || 'N/A'}</span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Contact:</span>
//                           <a href={`tel:${driver?.phone || ''}`} className="text-blue-600 hover:underline">
//                             {driver?.phone || 'N/A'}
//                           </a>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-white border border-gray-200 rounded-lg p-4">
//                       <h4 className="text-sm font-medium text-gray-500 mb-3">Vehicle Details</h4>
//                       <div className="space-y-2">
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Vehicle:</span>
//                           <span className="font-medium">
//                             {ride.vehicleModel} {ride.vehicleColor ? `(${ride.vehicleColor})` : ''}
//                           </span>
//                         </div>
//                         <div className="flex justify-between">
//                           <span className="text-gray-600">Number:</span>
//                           <span className="font-mono">{ride.vehicleNumber || 'N/A'}</span>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="bg-blue-50 p-4 rounded-lg">
//                       <div className="flex items-center justify-center space-x-2">
//                         <Clock className="h-5 w-5 text-blue-500" />
//                         <span className="font-medium text-blue-800">
//                           Pickup Time: {ride.pickupTime ? new Date(ride.pickupTime).toLocaleString() : 'N/A'}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {ride.status === 'completed' && (
//                   <div className="text-center py-4">
//                     <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
//                     <h3 className="mt-2 text-lg font-medium text-gray-900">Ride Completed</h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       Thank you for choosing our service!
//                     </p>
//                   </div>
//                 )}

//                 {ride.status === 'cancelled' && (
//                   <div className="text-center py-4">
//                     <XCircle className="h-12 w-12 mx-auto text-red-500" />
//                     <h3 className="mt-2 text-lg font-medium text-gray-900">Ride Cancelled</h3>
//                     <p className="mt-1 text-sm text-gray-500">
//                       This ride has been cancelled. Please book a new ride if needed.
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookingStatus;

// // // src/pages/BookingStatus.jsx
// // import { useEffect, useState } from 'react';
// // import { useParams } from 'react-router-dom';
// // import { doc, onSnapshot } from 'firebase/firestore';
// // import { db } from '../config/firebase';
// // import DriverTrackingMap from './driver/components/DriverTrackingMap';

// // const BookingStatus = () => {
// //   const { bookingId } = useParams();
// //   const [booking, setBooking] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);

// //   useEffect(() => {
// //     if (!bookingId) {
// //       setError('No booking ID provided');
// //       setLoading(false);
// //       return;
// //     }

// //     // Listen to booking updates
// //     const unsubscribe = onSnapshot(
// //       doc(db, 'airportTransfers', bookingId),
// //       (docSnapshot) => {
// //         if (docSnapshot.exists()) {
// //           setBooking({ id: docSnapshot.id, ...docSnapshot.data() });
// //           setError(null);
// //         } else {
// //           setError('Booking not found');
// //         }
// //         setLoading(false);
// //       },
// //       (err) => {
// //         console.error('Error fetching booking:', err);
// //         setError('Failed to load booking details');
// //         setLoading(false);
// //       }
// //     );

// //     return () => unsubscribe();
// //   }, [bookingId]);

// //   const getStatusMessage = () => {
// //     if (!booking) return '';
    
// //     switch (booking.status) {
// //       case 'pending':
// //       case 'searching_driver':
// //         return 'Searching for a driver...';
// //       case 'accepted':
// //         return `Driver ${booking.driverName || 'assigned'} is on the way!`;
// //       case 'picked_up':
// //         return `You're on your way with ${booking.driverName}`;
// //       case 'in_transit':
// //         return 'En route to your destination';
// //       case 'completed':
// //         return 'Trip completed!';
// //       case 'cancelled':
// //         return 'Your booking was cancelled';
// //       default:
// //         return 'Processing your booking...';
// //     }
// //   };

// //   const getStatusColor = () => {
// //     if (!booking) return 'bg-gray-100 text-gray-800';
    
// //     switch (booking.status) {
// //       case 'completed':
// //         return 'bg-green-100 text-green-800';
// //       case 'cancelled':
// //         return 'bg-red-100 text-red-800';
// //       case 'accepted':
// //       case 'picked_up':
// //       case 'in_transit':
// //         return 'bg-blue-100 text-blue-800';
// //       default:
// //         return 'bg-yellow-100 text-yellow-800';
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gray-50">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
// //           <p className="text-gray-600">Loading booking details...</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   if (error || !booking) {
// //     return (
// //       <div className="min-h-screen flex items-center justify-center bg-gray-50">
// //         <div className="text-center p-6 bg-white rounded-lg shadow-md">
// //           <svg className="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
// //           </svg>
// //           <h2 className="text-xl font-semibold text-gray-900">Error</h2>
// //           <p className="mt-2 text-gray-600">{error || 'Unable to load booking details'}</p>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="max-w-6xl mx-auto p-4 min-h-screen bg-gray-50">
// //       <h1 className="text-3xl font-bold mb-6 text-gray-900">Your Booking Status</h1>
      
// //       {/* Status Card */}
// //       <div className="bg-white rounded-lg shadow-md p-6 mb-6">
// //         <div className="flex justify-between items-center mb-4">
// //           <h2 className="text-xl font-semibold">Booking #{booking.bookingId || bookingId.substring(0, 8)}</h2>
// //           <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor()}`}>
// //             {booking.status.replace('_', ' ').toUpperCase()}
// //           </span>
// //         </div>

// //         <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
// //           <p className="text-blue-900 font-medium">{getStatusMessage()}</p>
// //         </div>

// //         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
// //           <div>
// //             <h3 className="font-medium text-gray-700 mb-2 flex items-center">
// //               <svg className="h-5 w-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
// //                 <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
// //               </svg>
// //               Pickup Location
// //             </h3>
// //             <p className="text-gray-900">{booking.pickupLocation?.name || 'N/A'}</p>
// //             <p className="text-sm text-gray-500 mt-1">
// //               {booking.pickupTime ? new Date(booking.pickupTime).toLocaleString() : 'N/A'}
// //             </p>
// //           </div>
// //           <div>
// //             <h3 className="font-medium text-gray-700 mb-2 flex items-center">
// //               <svg className="h-5 w-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
// //                 <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
// //               </svg>
// //               Dropoff Location
// //             </h3>
// //             <p className="text-gray-900">{booking.dropoffLocation?.name || 'N/A'}</p>
// //           </div>
// //         </div>

// //         {/* Driver Details */}
// //         {booking.driverId && (
// //           <div className="border-t pt-6">
// //             <h3 className="font-medium text-gray-700 mb-4">Driver Details</h3>
// //             <div className="flex items-center space-x-4">
// //               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
// //                 {booking.driverName?.charAt(0) || 'D'}
// //               </div>
// //               <div className="flex-1">
// //                 <p className="font-semibold text-lg text-gray-900">{booking.driverName || 'Driver'}</p>
// //                 <p className="text-sm text-gray-600">{booking.vehicleType || 'Standard Vehicle'}</p>
// //                 <div className="flex items-center mt-1">
// //                   <span className="text-yellow-500 text-sm">★★★★★</span>
// //                   <span className="ml-2 text-sm text-gray-600">4.9 (120 rides)</span>
// //                 </div>
// //               </div>
// //               {booking.driverPhone && (
// //                 <a 
// //                   href={`tel:${booking.driverPhone}`}
// //                   className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors shadow-md"
// //                   title="Call Driver"
// //                 >
// //                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
// //                     <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
// //                   </svg>
// //                 </a>
// //               )}
// //             </div>
// //           </div>
// //         )}
// //       </div>

// //       {/* Live Tracking Map */}
// //       {['accepted', 'picked_up', 'in_transit'].includes(booking.status) && (
// //         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
// //           <h2 className="text-xl font-semibold mb-4 flex items-center">
// //             <svg className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
// //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
// //             </svg>
// //             Live Tracking
// //           </h2>
// //           <div className="h-96 rounded-lg overflow-hidden">
// //             <DriverTrackingMap 
// //               bookingId={bookingId}
// //               userId={booking.userId}
// //               isDriver={false}
// //               pickupLocation={booking.pickupLocation}
// //               dropoffLocation={booking.dropoffLocation}
// //             />
// //           </div>
// //           {booking.driverLocation && (
// //             <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
// //               <div className="flex items-center">
// //                 <svg className="h-5 w-5 text-green-600 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
// //                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
// //                 </svg>
// //                 <p className="text-green-800 font-medium">Driver is on the way - ETA: 10-15 minutes</p>
// //               </div>
// //             </div>
// //           )}
// //         </div>
// //       )}

// //       {/* Trip Details */}
// //       <div className="bg-white rounded-lg shadow-md p-6">
// //         <h2 className="text-xl font-semibold mb-4">Trip Details</h2>
// //         <div className="space-y-3">
// //           <div className="flex justify-between py-2 border-b border-gray-100">
// //             <span className="text-gray-600">Vehicle Type</span>
// //             <span className="font-medium text-gray-900">{booking.vehicleType || 'Standard'}</span>
// //           </div>
// //           <div className="flex justify-between py-2 border-b border-gray-100">
// //             <span className="text-gray-600">Fare</span>
// //             <span className="font-medium text-gray-900">₹{booking.fare || booking.price || 'Calculating...'}</span>
// //           </div>
// //           <div className="flex justify-between py-2 border-b border-gray-100">
// //             <span className="text-gray-600">Distance</span>
// //             <span className="font-medium text-gray-900">{booking.distance || 'Calculating...'} km</span>
// //           </div>
// //           <div className="flex justify-between py-2">
// //             <span className="text-gray-600">Payment Status</span>
// //             <span className={`font-medium ${booking.paymentStatus === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
// //               {booking.paymentStatus === 'completed' ? '✓ Paid' : 'Pending'}
// //             </span>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default BookingStatus;

// src/pages/BookingStatus.jsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Clock, User, Phone, Mail, Loader2, CheckCircle, XCircle, Clock as ClockIcon, MapPin } from 'lucide-react';
import DriverTrackingMap from '../pages/driver/components/DriverTrackingMap';

const BookingStatus = () => {
  // Get bookingId from URL params OR from props
  const { bookingId: urlBookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Use bookingId from URL or props
  const bookingId = urlBookingId;

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch driver details when booking has driverId
  useEffect(() => {
    const fetchDriverDetails = async (driverId) => {
      try {
        console.log('Fetching driver details for:', driverId);
        const driverDoc = await getDoc(doc(db, 'drivers', driverId));
        if (driverDoc.exists()) {
          const driverData = { id: driverId, ...driverDoc.data() };
          console.log('Driver data fetched:', driverData);
          setDriver(driverData);
        } else {
          console.log('Driver document does not exist');
        }
      } catch (err) {
        console.error('Error fetching driver details:', err);
      }
    };

    if (booking?.driverId) {
      fetchDriverDetails(booking.driverId);
    }
  }, [booking?.driverId]);

  // Set up real-time booking status listener
  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    console.log('Setting up listener for booking:', bookingId);
    setLoading(true);
    
    // Listen to airportTransfers collection (your main collection)
    const bookingRef = doc(db, 'airportTransfers', bookingId);
    
    const unsubscribe = onSnapshot(
      bookingRef,
      (snapshot) => {
        console.log('Booking snapshot received');
        if (snapshot.exists()) {
          const bookingData = { id: snapshot.id, ...snapshot.data() };
          console.log('Booking data:', bookingData);
          setBooking(bookingData);
          setError(null);
        } else {
          console.log('Booking not found in airportTransfers');
          setError('Booking not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error getting booking:', error);
        setError('Failed to load booking details');
        setLoading(false);
      }
    );

    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up booking listener');
      unsubscribe();
    };
  }, [bookingId]);

  // Get status message based on booking status
  const getStatusMessage = () => {
    if (!booking) return '';
    
    switch (booking.status) {
      case 'pending':
      case 'searching_driver':
        return 'Searching for a driver...';
      case 'accepted':
        return `Driver ${booking.driverName || 'assigned'} is on the way!`;
      case 'picked_up':
        return `You're on your way with ${booking.driverName}`;
      case 'in_transit':
        return 'En route to your destination';
      case 'completed':
        return 'Trip completed!';
      case 'cancelled':
        return 'Your booking was cancelled';
      case 'no_drivers_available':
        return 'No drivers available at the moment';
      case 'expired':
        return 'Your ride request has expired';
      default:
        return 'Processing your booking...';
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (!booking) return 'bg-gray-100 text-gray-800';
    
    switch (booking.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
      case 'no_drivers_available':
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'accepted':
      case 'picked_up':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !booking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          <p className="mt-2 text-gray-600">{error || 'Unable to load booking details'}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Render expired booking state
  if (booking.status === 'expired') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-red-50 p-6 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ride Request Expired</h2>
            <p className="text-gray-700 mb-6">
              We couldn't find a driver for your ride within the time limit. 
              {booking.cancellationReason ? ` Reason: ${booking.cancellationReason}` : ''}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/book-ride', { state: { ...booking } })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Try Booking Again
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
          
          {/* Show booking details */}
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Your Booking Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking ID:</span>
                <span className="font-medium">{bookingId.substring(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pickup:</span>
                <span className="text-right">
                  {booking.pickupLocation?.name || booking.pickupLocation?.address || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dropoff:</span>
                <span className="text-right">
                  {booking.dropoffLocation?.name || booking.dropoffLocation?.address || 'N/A'}
                </span>
              </div>
              {booking.travelDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date & Time:</span>
                  <span>{formatDate(booking.travelDate)} at {booking.hour || '00'}:{booking.minute || '00'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showMap = ['accepted', 'picked_up', 'in_transit'].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Your Booking Status</h1>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Status Header */}
              <div className="px-4 py-5 sm:px-6 bg-gradient-to-r from-blue-500 to-blue-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    Booking #{bookingId.substring(0, 8)}
                  </h3>
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                    {booking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Status Message */}
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
                <p className="text-blue-900 font-medium text-sm">{getStatusMessage()}</p>
              </div>

              {/* Trip Details */}
              <div className="px-4 py-5 sm:p-6 space-y-6">
                {/* Route */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Route
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.pickupLocation?.name || booking.pickupLocation?.address || 'Pickup'}
                        </p>
                        {booking.travelDate && (
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.travelDate)} at {booking.hour}:{booking.minute}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="h-2 w-2 rounded-full bg-red-500 mt-2 mr-3 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.dropoffLocation?.name || booking.dropoffLocation?.address || 'Dropoff'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                {booking.status === 'accepted' && booking.driverId && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Your Driver</h4>
                    {driver ? (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                            {(driver.displayName || driver.fullName || 'D')[0]}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {driver.displayName || driver.fullName || 'Driver'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {booking.vehicleType || driver.vehicleType || 'Standard Vehicle'}
                            </p>
                          </div>
                        </div>
                        
                        {(driver.phoneNumber || driver.phone || booking.driverPhone) && (
                          <a
                            href={`tel:${driver.phoneNumber || driver.phone || booking.driverPhone}`}
                            className="flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition text-sm font-medium"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Driver
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading driver details...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Vehicle Details */}
                {booking.vehicleModel && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Vehicle Details</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">Model:</span> {booking.vehicleModel}
                      </p>
                      {booking.vehicleNumber && (
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Number:</span> {booking.vehicleNumber}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Trip Info */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Trip Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vehicle Type:</span>
                      <span className="font-medium">{booking.vehicleType || 'Standard'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Passengers:</span>
                      <span className="font-medium">
                        {booking.adults || 1} Adults{booking.children ? `, ${booking.children} Children` : ''}
                      </span>
                    </div>
                    {booking.fare && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Fare:</span>
                        <span className="font-medium">₹{booking.fare}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map (if driver accepted) */}
          <div className="lg:col-span-2">
            {showMap ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                    Live Tracking
                  </h2>
                </div>
                <div style={{ height: '600px' }}>
                  <DriverTrackingMap
                    bookingId={bookingId}
                    userId={booking.userId}
                    isDriver={false}
                    pickupLocation={booking.pickupLocation}
                    dropoffLocation={booking.dropoffLocation}
                  />
                </div>
                {booking.driverLocation && (
                  <div className="p-4 bg-green-50 border-t border-green-200">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <p className="text-green-800 font-medium text-sm">
                        Driver is on the way - Tracking active
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 flex items-center justify-center" style={{ height: '600px' }}>
                <div className="text-center">
                  <ClockIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {booking.status === 'searching_driver' ? 'Finding Your Driver' : 'Waiting for Driver'}
                  </h3>
                  <p className="text-gray-600">
                    {booking.status === 'searching_driver' 
                      ? 'We are searching for the best driver for your route...'
                      : 'Map tracking will be available once a driver accepts your booking'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatus;