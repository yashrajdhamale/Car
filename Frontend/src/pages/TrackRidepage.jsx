// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};

//   const [bookingData, setBookingData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);

//   const unsubscribeRef = useRef(null);

//   // Firestore Realtime Listener
//   useEffect(() => {
//     if (!bookingId) {
//       setError('No booking ID provided');
//       setLoading(false);
//       return;
//     }

//     console.log('🚀 Setting up Firestore listener for booking:', bookingId);
//     const bookingRef = doc(db, 'airportTransfers', bookingId);

//     const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
//       if (!docSnap.exists()) {
//         setError('Booking not found');
//         setLoading(false);
//         return;
//       }

//       const data = docSnap.data();
//       console.log('📡 Real-time update received:', {
//         status: data.status,
//         driverName: data.driverName,
//         driverLocation: data.driverLocation,
//         userLocation: data.userLocation
//       });

//       setBookingData(data);

//       // Update locations
//       if (data.userLocation) {
//         setCustomerLocation(data.userLocation);
//       }
      
//       if (data.driverLocation) {
//         setDriverLocation(data.driverLocation);
//       }

//       setLoading(false);
//     }, (error) => {
//       console.error('Firestore listener error:', error);
//       setError('Failed to load tracking data');
//       setLoading(false);
//     });

//     unsubscribeRef.current = unsubscribe;

//     return () => {
//       if (unsubscribeRef.current) unsubscribeRef.current();
//     };
//   }, [bookingId]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading live tracking...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <h2 className="text-xl font-bold text-red-600 mb-2">Tracking Error</h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-2 rounded-md"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-4xl mx-auto">
//         {/* Header */}
//         <div className="mb-6">
//           <button
//             onClick={() => navigate(-1)}
//             className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
//           >
//             ← Back
//           </button>
//           <h1 className="text-2xl font-bold text-gray-900">Live Ride Tracking</h1>
//           <p className="text-gray-600">Booking ID: {bookingId?.substring(0, 12)}...</p>
//         </div>

//         {/* Status Card */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <div className="flex justify-between items-center">
//             <div>
//               <h3 className="font-semibold text-lg">Trip Status</h3>
//               <p className="text-gray-600">
//                 {bookingData?.status === 'accepted' && '✅ Driver accepted your ride'}
//                 {bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                 {bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                 {bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//               </p>
//             </div>
//             <div className="text-right">
//               <div className="text-sm text-gray-500">Driver</div>
//               <div className="font-semibold">{bookingData?.driverName || 'Not assigned yet'}</div>
//             </div>
//           </div>
//         </div>

//         {/* Location Info */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <h3 className="font-semibold text-lg mb-4">Live Location</h3>
          
//           {/* Driver Location */}
//           <div className="mb-4 p-4 bg-green-50 rounded-lg">
//             <div className="flex items-center mb-2">
//               <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//               <h4 className="font-medium">Driver Location</h4>
//             </div>
//             {driverLocation ? (
//               <div>
//                 <p className="text-gray-800">
//                   📍 {driverLocation.lat?.toFixed(6)}, {driverLocation.lng?.toFixed(6)}
//                 </p>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Last updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
//                 </p>
//                 <button
//                   onClick={() => window.open(`https://www.google.com/maps?q=${driverLocation.lat},${driverLocation.lng}`, '_blank')}
//                   className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
//                 >
//                   Open in Google Maps →
//                 </button>
//               </div>
//             ) : (
//               <p className="text-gray-500">Driver location not available yet</p>
//             )}
//           </div>

//           {/* Customer Location */}
//           <div className="p-4 bg-blue-50 rounded-lg">
//             <div className="flex items-center mb-2">
//               <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//               <h4 className="font-medium">Your Location</h4>
//             </div>
//             {customerLocation ? (
//               <div>
//                 <p className="text-gray-800">
//                   📍 {customerLocation.lat?.toFixed(6)}, {customerLocation.lng?.toFixed(6)}
//                 </p>
//                 <p className="text-sm text-gray-600 mt-1">
//                   Last updated: {new Date(customerLocation.timestamp).toLocaleTimeString()}
//                 </p>
//               </div>
//             ) : (
//               <p className="text-gray-500">Your location not shared</p>
//             )}
//           </div>
//         </div>

//         {/* Trip Details */}
//         <div className="bg-white rounded-lg shadow-md p-6 mb-6">
//           <h3 className="font-semibold text-lg mb-4">Trip Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <p className="text-gray-600 text-sm">From</p>
//               <p className="font-medium">{details.pickup?.name || details.pickup?.address}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 text-sm">To</p>
//               <p className="font-medium">{details.dropoff?.name || details.dropoff?.address}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 text-sm">Vehicle</p>
//               <p className="font-medium">{details.vehicleDetails?.name}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 text-sm">Driver Contact</p>
//               <p className="font-medium">
//                 {bookingData?.driverPhone ? (
//                   <a href={`tel:${bookingData.driverPhone}`} className="text-blue-600">
//                     {bookingData.driverPhone}
//                   </a>
//                 ) : 'Not available'}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex space-x-4">
//           {bookingData?.driverPhone && (
//             <button
//               onClick={() => window.open(`tel:${bookingData.driverPhone}`)}
//               className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-md font-medium"
//             >
//               📞 Call Driver
//             </button>
//           )}
//           <button
//             onClick={() => window.location.reload()}
//             className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-md font-medium"
//           >
//             ↻ Refresh Status
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;



// import React, { useState, useEffect, useRef } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { Loader } from '@googlemaps/js-api-loader';
// import DriverTrackingMap from './DriverTrackingMap'; // You'll create this

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};

//   const [bookingData, setBookingData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
  
//   const mapRef = useRef(null);
//   const directionsServiceRef = useRef(null);
//   const directionsRendererRef = useRef(null);
//   const unsubscribeRef = useRef(null);

//   // Calculate distance and ETA
//   const calculateDistanceAndETA = (loc1, loc2) => {
//     if (!loc1 || !loc2) return;
    
//     const R = 6371; // Earth's radius in km
//     const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
//     const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     const distanceKm = R * c;
    
//     setDistance(distanceKm.toFixed(1));
    
//     // Calculate ETA (assuming average speed of 40 km/h)
//     const averageSpeed = 40; // km/h
//     const etaHours = distanceKm / averageSpeed;
//     const etaMinutes = Math.ceil(etaHours * 60);
    
//     if (etaMinutes < 2) {
//       setEta('Arriving now');
//     } else if (etaMinutes < 60) {
//       setEta(`${etaMinutes} minutes`);
//     } else {
//       const hours = Math.floor(etaMinutes / 60);
//       const minutes = etaMinutes % 60;
//       setEta(`${hours}h ${minutes}m`);
//     }
//   };

//   // Firestore Realtime Listener
//   useEffect(() => {
//     if (!bookingId) {
//       setError('No booking ID provided');
//       setLoading(false);
//       return;
//     }

//     console.log('🚀 Setting up Firestore listener for booking:', bookingId);
//     const bookingRef = doc(db, 'airportTransfers', bookingId);

//     const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
//       if (!docSnap.exists()) {
//         setError('Booking not found');
//         setLoading(false);
//         return;
//       }

//       const data = docSnap.data();
//       console.log('📡 Real-time update received:', {
//         status: data.status,
//         driverName: data.driverName,
//         driverLocation: data.driverLocation,
//         userLocation: data.userLocation,
//         driverPhone: data.driverPhone
//       });

//       setBookingData(data);
      
//       // Update driver info
//       if (data.driverName || data.driverPhone) {
//         setDriverInfo({
//           name: data.driverName,
//           phone: data.driverPhone,
//           vehicle: data.vehicleModel || data.vehicleType
//         });
//       }

//       // Update locations
//       if (data.userLocation) {
//         setCustomerLocation(data.userLocation);
//       }
      
//       if (data.driverLocation) {
//         setDriverLocation(data.driverLocation);
//         // Calculate distance and ETA if we have both locations
//         if (data.userLocation) {
//           calculateDistanceAndETA(data.driverLocation, data.userLocation);
//         }
//       }

//       setLoading(false);
//     }, (error) => {
//       console.error('Firestore listener error:', error);
//       setError('Failed to load tracking data');
//       setLoading(false);
//     });

//     unsubscribeRef.current = unsubscribe;

//     return () => {
//       if (unsubscribeRef.current) unsubscribeRef.current();
//     };
//   }, [bookingId]);

//   // Initialize Google Maps
//   useEffect(() => {
//     if (!driverLocation || !customerLocation) return;
    
//     const initMap = async () => {
//       try {
//         const loader = new Loader({
//           apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
//           version: "weekly",
//           libraries: ["places", "geometry"]
//         });
        
//         const google = await loader.load();
        
//         const map = new google.maps.Map(mapRef.current, {
//           center: { lat: driverLocation.lat, lng: driverLocation.lng },
//           zoom: 13,
//           mapTypeControl: false,
//           streetViewControl: false,
//           fullscreenControl: true
//         });
        
//         // Add markers
//         const driverMarker = new google.maps.Marker({
//           position: { lat: driverLocation.lat, lng: driverLocation.lng },
//           map: map,
//           title: 'Your Driver',
//           icon: {
//             path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
//             fillColor: "#34D399",
//             fillOpacity: 1,
//             strokeColor: "#FFFFFF",
//             strokeWeight: 2,
//             scale: 6,
//             rotation: driverLocation.heading || 0
//           }
//         });
        
//         const customerMarker = new google.maps.Marker({
//           position: { lat: customerLocation.lat, lng: customerLocation.lng },
//           map: map,
//           title: 'Your Location',
//           icon: {
//             url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
//           }
//         });
        
//         // Draw route if we have both points
//         if (driverLocation && customerLocation) {
//           directionsServiceRef.current = new google.maps.DirectionsService();
//           directionsRendererRef.current = new google.maps.DirectionsRenderer({
//             map: map,
//             suppressMarkers: true,
//             polylineOptions: {
//               strokeColor: '#3B82F6',
//               strokeOpacity: 0.8,
//               strokeWeight: 5
//             }
//           });
          
//           const request = {
//             origin: { lat: driverLocation.lat, lng: driverLocation.lng },
//             destination: { lat: customerLocation.lat, lng: customerLocation.lng },
//             travelMode: google.maps.TravelMode.DRIVING
//           };
          
//           directionsServiceRef.current.route(request, (result, status) => {
//             if (status === 'OK') {
//               directionsRendererRef.current.setDirections(result);
//             }
//           });
//         }
        
//         // Auto-center map to show both markers
//         const bounds = new google.maps.LatLngBounds();
//         bounds.extend(driverMarker.getPosition());
//         bounds.extend(customerMarker.getPosition());
//         map.fitBounds(bounds);
        
//       } catch (error) {
//         console.error('Error loading Google Maps:', error);
//       }
//     };
    
//     initMap();
    
//     return () => {
//       // Cleanup
//       if (directionsRendererRef.current) {
//         directionsRendererRef.current.setMap(null);
//       }
//     };
//   }, [driverLocation, customerLocation]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading live tracking...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <h2 className="text-xl font-bold text-red-600 mb-2">Tracking Error</h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-2 rounded-md"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white shadow-sm p-4">
//         <div className="max-w-6xl mx-auto flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Live Ride Tracking</h1>
//             <p className="text-gray-600 text-sm">Booking ID: {bookingId?.substring(0, 8)}...</p>
//           </div>
//           <button
//             onClick={() => navigate(-1)}
//             className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100"
//           >
//             ← Back
//           </button>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto p-4">
//         {/* Status Banner */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6 shadow-lg">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-xl font-bold mb-2">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-4 h-4 rounded-full mr-3 ${
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-lg font-semibold">
//                   {bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                 </span>
//               </div>
//             </div>
            
//             {distance && eta && (
//               <div className="text-right">
//                 <div className="text-sm opacity-90">Distance to you</div>
//                 <div className="text-2xl font-bold">{distance} km</div>
//                 <div className="text-sm">ETA: {eta}</div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Driver Info Card */}
//         {driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//             <h3 className="font-bold text-lg mb-4 flex items-center">
//               <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
//                 👤
//               </span>
//               Your Driver
//             </h3>
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-xl font-semibold">{driverInfo.name}</p>
//                 <p className="text-gray-600">{driverInfo.vehicle}</p>
//               </div>
//               <div className="text-right">
//                 {driverInfo.phone && (
//                   <a
//                     href={`tel:${driverInfo.phone}`}
//                     className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center"
//                   >
//                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                     </svg>
//                     Call Driver
//                   </a>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Live Map */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-6">
//           <h3 className="font-bold text-lg mb-4">Live Location Map</h3>
//           <div 
//             ref={mapRef} 
//             className="w-full h-96 rounded-lg bg-gray-200"
//             style={{ minHeight: '400px' }}
//           />
          
//           {/* Map Legend */}
//           <div className="flex justify-center mt-4 space-x-6">
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
//               <span className="text-sm text-gray-600">Your Driver</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
//               <span className="text-sm text-gray-600">Your Location</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-8 h-1 bg-blue-400 mr-2"></div>
//               <span className="text-sm text-gray-600">Route</span>
//             </div>
//           </div>
//         </div>

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-6">
//           <h3 className="font-bold text-lg mb-4">Trip Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">From</p>
//               <p className="font-medium">{details.pickup?.name || details.pickup?.address}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">To</p>
//               <p className="font-medium">{details.dropoff?.name || details.dropoff?.address}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Vehicle</p>
//               <p className="font-medium">{details.vehicleDetails?.name}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Time</p>
//               <p className="font-medium">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString() : 'N/A'}
//                 {details.hour && ` at ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Refresh Button */}
//         <div className="mt-6 text-center">
//           <button
//             onClick={() => window.location.reload()}
//             className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium flex items-center mx-auto"
//           >
//             <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//             </svg>
//             Refresh Live Data
//           </button>
//           <p className="text-gray-500 text-sm mt-2">Data updates automatically every 10 seconds</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};

//   const [bookingData, setBookingData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [mapError, setMapError] = useState(false);
  
//   const mapRef = useRef(null);
//   const unsubscribeRef = useRef(null);
//   const locationIntervalRef = useRef(null);
//   const mapInstanceRef = useRef(null);

//   // Get MapMyIndia API key from environment
//   const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY;

//   // Check if MapMyIndia API key exists
//   useEffect(() => {
//     if (!MAP_MY_INDIA_API_KEY) {
//       console.warn('⚠️ MapMyIndia API key is missing!');
//       console.log('Please add VITE_MAP_MY_INDIA_API_KEY to your .env file');
//     } else {
//       console.log('✅ MapMyIndia API key found');
//     }
//   }, [MAP_MY_INDIA_API_KEY]);

//   // Function to update customer location
//   const updateCustomerLocation = useCallback(async () => {
//     if (!bookingId || !user?.uid) return;

//     try {
//       if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(
//           async (position) => {
//             const userLocation = {
//               lat: position.coords.latitude,
//               lng: position.coords.longitude,
//               timestamp: Date.now(),
//               accuracy: position.coords.accuracy,
//               speed: position.coords.speed || 0,
//               heading: position.coords.heading || null,
//               source: 'customer_web'
//             };

//             try {
//               const bookingRef = doc(db, 'airportTransfers', bookingId);
//               await updateDoc(bookingRef, {
//                 'userLocation': userLocation,
//                 'userLocationUpdatedAt': serverTimestamp(),
//                 'lastUpdated': serverTimestamp()
//               });

//               console.log('📍 Customer location updated:', userLocation);
//               setCustomerLocation(userLocation);
              
//               // If we have driver location, calculate distance
//               if (driverLocation) {
//                 calculateDistanceAndETA(driverLocation, userLocation);
//               }
//             } catch (firestoreError) {
//               console.error('Error updating Firestore:', firestoreError);
//             }
//           },
//           (error) => {
//             console.error('Geolocation error:', error);
//             // Don't show timeout errors as they're common
//             if (error.code !== 3) { // 3 is TIMEOUT
//               toast.error('Unable to get your location. Please enable location permissions.');
//             }
//           },
//           {
//             enableHighAccuracy: false, // Changed to false to prevent timeout
//             timeout: 10000,
//             maximumAge: 30000 // Use cached location if available
//           }
//         );
//       }
//     } catch (error) {
//       console.error('Error in updateCustomerLocation:', error);
//     }
//   }, [bookingId, user?.uid, driverLocation]);

//   // Calculate distance and ETA between two points
//   const calculateDistanceAndETA = useCallback((driverLoc, customerLoc) => {
//     if (!driverLoc || !customerLoc) return;

//     // Haversine formula for distance calculation
//     const R = 6371; // Earth's radius in km
//     const dLat = (customerLoc.lat - driverLoc.lat) * Math.PI / 180;
//     const dLon = (customerLoc.lng - driverLoc.lng) * Math.PI / 180;
//     const a = 
//       Math.sin(dLat/2) * Math.sin(dLat/2) +
//       Math.cos(driverLoc.lat * Math.PI / 180) * Math.cos(customerLoc.lat * Math.PI / 180) * 
//       Math.sin(dLon/2) * Math.sin(dLon/2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//     const distanceKm = R * c;
    
//     // Format distance
//     let formattedDistance;
//     if (distanceKm < 1) {
//       formattedDistance = `${Math.round(distanceKm * 1000)} meters`;
//     } else if (distanceKm < 10) {
//       formattedDistance = `${distanceKm.toFixed(1)} km`;
//     } else {
//       formattedDistance = `${Math.round(distanceKm)} km`;
//     }
    
//     setDistance(formattedDistance);
    
//     // Calculate ETA based on distance
//     // Adjust speed based on distance
//     let averageSpeed = 40; // default km/h
//     if (distanceKm < 5) averageSpeed = 20; // city traffic
//     if (distanceKm > 50) averageSpeed = 60; // highway
    
//     const etaHours = distanceKm / averageSpeed;
//     const etaMinutes = Math.ceil(etaHours * 60);
    
//     if (etaMinutes < 2) {
//       setEta('Arriving now');
//     } else if (etaMinutes < 60) {
//       setEta(`${etaMinutes} minutes`);
//     } else {
//       const hours = Math.floor(etaMinutes / 60);
//       const minutes = etaMinutes % 60;
//       setEta(minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`);
//     }
    
//     console.log('📏 Distance calculated:', {
//       distance: formattedDistance,
//       eta: etaMinutes,
//       driverSpeed: driverLoc.speed || 0,
//       distanceKm: distanceKm
//     });
//   }, []);

//   // Load MapMyIndia
//   const loadMapMyIndia = useCallback(() => {
//     return new Promise((resolve, reject) => {
//       // Check if MapMyIndia is already loaded
//       if (window.MapmyIndia && window.MapmyIndia.Map) {
//         console.log('✅ MapMyIndia already loaded');
//         resolve(window.MapmyIndia);
//         return;
//       }

//       if (!MAP_MY_INDIA_API_KEY) {
//         reject(new Error('MapMyIndia API key not found'));
//         return;
//       }

//       // Load MapMyIndia SDK
//       const script = document.createElement('script');
//       script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${MAP_MY_INDIA_API_KEY}/map_load`;
//       script.async = true;
      
//       script.onload = () => {
//         console.log('✅ MapMyIndia SDK loaded');
        
//         // Load the map library
//         const mapScript = document.createElement('script');
//         mapScript.src = `https://apis.mapmyindia.com/advancedmaps/api/${MAP_MY_INDIA_API_KEY}/map_sdk?layer=vector`;
//         mapScript.async = true;
        
//         mapScript.onload = () => {
//           console.log('✅ MapMyIndia Map SDK loaded');
//           if (window.L && window.L.mapmyindia) {
//             resolve(window.L.mapmyindia);
//           } else {
//             reject(new Error('MapMyIndia map SDK not loaded properly'));
//           }
//         };
        
//         mapScript.onerror = () => {
//           reject(new Error('Failed to load MapMyIndia map SDK'));
//         };
        
//         document.head.appendChild(mapScript);
//       };

//       script.onerror = () => {
//         reject(new Error('Failed to load MapMyIndia SDK'));
//       };

//       document.head.appendChild(script);
//     });
//   }, [MAP_MY_INDIA_API_KEY]);

//   // Initialize MapMyIndia map
//   const initializeMap = useCallback(async () => {
//     if (!mapRef.current || !driverLocation || !customerLocation) {
//       console.log('⚠️ Cannot initialize map. Missing:', {
//         mapRef: !!mapRef.current,
//         driverLocation: !!driverLocation,
//         customerLocation: !!customerLocation
//       });
//       return;
//     }

//     try {
//       const mapmyindia = await loadMapMyIndia();
      
//       console.log('🗺️ Initializing MapMyIndia map with:', {
//         driver: driverLocation,
//         customer: customerLocation,
//         distance: distance
//       });

//       // Create map centered on midpoint between driver and customer
//       const centerLat = (driverLocation.lat + customerLocation.lat) / 2;
//       const centerLng = (driverLocation.lng + customerLocation.lng) / 2;
      
//       const map = mapmyindia.map(mapRef.current, {
//         center: [centerLat, centerLng],
//         zoom: 10,
//         zoomControl: true
//       });

//       mapInstanceRef.current = map;

//       // Add driver marker (car icon)
//       const driverIcon = L.divIcon({
//         html: `<div style="
//           background-color: #34D399;
//           width: 24px;
//           height: 24px;
//           border-radius: 50%;
//           border: 2px solid white;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 12px;
//           color: white;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.3);
//         ">🚗</div>`,
//         iconSize: [24, 24],
//         iconAnchor: [12, 12]
//       });

//       const driverMarker = L.marker([driverLocation.lat, driverLocation.lng], {
//         icon: driverIcon,
//         title: 'Your Driver'
//       }).addTo(map);

//       // Add customer marker
//       const customerIcon = L.divIcon({
//         html: `<div style="
//           background-color: #3B82F6;
//           width: 24px;
//           height: 24px;
//           border-radius: 50%;
//           border: 2px solid white;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 12px;
//           color: white;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.3);
//         ">📍</div>`,
//         iconSize: [24, 24],
//         iconAnchor: [12, 12]
//       });

//       const customerMarker = L.marker([customerLocation.lat, customerLocation.lng], {
//         icon: customerIcon,
//         title: 'Your Location'
//       }).addTo(map);

//       // Add polyline between points
//       const polyline = L.polyline([
//         [driverLocation.lat, driverLocation.lng],
//         [customerLocation.lat, customerLocation.lng]
//       ], {
//         color: '#3B82F6',
//         weight: 4,
//         opacity: 0.8,
//         dashArray: '10, 10'
//       }).addTo(map);

//       // Fit bounds to show both markers
//       const bounds = L.latLngBounds(
//         [driverLocation.lat, driverLocation.lng],
//         [customerLocation.lat, customerLocation.lng]
//       );
//       map.fitBounds(bounds, { padding: [50, 50] });

//       setMapLoaded(true);
//       setMapError(false);
      
//       console.log('✅ MapMyIndia map initialized successfully');

//     } catch (error) {
//       console.error('❌ Map initialization failed:', error);
//       setMapError(true);
//       // Don't show error to user if map fails - we can still show location data
//     }
//   }, [driverLocation, customerLocation, distance, loadMapMyIndia]);

//   // Update map markers
//   const updateMapMarkers = useCallback(() => {
//     if (!mapInstanceRef.current) return;
    
//     // For MapMyIndia with Leaflet, we'd need to track markers
//     // For now, we'll just reinitialize if locations change significantly
//     if (mapLoaded && driverLocation && customerLocation) {
//       // Simple approach: remove existing map and reinitialize
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.remove();
//         mapInstanceRef.current = null;
//       }
//       setMapLoaded(false);
//       setTimeout(() => initializeMap(), 500);
//     }
//   }, [driverLocation, customerLocation, mapLoaded, initializeMap]);

//   // MAIN FIREBASE LISTENER
//   useEffect(() => {
//     if (!bookingId) {
//       setError('No booking ID provided');
//       setLoading(false);
//       return;
//     }

//     console.log('🚀 Setting up Firestore listener for booking:', bookingId);
//     const bookingRef = doc(db, 'airportTransfers', bookingId);

//     const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
//       if (!docSnap.exists()) {
//         setError('Booking not found');
//         setLoading(false);
//         return;
//       }

//       const data = docSnap.data();
//       console.log('📡 Firestore update received:', {
//         id: docSnap.id,
//         status: data.status,
//         driverId: data.driverId,
//         driverName: data.driverName,
//         driverLocation: data.driverLocation,
//         userLocation: data.userLocation,
//         updatedAt: data.updatedAt?.toDate?.()?.toLocaleTimeString()
//       });

//       setBookingData(data);
      
//       // Update driver info
//       if (data.driverName || data.driverPhone || data.driverId) {
//         setDriverInfo({
//           name: data.driverName || 'Driver',
//           phone: data.driverPhone || 'Not available',
//           vehicle: data.vehicleModel || data.vehicleType || 'Car',
//           rating: data.driverRating || '4.8',
//           driverId: data.driverId
//         });
//       }

//       // Track location changes
//       let locationChanged = false;

//       // Update CUSTOMER location
//       if (data.userLocation) {
//         const newCustomerLoc = data.userLocation;
//         const oldCustomerLoc = customerLocation;
        
//         if (!oldCustomerLoc || 
//             newCustomerLoc.lat !== oldCustomerLoc.lat || 
//             newCustomerLoc.lng !== oldCustomerLoc.lng) {
//           console.log('📍 Customer location updated from Firestore:', newCustomerLoc);
//           setCustomerLocation(newCustomerLoc);
//           locationChanged = true;
//         }
//       }

//       // Update DRIVER location
//       if (data.driverLocation) {
//         const newDriverLoc = data.driverLocation;
//         const oldDriverLoc = driverLocation;
        
//         if (!oldDriverLoc || 
//             newDriverLoc.lat !== oldDriverLoc.lat || 
//             newDriverLoc.lng !== oldDriverLoc.lng) {
//           console.log('🚗 Driver location updated from Firestore:', newDriverLoc);
//           setDriverLocation(newDriverLoc);
//           locationChanged = true;
//         }
//       }

//       // Calculate distance and ETA if we have both locations
//       if (data.driverLocation && data.userLocation) {
//         calculateDistanceAndETA(data.driverLocation, data.userLocation);
//       }

//       setLoading(false);

//       // Initialize or update map
//       if (data.driverLocation && data.userLocation) {
//         if (!mapLoaded && !mapError && MAP_MY_INDIA_API_KEY) {
//           setTimeout(() => initializeMap(), 1000);
//         } else if (mapLoaded && locationChanged) {
//           updateMapMarkers();
//         }
//       }

//     }, (error) => {
//       console.error('Firestore listener error:', error);
//       setError('Failed to load tracking data. Please refresh the page.');
//       setLoading(false);
//     });

//     unsubscribeRef.current = unsubscribe;

//     return () => {
//       if (unsubscribeRef.current) unsubscribeRef.current();
//     };
//   }, [bookingId, mapLoaded, mapError, initializeMap, updateMapMarkers, calculateDistanceAndETA, MAP_MY_INDIA_API_KEY]);

//   // Periodically update customer location
//   useEffect(() => {
//     if (bookingId && user?.uid) {
//       // Initial location update
//       updateCustomerLocation();
      
//       // Update every 30 seconds
//       locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
//     }
    
//     return () => {
//       if (locationIntervalRef.current) {
//         clearInterval(locationIntervalRef.current);
//       }
//     };
//   }, [bookingId, user?.uid, updateCustomerLocation]);

//   // Debug: Log location states
//   useEffect(() => {
//     console.log('📍 Location States:', {
//       driverLocation: driverLocation ? 
//         `🚗 Driver: ${driverLocation.lat.toFixed(6)}, ${driverLocation.lng.toFixed(6)}` : 
//         'No driver location',
//       customerLocation: customerLocation ? 
//         `📍 You: ${customerLocation.lat.toFixed(6)}, ${customerLocation.lng.toFixed(6)}` : 
//         'No customer location',
//       distance: distance,
//       eta: eta,
//       bookingStatus: bookingData?.status,
//       mapLoaded: mapLoaded,
//       mapError: mapError
//     });
//   }, [driverLocation, customerLocation, distance, eta, bookingData, mapLoaded, mapError]);

//   // Initialize map when component mounts if locations are available
//   useEffect(() => {
//     if (driverLocation && customerLocation && MAP_MY_INDIA_API_KEY && !mapLoaded && !mapError) {
//       const timer = setTimeout(() => {
//         initializeMap();
//       }, 1500);
      
//       return () => clearTimeout(timer);
//     }
//   }, [driverLocation, customerLocation, mapLoaded, mapError, initializeMap, MAP_MY_INDIA_API_KEY]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       if (unsubscribeRef.current) unsubscribeRef.current();
//       if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current.remove();
//         mapInstanceRef.current = null;
//       }
//     };
//   }, []);

//   // Helper functions
//   const formatTime = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const handleRefresh = () => {
//     updateCustomerLocation();
//     toast.info('Refreshing location...');
//   };

//   const openMapNavigation = () => {
//     if (driverLocation) {
//       // Open in Google Maps (fallback) or MapMyIndia if available
//       window.open(`https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`, '_blank');
//     }
//   };

//   // Format address from location object
//   const formatAddress = (location) => {
//     if (!location) return 'Location not available';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     return 'Location specified';
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading live tracking...</p>
//           <p className="text-gray-500 text-sm mt-2">Connecting to driver...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
//         <div className="text-center max-w-md">
//           <div className="text-red-500 text-6xl mb-4">⚠️</div>
//           <h2 className="text-xl font-bold text-red-600 mb-2">Tracking Error</h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
//             >
//               Refresh Page
//             </button>
//             <button
//               onClick={() => navigate('/')}
//               className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
//             >
//               Back to Home
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastContainer position="top-right" autoClose={3000} />
      
//       {/* Header */}
//       <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Live Ride Tracking</h1>
//             <p className="text-gray-600 text-sm">
//               Booking: {bookingId?.substring(0, 10)}...
//               {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={handleRefresh}
//               className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium flex items-center transition text-sm"
//             >
//               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               Refresh
//             </button>
//             <button
//               onClick={() => navigate(-1)}
//               className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm"
//             >
//               ← Back
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto p-4">
//         {/* Status Banner */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6 shadow-lg">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h2 className="text-xl font-bold mb-2">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-4 h-4 rounded-full mr-3 ${
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-lg font-semibold">
//                   {bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                   {bookingData?.status === 'completed' && '✓ Ride completed'}
//                   {!bookingData?.status && 'Status unavailable'}
//                 </span>
//               </div>
//             </div>
            
//             {distance && eta && (
//               <div className="text-right bg-white/20 p-4 rounded-lg">
//                 <div className="text-sm opacity-90">Distance to you</div>
//                 <div className="text-2xl font-bold">{distance}</div>
//                 <div className="text-sm">ETA: {eta}</div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Driver Info Card */}
//         {driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//               <div className="flex items-center">
//                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
//                   <span className="text-xl">👤</span>
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-lg">Your Driver</h3>
//                   <p className="text-xl font-semibold">{driverInfo.name}</p>
//                   <div className="flex flex-wrap items-center gap-2 mt-1">
//                     <p className="text-gray-600">{driverInfo.vehicle}</p>
//                     <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm">
//                       ⭐ {driverInfo.rating}
//                     </span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="flex flex-col sm:flex-row gap-2">
//                 {driverInfo.phone && (
//                   <a
//                     href={`tel:${driverInfo.phone}`}
//                     className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                   >
//                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                     </svg>
//                     Call Driver
//                   </a>
//                 )}
//                 {driverLocation && (
//                   <button
//                     onClick={openMapNavigation}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                   >
//                     <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                     </svg>
//                     Navigate
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Map Section */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-6">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
//             <h3 className="font-bold text-lg">Live Location Map</h3>
//             <div className="text-sm text-gray-500 flex items-center">
//               {!MAP_MY_INDIA_API_KEY && (
//                 <span className="text-yellow-600 mr-2">⚠️ Map API key missing</span>
//               )}
//               {mapError ? 'Map loading failed' : mapLoaded ? 'Live tracking active' : 'Loading map...'}
//             </div>
//           </div>
          
//           {!MAP_MY_INDIA_API_KEY ? (
//             <div className="w-full h-64 rounded-lg bg-gray-100 flex flex-col items-center justify-center p-4">
//               <div className="text-4xl mb-4">🗺️</div>
//               <p className="text-gray-700 font-medium mb-2">MapMyIndia API Key Required</p>
//               <p className="text-gray-600 text-sm text-center mb-4">
//                 To display the map, please add your MapMyIndia API key to the .env file:
//                 <code className="block bg-gray-200 p-2 rounded mt-2 text-xs">
//                   VITE_MAP_MY_INDIA_API_KEY=your_api_key_here
//                 </code>
//               </p>
//             </div>
//           ) : mapError ? (
//             <div className="w-full h-64 rounded-lg bg-gray-200 flex flex-col items-center justify-center p-4">
//               <div className="text-4xl mb-4">⚠️</div>
//               <p className="text-gray-600 mb-2">Failed to load map</p>
//               <p className="text-gray-500 text-sm text-center mb-4">
//                 You can still track the ride using location information below
//               </p>
//               <button
//                 onClick={() => {
//                   setMapError(false);
//                   initializeMap();
//                 }}
//                 className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
//               >
//                 Try Again
//               </button>
//             </div>
//           ) : !mapLoaded ? (
//             <div className="w-full h-64 rounded-lg bg-gray-200 flex flex-col items-center justify-center p-4">
//               <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
//               <p className="text-gray-600">Loading map...</p>
//               {!driverLocation && (
//                 <p className="text-gray-500 text-sm mt-2">Waiting for driver location...</p>
//               )}
//               {!customerLocation && (
//                 <p className="text-gray-500 text-sm mt-2">Getting your location...</p>
//               )}
//             </div>
//           ) : (
//             <>
//               <div 
//                 ref={mapRef} 
//                 className="w-full h-64 sm:h-96 rounded-lg bg-gray-200"
//               />
              
//               {/* Map Legend */}
//               <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
//                 <div className="flex flex-wrap gap-4">
//                   <div className="flex items-center">
//                     <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
//                     <span className="text-sm text-gray-600">Your Driver</span>
//                   </div>
//                   <div className="flex items-center">
//                     <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
//                     <span className="text-sm text-gray-600">Your Location</span>
//                   </div>
//                   <div className="flex items-center">
//                     <div className="w-8 h-1 bg-blue-400 border-dashed border mr-2"></div>
//                     <span className="text-sm text-gray-600">Route</span>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Location Information */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//           <h3 className="font-bold text-lg mb-4">Location Tracking</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             {/* Driver Location Card */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex items-center mb-3">
//                 <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
//                 <h4 className="font-semibold text-gray-700">Driver Location</h4>
//                 <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
//                   {driverLocation ? 'Live' : 'Waiting'}
//                 </span>
//               </div>
              
//               {driverLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-sm">{driverLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-sm">{driverLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
                  
//                   {driverLocation.timestamp && (
//                     <p className="text-xs text-gray-500">
//                       Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
//                     </p>
//                   )}
                  
//                   {driverLocation.accuracy && (
//                     <p className="text-xs text-gray-500">
//                       Accuracy: ±{Math.round(driverLocation.accuracy)} meters
//                     </p>
//                   )}
//                 </div>
//               ) : (
//                 <div className="text-center py-4">
//                   <p className="text-gray-500">Waiting for driver to share location...</p>
//                   <p className="text-sm text-gray-400 mt-1">
//                     Driver will appear here once they start the trip
//                   </p>
//                 </div>
//               )}
//             </div>
            
//             {/* Customer Location Card */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex items-center mb-3">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                 <h4 className="font-semibold text-gray-700">Your Location</h4>
//                 <span className="ml-auto text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
//                   {customerLocation ? 'Active' : 'Inactive'}
//                 </span>
//               </div>
              
//               {customerLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-sm">{customerLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-sm">{customerLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
                  
//                   {customerLocation.accuracy && (
//                     <p className="text-xs text-gray-500">
//                       Accuracy: ±{Math.round(customerLocation.accuracy)} meters
//                     </p>
//                   )}
                  
//                   {customerLocation.timestamp && (
//                     <p className="text-xs text-gray-500">
//                       Updated: {new Date(customerLocation.timestamp).toLocaleTimeString()}
//                     </p>
//                   )}
                  
//                   <button
//                     onClick={handleRefresh}
//                     className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                     </svg>
//                     Update My Location
//                   </button>
//                 </div>
//               ) : (
//                 <div>
//                   <p className="text-gray-500 mb-3">Your location not shared</p>
//                   <button
//                     onClick={handleRefresh}
//                     className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
//                     </svg>
//                     Share My Location
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Distance & ETA Display */}
//           {(distance || eta) && (
//             <div className="border-t border-gray-200 pt-6">
//               <h4 className="font-semibold text-gray-700 mb-4">Trip Information</h4>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="bg-blue-50 p-4 rounded-lg">
//                   <div className="flex items-center mb-2">
//                     <div className="text-blue-500 mr-2">📏</div>
//                     <p className="text-sm text-gray-600">Distance</p>
//                   </div>
//                   <p className="text-2xl font-bold text-blue-600">{distance || 'Calculating...'}</p>
//                 </div>
//                 <div className="bg-green-50 p-4 rounded-lg">
//                   <div className="flex items-center mb-2">
//                     <div className="text-green-500 mr-2">⏱️</div>
//                     <p className="text-sm text-gray-600">Estimated Arrival</p>
//                   </div>
//                   <p className="text-2xl font-bold text-green-600">{eta || 'Calculating...'}</p>
//                 </div>
//               </div>
              
//               {distance && parseFloat(distance) > 50 && (
//                 <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
//                   <p className="text-sm text-yellow-800">
//                     <span className="font-semibold">Note:</span> Your driver is approximately {distance} away. 
//                     This is a long-distance ride. Estimated travel time is {eta}.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//           <h3 className="font-bold text-lg mb-4">Trip Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">From</p>
//               <p className="font-medium">{formatAddress(details.pickup)}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">To</p>
//               <p className="font-medium">{formatAddress(details.dropoff)}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Vehicle</p>
//               <p className="font-medium">{details.vehicleDetails?.name || 'Standard Car'}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Time</p>
//               <p className="font-medium">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString() : 'N/A'}
//                 {details.hour && ` at ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Help Section */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
//           <h4 className="font-semibold text-yellow-800 mb-2">Need Help?</h4>
//           <p className="text-yellow-700 text-sm mb-3">
//             If you're experiencing issues with tracking:
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               🔄 Refresh Page
//             </button>
//             <a
//               href="tel:+911234567890"
//               className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               📞 Emergency Support
//             </a>
//             {driverInfo?.phone && (
//               <a
//                 href={`tel:${driverInfo.phone}`}
//                 className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//               >
//                 📱 Call Driver
//               </a>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;


// COMPLETE TrackRidePage.jsx - Replace entire file with this
// src/pages/customer/TrackRidePage.jsx - COMPLETE FIXED VERSION
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UberStyleTracking } from '../utils/uberTracking';
// import { CustomerLocationService } from '../services/firebaseService';
// import MapWithTracking from '../components/MapWithTracking';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};
  
//   const [bookingData, setBookingData] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [liveRoute, setLiveRoute] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [mapLoaded, setMapLoaded] = useState(false);
  
//   // Initialize tracking service with mock API (no backend needed)
//   const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
//   const [trackingService] = useState(() => 
//     new UberStyleTracking(MAP_MY_INDIA_API_KEY, true) // true = use mock API
//   );
  
//   const unsubscribeRef = useRef(null);
//   const locationIntervalRef = useRef(null);
//   const driverLocationRef = useRef(null);
//   const previousDriverLoc = useRef(null);
//   const locationHistoryRef = useRef([]);
//   const isInitializedRef = useRef(false);

//   // Update customer location
//   const updateCustomerLocation = useCallback(async () => {
//     if (!bookingId || !user?.uid) return;

//     try {
//       if (!navigator.geolocation) {
//         toast.error('Your browser does not support location services');
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//             timestamp: Date.now(),
//             accuracy: position.coords.accuracy,
//             speed: position.coords.speed || 0,
//             heading: position.coords.heading || null
//           };

//           console.log('📍 Customer location updated:', userLocation);
          
//           try {
//             await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
//             setCustomerLocation(userLocation);
            
//             // Calculate ETA if driver location exists
//             if (driverLocationRef.current) {
//               await calculateUberETA(driverLocationRef.current, userLocation);
//             }
//           } catch (error) {
//             console.error('Error updating customer location in Firebase:', error);
//           }
//         },
//         (error) => {
//           console.warn('Location error:', error.message);
//           // Don't show timeout errors to user
//           if (error.code !== 3) { // 3 = TIMEOUT
//             toast.error(`Location error: ${error.message}`);
//           }
//         },
//         { 
//           enableHighAccuracy: false, 
//           timeout: 10000,
//           maximumAge: 30000 
//         }
//       );
//     } catch (error) {
//       console.error('Update location error:', error);
//     }
//   }, [bookingId, user?.uid]);

//   // Calculate Uber-style ETA - FIXED VERSION
//   const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
//     try {
//       console.log('📍 Calculating ETA between:', {
//         driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
//         customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
//       });
      
//       // Store location in history for speed calculation
//       const newLocation = {
//         ...driverLoc,
//         timestamp: Date.now()
//       };
      
//       locationHistoryRef.current.push(newLocation);
      
//       // Keep only last 10 locations
//       if (locationHistoryRef.current.length > 10) {
//         locationHistoryRef.current.shift();
//       }
      
//       // Get route information
//       const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
//       if (route) {
//         setLiveRoute(route);
        
//         // Calculate intelligent ETA
//         const trafficFactor = route.trafficFactor || 1.2;
//         const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
//         // Format for display
//         const formattedDistance = trackingService.formatDistance(route.distance);
//         const formattedETA = trackingService.formatETA(etaMinutes);
        
//         // Update state
//         setDistance(formattedDistance);
//         setEta(formattedETA);
        
//         console.log('🚕 Tracking info:', {
//           distance: formattedDistance,
//           eta: formattedETA,
//           distanceMeters: route.distance,
//           etaMinutes,
//           trafficFactor,
//           fromMockAPI: route.mock,
//           fromDirect: route.direct,
//           fromFallback: route.fallback
//         });
        
//         return { distance: formattedDistance, eta: formattedETA };
//       }
//     } catch (error) {
//       console.error('ETA calculation error:', error);
      
//       // Simple fallback calculation
//       const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
//       const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
//       const formattedDistance = trackingService.formatDistance(simpleDistance);
//       const formattedETA = trackingService.formatETA(simpleETA);
      
//       setDistance(formattedDistance);
//       setEta(formattedETA);
      
//       console.log('⚠️ Using fallback calculation:', {
//         distance: formattedDistance,
//         eta: formattedETA
//       });
      
//       return { distance: formattedDistance, eta: formattedETA };
//     }
//   }, [trackingService]);

//   // Main tracking listener - FIXED VERSION
//   useEffect(() => {
//     if (!bookingId) {
//       console.log('❌ No booking ID provided');
//       setLoading(false);
//       toast.error('No booking ID provided');
//       return;
//     }

//     // Prevent multiple initializations
//     if (isInitializedRef.current) {
//       console.log('⚠️ Already initialized, skipping...');
//       return;
//     }

//     isInitializedRef.current = true;
//     console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

//     // Subscribe to ride tracking
//     unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
//       bookingId,
//       async (data) => {
//         if (data.error) {
//           console.error('Tracking error:', data.error);
//           toast.error('Failed to track ride');
//           return;
//         }

//         const { bookingData, driverLocation, customerLocation } = data;
        
//         // Update booking data
//         setBookingData(bookingData);
        
//         // Update driver info
//         if (bookingData.driverId) {
//           setDriverInfo({
//             name: bookingData.driverName || 'Driver',
//             phone: bookingData.driverPhone || 'Not available',
//             vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
//             rating: bookingData.driverRating || '4.8',
//             driverId: bookingData.driverId
//           });
//         }
        
//         // Update customer location
//         if (customerLocation) {
//           setCustomerLocation(customerLocation);
//         }
        
//         // Update driver location
//         if (driverLocation && !driverLocation.error) {
//           // Store for animation
//           if (driverLocationRef.current) {
//             previousDriverLoc.current = driverLocationRef.current;
//           }
          
//           driverLocationRef.current = driverLocation;
//           setDriverLocation(driverLocation);
          
//           // Calculate ETA if we have customer location
//           if (customerLocation) {
//             await calculateUberETA(driverLocation, customerLocation);
//           }
//         } else if (driverLocation?.error) {
//           console.warn('Driver location error:', driverLocation.error);
//         }
        
//         setLoading(false);
//       }
//     );

//     // Initial customer location update
//     updateCustomerLocation();
    
//     // Update customer location every 30 seconds
//     locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);

//     return () => {
//       console.log('🧹 Cleaning up tracking listeners');
//       isInitializedRef.current = false;
      
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
      
//       if (locationIntervalRef.current) {
//         clearInterval(locationIntervalRef.current);
//       }
//     };
//   }, [bookingId, calculateUberETA, updateCustomerLocation]);

//   // Helper functions
//   const formatTime = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatAddress = (location) => {
//     if (!location) return 'Location not available';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     return 'Location specified';
//   };

//   const handleRefresh = () => {
//     updateCustomerLocation();
//     toast.info('Refreshing your location...');
//   };

//   const openMapNavigation = () => {
//     if (driverLocation) {
//       window.open(
//         `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
//         '_blank'
//       );
//     }
//   };

//   const handleCallDriver = () => {
//     if (driverInfo?.phone && driverInfo.phone !== 'Not available') {
//       window.location.href = `tel:${driverInfo.phone}`;
//     } else {
//       toast.error('Driver phone number not available');
//     }
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Starting live tracking...</p>
//           <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
//         </div>
//       </div>
//     );
//   }

//   if (!bookingData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <h2 className="text-xl font-bold text-red-600 mb-2">Booking Not Found</h2>
//           <p className="text-gray-600 mb-4">The booking you're trying to track doesn't exist</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastContainer position="top-right" autoClose={3000} />
      
//       {/* Header */}
//       <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">Live Ride Tracking</h1>
//             <p className="text-gray-600 text-sm">
//               Booking: {bookingId?.substring(0, 10)}...
//               {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
//             </p>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={handleRefresh}
//               className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium flex items-center transition text-sm"
//             >
//               <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               Refresh Location
//             </button>
//             <button
//               onClick={() => navigate(-1)}
//               className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm"
//             >
//               ← Back
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto p-4">
//         {/* Status Banner */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6 shadow-lg">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//             <div>
//               <h2 className="text-xl font-bold mb-2">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-4 h-4 rounded-full mr-3 ${
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-lg font-semibold">
//                   {bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                   {bookingData?.status === 'completed' && '✓ Ride completed'}
//                   {!bookingData?.status && 'Status unavailable'}
//                 </span>
//               </div>
//             </div>
            
//             {distance && eta && (
//               <div className="text-right bg-white/20 p-4 rounded-lg">
//                 <div className="text-sm opacity-90">Distance to you</div>
//                 <div className="text-2xl font-bold">{distance}</div>
//                 <div className="text-sm">ETA: {eta}</div>
//                 {liveRoute?.fallback && (
//                   <div className="text-xs opacity-75 mt-1">*Estimated</div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Driver Info Card */}
//         {driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//               <div className="flex items-center">
//                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
//                   <span className="text-xl">👤</span>
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-lg">Your Driver</h3>
//                   <p className="text-xl font-semibold">{driverInfo.name}</p>
//                   <div className="flex flex-wrap items-center gap-2 mt-1">
//                     <p className="text-gray-600">{driverInfo.vehicle}</p>
//                     <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-sm">
//                       ⭐ {driverInfo.rating}
//                     </span>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="flex flex-col sm:flex-row gap-2">
//                 <button
//                   onClick={handleCallDriver}
//                   className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                 >
//                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   Call Driver
//                 </button>
//                 {driverLocation && (
//                   <button
//                     onClick={openMapNavigation}
//                     className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                   >
//                     <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                     </svg>
//                     Navigate to Driver
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Map Section */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-6">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
//             <h3 className="font-bold text-lg">Live Tracking Map</h3>
//             <div className="text-sm text-gray-500 flex items-center">
//               {driverLocation && (
//                 <span className="flex items-center mr-2">
//                   <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
//                   Driver Moving
//                 </span>
//               )}
//               {eta && <span>ETA: {eta}</span>}
//             </div>
//           </div>
          
//           <div className="h-96 rounded-lg bg-gray-200">
//             {driverLocation && customerLocation ? (
//               <MapWithTracking
//                 driverLocation={driverLocation}
//                 customerLocation={customerLocation}
//                 pickupLocation={details.pickup}
//                 dropoffLocation={details.dropoff}
//                 routeData={liveRoute}
//                 apiKey={MAP_MY_INDIA_API_KEY}
//                 showPredictions={true}
//               />
//             ) : (
//               <div className="h-full flex items-center justify-center">
//                 <div className="text-center">
//                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
//                   <p className="text-gray-600">Loading live map...</p>
//                   {!driverLocation && (
//                     <p className="text-sm text-gray-500">Waiting for driver location</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
          
//           {/* Map Legend */}
//           <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
//             <div className="flex flex-wrap gap-4">
//               <div className="flex items-center">
//                 <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                 <span className="text-sm text-gray-600">Your Driver</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
//                 <span className="text-sm text-gray-600">Your Location</span>
//               </div>
//               {liveRoute && (
//                 <div className="flex items-center">
//                   <div className="w-8 h-1 bg-blue-400 mr-2"></div>
//                   <span className="text-sm text-gray-600">Route ({distance})</span>
//                 </div>
//               )}
//             </div>
//             {liveRoute?.fallback && (
//               <div className="text-xs text-yellow-600">
//                 *Using estimated route
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Location Information */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//           <h3 className="font-bold text-lg mb-4">Live Tracking Info</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//             {/* Driver Location */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex items-center mb-3">
//                 <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                 <h4 className="font-semibold text-gray-700">Driver Location</h4>
//                 <span className="ml-auto text-xs px-2 py-1 bg-green-100 text-green-700 rounded flex items-center">
//                   <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
//                   Live
//                 </span>
//               </div>
              
//               {driverLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-sm">{driverLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-sm">{driverLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Last Updated</p>
//                       <p className="font-mono text-sm">
//                         {driverLocation.timestamp 
//                           ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
//                               hour: '2-digit', 
//                               minute: '2-digit', 
//                               second: '2-digit' 
//                             })
//                           : 'Just now'
//                         }
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Accuracy</p>
//                       <p className="font-mono text-sm">
//                         {driverLocation.accuracy 
//                           ? `±${Math.round(driverLocation.accuracy)}m`
//                           : 'Unknown'
//                         }
//                       </p>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center text-xs text-gray-500">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
//                     <span>Real-time from driver's device</span>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-4">
//                   <p className="text-gray-500">Driver location not available</p>
//                   <p className="text-sm text-gray-400 mt-1">Driver will appear when they start sharing location</p>
//                 </div>
//               )}
//             </div>
            
//             {/* Your Location */}
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <div className="flex items-center mb-3">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                 <h4 className="font-semibold text-gray-700">Your Location</h4>
//                 <span className="ml-auto text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
//                   {customerLocation ? 'Active' : 'Inactive'}
//                 </span>
//               </div>
              
//               {customerLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-sm">{customerLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-sm">{customerLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Accuracy</p>
//                       <p className="font-mono text-sm">
//                         {customerLocation.accuracy 
//                           ? `±${Math.round(customerLocation.accuracy)}m`
//                           : 'Unknown'
//                         }
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Last Updated</p>
//                       <p className="font-mono text-sm">
//                         {customerLocation.timestamp 
//                           ? new Date(customerLocation.timestamp).toLocaleTimeString([], { 
//                               hour: '2-digit', 
//                               minute: '2-digit' 
//                             })
//                           : 'Just now'
//                         }
//                       </p>
//                     </div>
//                   </div>
                  
//                   <button
//                     onClick={handleRefresh}
//                     className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                     </svg>
//                     Update My Location
//                   </button>
//                 </div>
//               ) : (
//                 <div>
//                   <p className="text-gray-500 mb-3">Your location not shared</p>
//                   <button
//                     onClick={handleRefresh}
//                     className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
//                     </svg>
//                     Share My Location
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Distance & ETA */}
//           {(distance || eta) && (
//             <div className="border-t border-gray-200 pt-6">
//               <h4 className="font-semibold text-gray-700 mb-4">Trip Information</h4>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="bg-blue-50 p-4 rounded-lg">
//                   <div className="flex items-center mb-2">
//                     <div className="text-blue-500 mr-2">📏</div>
//                     <p className="text-sm text-gray-600">Distance</p>
//                   </div>
//                   <p className="text-2xl font-bold text-blue-600">{distance}</p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {liveRoute?.fallback 
//                       ? 'Estimated driving distance' 
//                       : 'Real driving distance'
//                     }
//                   </p>
//                 </div>
//                 <div className="bg-green-50 p-4 rounded-lg">
//                   <div className="flex items-center mb-2">
//                     <div className="text-green-500 mr-2">⏱️</div>
//                     <p className="text-sm text-gray-600">Estimated Arrival</p>
//                   </div>
//                   <p className="text-2xl font-bold text-green-600">{eta}</p>
//                   <p className="text-xs text-gray-500 mt-1">
//                     {liveRoute?.fallback 
//                       ? 'Based on average speed' 
//                       : 'Includes traffic data'
//                     }
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//           <h3 className="font-bold text-lg mb-4">Trip Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">From</p>
//               <p className="font-medium">{formatAddress(details.pickup)}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">To</p>
//               <p className="font-medium">{formatAddress(details.dropoff)}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Vehicle</p>
//               <p className="font-medium">{details.vehicleDetails?.name || 'Standard Car'}</p>
//             </div>
//             <div className="bg-gray-50 p-4 rounded-lg">
//               <p className="text-gray-600 text-sm mb-1">Time</p>
//               <p className="font-medium">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString() : 'N/A'}
//                 {details.hour && ` at ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Help Section */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
//           <h4 className="font-semibold text-yellow-800 mb-2">Need Help?</h4>
//           <p className="text-yellow-700 text-sm mb-3">
//             If you're experiencing issues with tracking:
//           </p>
//           <div className="flex flex-col sm:flex-row gap-3">
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               🔄 Refresh Page
//             </button>
//             <a
//               href="tel:+911234567890"
//               className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               📞 Emergency Support
//             </a>
//             <button
//               onClick={handleCallDriver}
//               className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               📱 Call Driver
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;


// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UberStyleTracking } from '../utils/uberTracking';
// import { CustomerLocationService } from '../services/firebaseService';
// import MapWithTracking from '../components/MapWithTracking';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};
  
//   const [bookingData, setBookingData] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [liveRoute, setLiveRoute] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [mapLoaded, setMapLoaded] = useState(false);
  
//   const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
//   const [trackingService] = useState(() => 
//     new UberStyleTracking(MAP_MY_INDIA_API_KEY, true)
//   );
  
//   const unsubscribeRef = useRef(null);
//   const locationIntervalRef = useRef(null);
//   const driverLocationRef = useRef(null);
//   const previousDriverLoc = useRef(null);
//   const locationHistoryRef = useRef([]);
//   const isInitializedRef = useRef(false);

//   const updateCustomerLocation = useCallback(async () => {
//     if (!bookingId || !user?.uid) return;

//     try {
//       if (!navigator.geolocation) {
//         toast.error('Your browser does not support location services');
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//             timestamp: Date.now(),
//             accuracy: position.coords.accuracy,
//             speed: position.coords.speed || 0,
//             heading: position.coords.heading || null
//           };

//           console.log('📍 Customer location updated:', userLocation);
          
//           try {
//             await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
//             setCustomerLocation(userLocation);
            
//             if (driverLocationRef.current) {
//               await calculateUberETA(driverLocationRef.current, userLocation);
//             }
//           } catch (error) {
//             console.error('Error updating customer location in Firebase:', error);
//           }
//         },
//         (error) => {
//           console.warn('Location error:', error.message);
//           if (error.code !== 3) {
//             toast.error(`Location error: ${error.message}`);
//           }
//         },
//         { 
//           enableHighAccuracy: false, 
//           timeout: 10000,
//           maximumAge: 30000 
//         }
//       );
//     } catch (error) {
//       console.error('Update location error:', error);
//     }
//   }, [bookingId, user?.uid]);

//   const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
//     try {
//       console.log('📍 Calculating ETA between:', {
//         driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
//         customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
//       });
      
//       const newLocation = {
//         ...driverLoc,
//         timestamp: Date.now()
//       };
      
//       locationHistoryRef.current.push(newLocation);
      
//       if (locationHistoryRef.current.length > 10) {
//         locationHistoryRef.current.shift();
//       }
      
//       const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
//       if (route) {
//         setLiveRoute(route);
        
//         const trafficFactor = route.trafficFactor || 1.2;
//         const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
//         const formattedDistance = trackingService.formatDistance(route.distance);
//         const formattedETA = trackingService.formatETA(etaMinutes);
        
//         setDistance(formattedDistance);
//         setEta(formattedETA);
        
//         console.log('🚕 Tracking info:', {
//           distance: formattedDistance,
//           eta: formattedETA,
//           distanceMeters: route.distance,
//           etaMinutes,
//           trafficFactor,
//           fromMockAPI: route.mock,
//           fromDirect: route.direct,
//           fromFallback: route.fallback
//         });
        
//         return { distance: formattedDistance, eta: formattedETA };
//       }
//     } catch (error) {
//       console.error('ETA calculation error:', error);
      
//       const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
//       const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
//       const formattedDistance = trackingService.formatDistance(simpleDistance);
//       const formattedETA = trackingService.formatETA(simpleETA);
      
//       setDistance(formattedDistance);
//       setEta(formattedETA);
      
//       console.log('⚠️ Using fallback calculation:', {
//         distance: formattedDistance,
//         eta: formattedETA
//       });
      
//       return { distance: formattedDistance, eta: formattedETA };
//     }
//   }, [trackingService]);

//   useEffect(() => {
//     if (!bookingId) {
//       console.log('❌ No booking ID provided');
//       setLoading(false);
//       toast.error('No booking ID provided');
//       return;
//     }

//     if (isInitializedRef.current) {
//       console.log('⚠️ Already initialized, skipping...');
//       return;
//     }

//     isInitializedRef.current = true;
//     console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

//     unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
//       bookingId,
//       async (data) => {
//         if (data.error) {
//           console.error('Tracking error:', data.error);
//           toast.error('Failed to track ride');
//           return;
//         }

//         const { bookingData, driverLocation, customerLocation } = data;
        
//         setBookingData(bookingData);
        
//         if (bookingData.driverId) {
//           setDriverInfo({
//             name: bookingData.driverName || 'Driver',
//             phone: bookingData.driverPhone || 'Not available',
//             vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
//             rating: bookingData.driverRating || '4.8',
//             driverId: bookingData.driverId
//           });
//         }
        
//         if (customerLocation) {
//           setCustomerLocation(customerLocation);
//         }
        
//         if (driverLocation && !driverLocation.error) {
//           if (driverLocationRef.current) {
//             previousDriverLoc.current = driverLocationRef.current;
//           }
          
//           driverLocationRef.current = driverLocation;
//           setDriverLocation(driverLocation);
          
//           if (customerLocation) {
//             await calculateUberETA(driverLocation, customerLocation);
//           }
//         } else if (driverLocation?.error) {
//           console.warn('Driver location error:', driverLocation.error);
//         }
        
//         setLoading(false);
//       }
//     );

//     updateCustomerLocation();
    
//     locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);

//     return () => {
//       console.log('🧹 Cleaning up tracking listeners');
//       isInitializedRef.current = false;
      
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
      
//       if (locationIntervalRef.current) {
//         clearInterval(locationIntervalRef.current);
//       }
//     };
//   }, [bookingId, calculateUberETA, updateCustomerLocation]);

//   const formatTime = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatAddress = (location) => {
//     if (!location) return 'Location not available';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     return 'Location specified';
//   };

//   const handleRefresh = () => {
//     updateCustomerLocation();
//     toast.info('Refreshing your location...');
//   };

//   const openMapNavigation = () => {
//     if (driverLocation) {
//       window.open(
//         `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
//         '_blank'
//       );
//     }
//   };

//   const handleCallDriver = () => {
//     if (driverInfo?.phone && driverInfo.phone !== 'Not available') {
//       window.location.href = `tel:${driverInfo.phone}`;
//     } else {
//       toast.error('Driver phone number not available');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Starting live tracking...</p>
//           <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
//         </div>
//       </div>
//     );
//   }

//   if (!bookingData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
//           <p className="text-gray-600 mb-6">The booking you're trying to track doesn't exist</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 w-full sm:w-auto"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastContainer position="top-center" autoClose={3000} />
      
//       {/* Header */}
//       <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex flex-col space-y-2">
//             <div className="flex items-center justify-between">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="p-2 rounded-full hover:bg-gray-100"
//               >
//                 <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">Live Ride Tracking</h1>
//               <button
//                 onClick={handleRefresh}
//                 className="p-2 rounded-full hover:bg-gray-100"
//               >
//                 <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                 </svg>
//               </button>
//             </div>
//             <p className="text-xs text-gray-500 text-center truncate">
//               Booking: {bookingId?.substring(0, 8)}...
//               {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6">
//         {/* Status Banner */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 mb-4 shadow-lg">
//           <div className="space-y-3">
//             <div>
//               <h2 className="text-lg font-bold mb-1">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-base font-semibold">
//                   {bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                   {bookingData?.status === 'completed' && '✓ Ride completed'}
//                   {!bookingData?.status && 'Status unavailable'}
//                 </span>
//               </div>
//             </div>
            
//             {distance && eta && (
//               <div className="bg-white/20 p-3 rounded-lg">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <div className="text-xs opacity-90">Distance to you</div>
//                     <div className="text-xl font-bold">{distance}</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xs opacity-90">Estimated arrival</div>
//                     <div className="text-xl font-bold">{eta}</div>
//                   </div>
//                 </div>
//                 {liveRoute?.fallback && (
//                   <div className="text-xs opacity-75 mt-1 text-center">*Estimated values</div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Driver Info Card */}
//         {driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//             <div className="flex items-start space-x-3 mb-4">
//               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <span className="text-xl">👤</span>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <h3 className="font-bold text-base">Your Driver</h3>
//                 <p className="text-lg font-semibold truncate">{driverInfo.name}</p>
//                 <div className="flex items-center flex-wrap gap-1 mt-1">
//                   <p className="text-gray-600 text-sm truncate">{driverInfo.vehicle}</p>
//                   <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs ml-2">
//                     ⭐ {driverInfo.rating}
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex gap-2">
//               <button
//                 onClick={handleCallDriver}
//                 className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 Call
//               </button>
//               {driverLocation && (
//                 <button
//                   onClick={openMapNavigation}
//                   className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                 >
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                   </svg>
//                   Navigate
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Map Section */}
//         <div className="bg-white rounded-xl shadow-md p-3 mb-4">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="font-bold text-base">Live Tracking Map</h3>
//             <div className="text-xs text-gray-500 flex items-center">
//               {driverLocation && (
//                 <span className="flex items-center">
//                   <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
//                   Live
//                 </span>
//               )}
//             </div>
//           </div>
          
//           <div className="h-64 sm:h-80 md:h-96 rounded-lg bg-gray-200">
//             {driverLocation && customerLocation ? (
//               <MapWithTracking
//                 driverLocation={driverLocation}
//                 customerLocation={customerLocation}
//                 pickupLocation={details.pickup}
//                 dropoffLocation={details.dropoff}
//                 routeData={liveRoute}
//                 apiKey={MAP_MY_INDIA_API_KEY}
//                 showPredictions={true}
//               />
//             ) : (
//               <div className="h-full flex items-center justify-center">
//                 <div className="text-center">
//                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3 mx-auto"></div>
//                   <p className="text-gray-600 text-sm">Loading live map...</p>
//                 </div>
//               </div>
//             )}
//           </div>
          
//           {/* Map Legend */}
//           <div className="flex flex-wrap justify-center gap-3 mt-3">
//             <div className="flex items-center">
//               <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//               <span className="text-xs text-gray-600">Your Driver</span>
//             </div>
//             <div className="flex items-center">
//               <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//               <span className="text-xs text-gray-600">Your Location</span>
//             </div>
//             {liveRoute && (
//               <div className="flex items-center">
//                 <div className="w-6 h-1 bg-blue-400 mr-2"></div>
//                 <span className="text-xs text-gray-600">Route</span>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Location Information */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//           <h3 className="font-bold text-base mb-3">Live Tracking Info</h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//             {/* Driver Location Card */}
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center">
//                   <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                   <h4 className="font-semibold text-gray-700 text-sm">Driver Location</h4>
//                 </div>
//                 <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
//                   Live
//                 </span>
//               </div>
              
//               {driverLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-xs truncate">{driverLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-xs truncate">{driverLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
//                   <p className="text-xs text-gray-500">
//                     Updated: {driverLocation.timestamp 
//                       ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
//                           hour: '2-digit', 
//                           minute: '2-digit'
//                         })
//                       : 'Just now'
//                     }
//                   </p>
//                 </div>
//               ) : (
//                 <p className="text-gray-500 text-sm text-center py-2">Driver location not available</p>
//               )}
//             </div>
            
//             {/* Your Location Card */}
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <div className="flex items-center justify-between mb-2">
//                 <div className="flex items-center">
//                   <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                   <h4 className="font-semibold text-gray-700 text-sm">Your Location</h4>
//                 </div>
//                 <span className={`text-xs px-2 py-1 rounded ${
//                   customerLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
//                 }`}>
//                   {customerLocation ? 'Active' : 'Inactive'}
//                 </span>
//               </div>
              
//               {customerLocation ? (
//                 <div className="space-y-2">
//                   <div className="grid grid-cols-2 gap-2">
//                     <div>
//                       <p className="text-xs text-gray-500">Latitude</p>
//                       <p className="font-mono text-xs truncate">{customerLocation.lat.toFixed(6)}</p>
//                     </div>
//                     <div>
//                       <p className="text-xs text-gray-500">Longitude</p>
//                       <p className="font-mono text-xs truncate">{customerLocation.lng.toFixed(6)}</p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={handleRefresh}
//                     className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mt-2"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                     </svg>
//                     Update Location
//                   </button>
//                 </div>
//               ) : (
//                 <div className="text-center py-2">
//                   <p className="text-gray-500 text-sm mb-2">Your location not shared</p>
//                   <button
//                     onClick={handleRefresh}
//                     className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
//                   >
//                     <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
//                     </svg>
//                     Share Location
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Distance & ETA */}
//           {(distance || eta) && (
//             <div className="border-t border-gray-200 pt-4">
//               <h4 className="font-semibold text-gray-700 text-sm mb-3">Trip Information</h4>
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                 <div className="bg-blue-50 p-3 rounded-lg">
//                   <div className="flex items-center mb-1">
//                     <div className="text-blue-500 mr-2 text-sm">📏</div>
//                     <p className="text-xs text-gray-600">Distance</p>
//                   </div>
//                   <p className="text-lg font-bold text-blue-600 truncate">{distance}</p>
//                 </div>
//                 <div className="bg-green-50 p-3 rounded-lg">
//                   <div className="flex items-center mb-1">
//                     <div className="text-green-500 mr-2 text-sm">⏱️</div>
//                     <p className="text-xs text-gray-600">ETA</p>
//                   </div>
//                   <p className="text-lg font-bold text-green-600 truncate">{eta}</p>
//                 </div>
//               </div>
//               {liveRoute?.fallback && (
//                 <p className="text-xs text-yellow-600 text-center mt-2">*Based on estimated values</p>
//               )}
//             </div>
//           )}
//         </div>

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//           <h3 className="font-bold text-base mb-3">Trip Details</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">From</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.pickup)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">To</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.dropoff)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Vehicle</p>
//               <p className="font-medium text-sm truncate">{details.vehicleDetails?.name || 'Standard Car'}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Time</p>
//               <p className="font-medium text-sm truncate">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString([], { 
//                   month: 'short', 
//                   day: 'numeric' 
//                 }) : 'N/A'}
//                 {details.hour && ` ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Help Section */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//           <h4 className="font-semibold text-yellow-800 text-base mb-2">Need Help?</h4>
//           <p className="text-yellow-700 text-sm mb-3">
//             If you're experiencing issues with tracking:
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//             <button
//               onClick={() => window.location.reload()}
//               className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//             >
//               🔄 Refresh Page
//             </button>
//             <a
//               href="tel:+911234567890"
//               className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//             >
//               📞 Emergency Support
//             </a>
//             <button
//               onClick={handleCallDriver}
//               className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//             >
//               📱 Call Driver
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Bottom Navigation Bar for Mobile */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between z-10 sm:hidden">
//         <button
//           onClick={handleRefresh}
//           className="flex flex-col items-center text-blue-600"
//         >
//           <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           <span className="text-xs">Refresh</span>
//         </button>
        
//         {driverInfo?.phone && driverInfo.phone !== 'Not available' && (
//           <button
//             onClick={handleCallDriver}
//             className="flex flex-col items-center text-green-600"
//           >
//             <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//             </svg>
//             <span className="text-xs">Call</span>
//           </button>
//         )}
        
//         {driverLocation && (
//           <button
//             onClick={openMapNavigation}
//             className="flex flex-col items-center text-blue-600"
//           >
//             <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//             </svg>
//             <span className="text-xs">Navigate</span>
//           </button>
//         )}
        
//         <button
//           onClick={() => navigate(-1)}
//           className="flex flex-col items-center text-gray-600"
//         >
//           <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//           <span className="text-xs">Back</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;


// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UberStyleTracking } from '../utils/uberTracking';
// import { CustomerLocationService } from '../services/firebaseService';
// import MapWithTracking from '../components/MapWithTracking';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};
  
//   const [bookingData, setBookingData] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [liveRoute, setLiveRoute] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [isCancelled, setIsCancelled] = useState(false);
//   const [cancellationInfo, setCancellationInfo] = useState(null);
  
//   const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
//   const [trackingService] = useState(() => 
//     new UberStyleTracking(MAP_MY_INDIA_API_KEY, true)
//   );
  
//   const unsubscribeRef = useRef(null);
//   const locationIntervalRef = useRef(null);
//   const driverLocationRef = useRef(null);
//   const previousDriverLoc = useRef(null);
//   const locationHistoryRef = useRef([]);
//   const isInitializedRef = useRef(false);

//   const updateCustomerLocation = useCallback(async () => {
//     if (!bookingId || !user?.uid || isCancelled) return;

//     try {
//       if (!navigator.geolocation) {
//         toast.error('Your browser does not support location services');
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//             timestamp: Date.now(),
//             accuracy: position.coords.accuracy,
//             speed: position.coords.speed || 0,
//             heading: position.coords.heading || null
//           };

//           console.log('📍 Customer location updated:', userLocation);
          
//           try {
//             await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
//             setCustomerLocation(userLocation);
            
//             if (driverLocationRef.current) {
//               await calculateUberETA(driverLocationRef.current, userLocation);
//             }
//           } catch (error) {
//             console.error('Error updating customer location in Firebase:', error);
//           }
//         },
//         (error) => {
//           console.warn('Location error:', error.message);
//           if (error.code !== 3) {
//             toast.error(`Location error: ${error.message}`);
//           }
//         },
//         { 
//           enableHighAccuracy: false, 
//           timeout: 10000,
//           maximumAge: 30000 
//         }
//       );
//     } catch (error) {
//       console.error('Update location error:', error);
//     }
//   }, [bookingId, user?.uid, isCancelled]);

//   const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
//     try {
//       console.log('📍 Calculating ETA between:', {
//         driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
//         customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
//       });
      
//       const newLocation = {
//         ...driverLoc,
//         timestamp: Date.now()
//       };
      
//       locationHistoryRef.current.push(newLocation);
      
//       if (locationHistoryRef.current.length > 10) {
//         locationHistoryRef.current.shift();
//       }
      
//       const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
//       if (route) {
//         setLiveRoute(route);
        
//         const trafficFactor = route.trafficFactor || 1.2;
//         const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
//         const formattedDistance = trackingService.formatDistance(route.distance);
//         const formattedETA = trackingService.formatETA(etaMinutes);
        
//         setDistance(formattedDistance);
//         setEta(formattedETA);
        
//         console.log('🚕 Tracking info:', {
//           distance: formattedDistance,
//           eta: formattedETA,
//           distanceMeters: route.distance,
//           etaMinutes,
//           trafficFactor,
//           fromMockAPI: route.mock,
//           fromDirect: route.direct,
//           fromFallback: route.fallback
//         });
        
//         return { distance: formattedDistance, eta: formattedETA };
//       }
//     } catch (error) {
//       console.error('ETA calculation error:', error);
      
//       const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
//       const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
//       const formattedDistance = trackingService.formatDistance(simpleDistance);
//       const formattedETA = trackingService.formatETA(simpleETA);
      
//       setDistance(formattedDistance);
//       setEta(formattedETA);
      
//       console.log('⚠️ Using fallback calculation:', {
//         distance: formattedDistance,
//         eta: formattedETA
//       });
      
//       return { distance: formattedDistance, eta: formattedETA };
//     }
//   }, [trackingService]);

//   useEffect(() => {
//     if (!bookingId) {
//       console.log('❌ No booking ID provided');
//       setLoading(false);
//       toast.error('No booking ID provided');
//       return;
//     }

//     if (isInitializedRef.current) {
//       console.log('⚠️ Already initialized, skipping...');
//       return;
//     }

//     isInitializedRef.current = true;
//     console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

//     unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
//       bookingId,
//       async (data) => {
//         if (data.error) {
//           console.error('Tracking error:', data.error);
//           toast.error('Failed to track ride');
//           return;
//         }

//         const { bookingData, driverLocation, customerLocation } = data;
        
//         setBookingData(bookingData);
        
//         // Check if ride is cancelled
//         if (bookingData.status === 'cancelled') {
//           setIsCancelled(true);
//           setCancellationInfo({
//             cancelledAt: bookingData.cancelledAt,
//             cancelledBy: bookingData.cancelledBy,
//             cancelledReason: bookingData.cancelledReason || 'Ride cancelled by driver',
//             cancelledDriverName: bookingData.cancelledDriverName || 'Driver'
//           });
          
//           toast.error('🚫 This ride has been cancelled by the driver', {
//             autoClose: false,
//             closeButton: true
//           });
          
//           // Clear location intervals
//           if (locationIntervalRef.current) {
//             clearInterval(locationIntervalRef.current);
//           }
//         } else {
//           setIsCancelled(false);
//           setCancellationInfo(null);
//         }
        
//         if (bookingData.driverId && bookingData.status !== 'cancelled') {
//           setDriverInfo({
//             name: bookingData.driverName || 'Driver',
//             phone: bookingData.driverPhone || 'Not available',
//             vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
//             rating: bookingData.driverRating || '4.8',
//             driverId: bookingData.driverId
//           });
//         } else if (bookingData.status === 'cancelled') {
//           setDriverInfo(null);
//         }
        
//         if (customerLocation) {
//           setCustomerLocation(customerLocation);
//         }
        
//         if (driverLocation && !driverLocation.error && bookingData.status !== 'cancelled') {
//           if (driverLocationRef.current) {
//             previousDriverLoc.current = driverLocationRef.current;
//           }
          
//           driverLocationRef.current = driverLocation;
//           setDriverLocation(driverLocation);
          
//           if (customerLocation) {
//             await calculateUberETA(driverLocation, customerLocation);
//           }
//         } else if (driverLocation?.error) {
//           console.warn('Driver location error:', driverLocation.error);
//         }
        
//         setLoading(false);
//       }
//     );

//     if (!isCancelled) {
//       updateCustomerLocation();
//       locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
//     }

//     return () => {
//       console.log('🧹 Cleaning up tracking listeners');
//       isInitializedRef.current = false;
      
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
      
//       if (locationIntervalRef.current) {
//         clearInterval(locationIntervalRef.current);
//       }
//     };
//   }, [bookingId, calculateUberETA, updateCustomerLocation, isCancelled]);

//   const formatTime = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatAddress = (location) => {
//     if (!location) return 'Location not available';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     return 'Location specified';
//   };

//   const handleRefresh = () => {
//     if (!isCancelled) {
//       updateCustomerLocation();
//       toast.info('Refreshing your location...');
//     }
//   };

//   const openMapNavigation = () => {
//     if (driverLocation && !isCancelled) {
//       window.open(
//         `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
//         '_blank'
//       );
//     }
//   };

//   const handleCallDriver = () => {
//     if (driverInfo?.phone && driverInfo.phone !== 'Not available' && !isCancelled) {
//       window.location.href = `tel:${driverInfo.phone}`;
//     } else {
//       toast.error('Driver phone number not available');
//     }
//   };

//   const handleBookNewRide = () => {
//     navigate('/booking', { 
//       state: { 
//         pickup: details.pickup,
//         dropoff: details.dropoff,
//         vehicleDetails: details.vehicleDetails,
//         travelDate: details.travelDate,
//         hour: details.hour,
//         minute: details.minute
//       }
//     });
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Starting live tracking...</p>
//           <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
//         </div>
//       </div>
//     );
//   }

//   if (!bookingData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
//           <p className="text-gray-600 mb-6">The booking you're trying to track doesn't exist</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 w-full sm:w-auto"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastContainer position="top-center" autoClose={3000} />
      
//       {/* Header */}
//       <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex flex-col space-y-2">
//             <div className="flex items-center justify-between">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="p-2 rounded-full hover:bg-gray-100"
//               >
//                 <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">
//                 {isCancelled ? 'Ride Cancelled' : 'Live Ride Tracking'}
//               </h1>
//               {!isCancelled && (
//                 <button
//                   onClick={handleRefresh}
//                   className="p-2 rounded-full hover:bg-gray-100"
//                 >
//                   <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                 </button>
//               )}
//             </div>
//             <p className="text-xs text-gray-500 text-center truncate">
//               Booking: {bookingId?.substring(0, 8)}...
//               {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6">
//         {/* Status Banner */}
//         <div className={`${isCancelled ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white rounded-xl p-4 mb-4 shadow-lg`}>
//           <div className="space-y-3">
//             <div>
//               <h2 className="text-lg font-bold mb-1">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   isCancelled ? 'bg-red-400' :
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-base font-semibold">
//                   {isCancelled && '🚫 Ride Cancelled by Driver'}
//                   {!isCancelled && bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {!isCancelled && bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {!isCancelled && bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {!isCancelled && bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                   {!isCancelled && bookingData?.status === 'completed' && '✓ Ride completed'}
//                   {!isCancelled && !bookingData?.status && 'Status unavailable'}
//                 </span>
//               </div>
//             </div>
            
//             {!isCancelled && distance && eta && (
//               <div className="bg-white/20 p-3 rounded-lg">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <div className="text-xs opacity-90">Distance to you</div>
//                     <div className="text-xl font-bold">{distance}</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xs opacity-90">Estimated arrival</div>
//                     <div className="text-xl font-bold">{eta}</div>
//                   </div>
//                 </div>
//                 {liveRoute?.fallback && (
//                   <div className="text-xs opacity-75 mt-1 text-center">*Estimated values</div>
//                 )}
//               </div>
//             )}
            
//             {isCancelled && cancellationInfo && (
//               <div className="bg-white/20 p-3 rounded-lg">
//                 <div className="space-y-2">
//                   <div>
//                     <div className="text-xs opacity-90">Cancelled by</div>
//                     <div className="text-sm font-semibold">{cancellationInfo.cancelledDriverName || 'Driver'}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs opacity-90">Reason</div>
//                     <div className="text-sm font-semibold">{cancellationInfo.cancelledReason || 'Ride cancelled by driver'}</div>
//                   </div>
//                   {cancellationInfo.cancelledAt && (
//                     <div>
//                       <div className="text-xs opacity-90">Cancelled at</div>
//                       <div className="text-sm font-semibold">
//                         {formatTime(cancellationInfo.cancelledAt)}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Cancellation Action Card */}
//         {isCancelled && (
//           <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
//             <div className="flex items-start">
//               <div className="text-red-500 mr-3">
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-bold text-red-800 text-lg mb-2">Ride Cancelled</h3>
//                 <p className="text-red-700 mb-3">
//                   The driver has cancelled this ride. We apologize for the inconvenience.
//                 </p>
//                 <div className="flex flex-col sm:flex-row gap-2">
//                   <button
//                     onClick={handleBookNewRide}
//                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex-1 text-center"
//                   >
//                     Book New Ride
//                   </button>
//                   <button
//                     onClick={() => navigate('/support')}
//                     className="bg-white hover:bg-gray-100 text-red-600 border border-red-300 px-4 py-3 rounded-lg font-medium flex-1 text-center"
//                   >
//                     Contact Support
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Driver Info Card - Only show if not cancelled */}
//         {!isCancelled && driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//             <div className="flex items-start space-x-3 mb-4">
//               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <span className="text-xl">👤</span>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <h3 className="font-bold text-base">Your Driver</h3>
//                 <p className="text-lg font-semibold truncate">{driverInfo.name}</p>
//                 <div className="flex items-center flex-wrap gap-1 mt-1">
//                   <p className="text-gray-600 text-sm truncate">{driverInfo.vehicle}</p>
//                   <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs ml-2">
//                     ⭐ {driverInfo.rating}
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex gap-2">
//               <button
//                 onClick={handleCallDriver}
//                 className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 Call
//               </button>
//               {driverLocation && (
//                 <button
//                   onClick={openMapNavigation}
//                   className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                 >
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                   </svg>
//                   Navigate
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Map Section - Only show if not cancelled and driver location available */}
//         {!isCancelled && (
//           <div className="bg-white rounded-xl shadow-md p-3 mb-4">
//             <div className="flex justify-between items-center mb-3">
//               <h3 className="font-bold text-base">Live Tracking Map</h3>
//               <div className="text-xs text-gray-500 flex items-center">
//                 {driverLocation && (
//                   <span className="flex items-center">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
//                     Live
//                   </span>
//                 )}
//               </div>
//             </div>
            
//             <div className="h-64 sm:h-80 md:h-96 rounded-lg bg-gray-200">
//               {driverLocation && customerLocation ? (
//                 <MapWithTracking
//                   driverLocation={driverLocation}
//                   customerLocation={customerLocation}
//                   pickupLocation={details.pickup}
//                   dropoffLocation={details.dropoff}
//                   routeData={liveRoute}
//                   apiKey={MAP_MY_INDIA_API_KEY}
//                   showPredictions={true}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="text-center">
//                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3 mx-auto"></div>
//                     <p className="text-gray-600 text-sm">Loading live map...</p>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Map Legend */}
//             <div className="flex flex-wrap justify-center gap-3 mt-3">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                 <span className="text-xs text-gray-600">Your Driver</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                 <span className="text-xs text-gray-600">Your Location</span>
//               </div>
//               {liveRoute && (
//                 <div className="flex items-center">
//                   <div className="w-6 h-1 bg-blue-400 mr-2"></div>
//                   <span className="text-xs text-gray-600">Route</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Location Information - Only show if not cancelled */}
//         {!isCancelled && (
//           <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//             <h3 className="font-bold text-base mb-3">Live Tracking Info</h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//               {/* Driver Location Card */}
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center">
//                     <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                     <h4 className="font-semibold text-gray-700 text-sm">Driver Location</h4>
//                   </div>
//                   <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
//                     Live
//                   </span>
//                 </div>
                
//                 {driverLocation ? (
//                   <div className="space-y-2">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <p className="text-xs text-gray-500">Latitude</p>
//                         <p className="font-mono text-xs truncate">{driverLocation.lat.toFixed(6)}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Longitude</p>
//                         <p className="font-mono text-xs truncate">{driverLocation.lng.toFixed(6)}</p>
//                       </div>
//                     </div>
//                     <p className="text-xs text-gray-500">
//                       Updated: {driverLocation.timestamp 
//                         ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
//                             hour: '2-digit', 
//                             minute: '2-digit'
//                           })
//                         : 'Just now'
//                       }
//                     </p>
//                   </div>
//                 ) : (
//                   <p className="text-gray-500 text-sm text-center py-2">Driver location not available</p>
//                 )}
//               </div>
              
//               {/* Your Location Card */}
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center">
//                     <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                     <h4 className="font-semibold text-gray-700 text-sm">Your Location</h4>
//                   </div>
//                   <span className={`text-xs px-2 py-1 rounded ${
//                     customerLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
//                   }`}>
//                     {customerLocation ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>
                
//                 {customerLocation ? (
//                   <div className="space-y-2">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <p className="text-xs text-gray-500">Latitude</p>
//                         <p className="font-mono text-xs truncate">{customerLocation.lat.toFixed(6)}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Longitude</p>
//                         <p className="font-mono text-xs truncate">{customerLocation.lng.toFixed(6)}</p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={handleRefresh}
//                       className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mt-2"
//                     >
//                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                       </svg>
//                       Update Location
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="text-center py-2">
//                     <p className="text-gray-500 text-sm mb-2">Your location not shared</p>
//                     <button
//                       onClick={handleRefresh}
//                       className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
//                     >
//                       <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
//                       </svg>
//                       Share Location
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Distance & ETA */}
//             {(distance || eta) && (
//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-semibold text-gray-700 text-sm mb-3">Trip Information</h4>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <div className="bg-blue-50 p-3 rounded-lg">
//                     <div className="flex items-center mb-1">
//                       <div className="text-blue-500 mr-2 text-sm">📏</div>
//                       <p className="text-xs text-gray-600">Distance</p>
//                     </div>
//                     <p className="text-lg font-bold text-blue-600 truncate">{distance}</p>
//                   </div>
//                   <div className="bg-green-50 p-3 rounded-lg">
//                     <div className="flex items-center mb-1">
//                       <div className="text-green-500 mr-2 text-sm">⏱️</div>
//                       <p className="text-xs text-gray-600">ETA</p>
//                     </div>
//                     <p className="text-lg font-bold text-green-600 truncate">{eta}</p>
//                   </div>
//                 </div>
//                 {liveRoute?.fallback && (
//                   <p className="text-xs text-yellow-600 text-center mt-2">*Based on estimated values</p>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//           <h3 className="font-bold text-base mb-3">Trip Details</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">From</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.pickup)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">To</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.dropoff)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Vehicle</p>
//               <p className="font-medium text-sm truncate">{details.vehicleDetails?.name || 'Standard Car'}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Time</p>
//               <p className="font-medium text-sm truncate">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString([], { 
//                   month: 'short', 
//                   day: 'numeric' 
//                 }) : 'N/A'}
//                 {details.hour && ` ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Help Section */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//           <h4 className="font-semibold text-yellow-800 text-base mb-2">Need Help?</h4>
//           <p className="text-yellow-700 text-sm mb-3">
//             {isCancelled ? 'Your ride has been cancelled. What would you like to do?' : 'If you\'re experiencing issues with tracking:'}
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//             {isCancelled ? (
//               <>
//                 <button
//                   onClick={handleBookNewRide}
//                   className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   🚗 Book New Ride
//                 </button>
//                 <a
//                   href="tel:+911234567890"
//                   className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📞 Contact Support
//                 </a>
//                 <button
//                   onClick={() => navigate('/my-bookings')}
//                   className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📋 My Bookings
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={() => window.location.reload()}
//                   className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   🔄 Refresh Page
//                 </button>
//                 <a
//                   href="tel:+911234567890"
//                   className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📞 Emergency Support
//                 </a>
//                 <button
//                   onClick={handleCallDriver}
//                   className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📱 Call Driver
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Bottom Navigation Bar for Mobile */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between z-10 sm:hidden">
//         {!isCancelled && (
//           <>
//             <button
//               onClick={handleRefresh}
//               className="flex flex-col items-center text-blue-600"
//             >
//               <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               <span className="text-xs">Refresh</span>
//             </button>
            
//             {driverInfo?.phone && driverInfo.phone !== 'Not available' && (
//               <button
//                 onClick={handleCallDriver}
//                 className="flex flex-col items-center text-green-600"
//               >
//                 <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 <span className="text-xs">Call</span>
//               </button>
//             )}
            
//             {driverLocation && (
//               <button
//                 onClick={openMapNavigation}
//                 className="flex flex-col items-center text-blue-600"
//               >
//                 <svg className="w-5 h-5 mb-1" fill="currentColor" viewBox="0 0 20 20">
//                   <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                 </svg>
//                 <span className="text-xs">Navigate</span>
//               </button>
//             )}
//           </>
//         )}
        
//         <button
//           onClick={() => navigate(-1)}
//           className="flex flex-col items-center text-gray-600"
//         >
//           <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//           <span className="text-xs">Back</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;


// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { UberStyleTracking } from '../utils/uberTracking';
// import { CustomerLocationService } from '../services/firebaseService';
// import MapWithTracking from '../components/MapWithTracking';

// const TrackRidePage = () => {
//   const { state } = useLocation();
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const bookingId = state?.bookingId;
//   const details = state?.bookingDetails || {};
  
//   const [bookingData, setBookingData] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [driverInfo, setDriverInfo] = useState(null);
//   const [distance, setDistance] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [liveRoute, setLiveRoute] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [isCancelled, setIsCancelled] = useState(false);
//   const [cancellationInfo, setCancellationInfo] = useState(null);
//   const [showCancelForm, setShowCancelForm] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');
//   const [cancelDescription, setCancelDescription] = useState('');
//   const [refundAccount, setRefundAccount] = useState('');
//   const [refundPhone, setRefundPhone] = useState('');
  
//   const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
//   const [trackingService] = useState(() => 
//     new UberStyleTracking(MAP_MY_INDIA_API_KEY, true)
//   );
  
//   const unsubscribeRef = useRef(null);
//   const locationIntervalRef = useRef(null);
//   const driverLocationRef = useRef(null);
//   const previousDriverLoc = useRef(null);
//   const locationHistoryRef = useRef([]);
//   const isInitializedRef = useRef(false);
//   const toastShownRef = useRef(false); // To prevent multiple toast messages

//   const updateCustomerLocation = useCallback(async () => {
//     if (!bookingId || !user?.uid || isCancelled) return;

//     try {
//       if (!navigator.geolocation) {
//         toast.error('Your browser does not support location services');
//         return;
//       }

//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const userLocation = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude,
//             timestamp: Date.now(),
//             accuracy: position.coords.accuracy,
//             speed: position.coords.speed || 0,
//             heading: position.coords.heading || null
//           };

//           console.log('📍 Customer location updated:', userLocation);
          
//           try {
//             await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
//             setCustomerLocation(userLocation);
            
//             if (driverLocationRef.current) {
//               await calculateUberETA(driverLocationRef.current, userLocation);
//             }
//           } catch (error) {
//             console.error('Error updating customer location in Firebase:', error);
//           }
//         },
//         (error) => {
//           console.warn('Location error:', error.message);
//           if (error.code !== 3) {
//             toast.error(`Location error: ${error.message}`);
//           }
//         },
//         { 
//           enableHighAccuracy: false, 
//           timeout: 10000,
//           maximumAge: 30000 
//         }
//       );
//     } catch (error) {
//       console.error('Update location error:', error);
//     }
//   }, [bookingId, user?.uid, isCancelled]);

//   const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
//     try {
//       console.log('📍 Calculating ETA between:', {
//         driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
//         customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
//       });
      
//       const newLocation = {
//         ...driverLoc,
//         timestamp: Date.now()
//       };
      
//       locationHistoryRef.current.push(newLocation);
      
//       if (locationHistoryRef.current.length > 10) {
//         locationHistoryRef.current.shift();
//       }
      
//       const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
//       if (route) {
//         setLiveRoute(route);
        
//         const trafficFactor = route.trafficFactor || 1.2;
//         const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
//         const formattedDistance = trackingService.formatDistance(route.distance);
//         const formattedETA = trackingService.formatETA(etaMinutes);
        
//         setDistance(formattedDistance);
//         setEta(formattedETA);
        
//         console.log('🚕 Tracking info:', {
//           distance: formattedDistance,
//           eta: formattedETA,
//           distanceMeters: route.distance,
//           etaMinutes,
//           trafficFactor,
//           fromMockAPI: route.mock,
//           fromDirect: route.direct,
//           fromFallback: route.fallback
//         });
        
//         return { distance: formattedDistance, eta: formattedETA };
//       }
//     } catch (error) {
//       console.error('ETA calculation error:', error);
      
//       const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
//       const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
//       const formattedDistance = trackingService.formatDistance(simpleDistance);
//       const formattedETA = trackingService.formatETA(simpleETA);
      
//       setDistance(formattedDistance);
//       setEta(formattedETA);
      
//       console.log('⚠️ Using fallback calculation:', {
//         distance: formattedDistance,
//         eta: formattedETA
//       });
      
//       return { distance: formattedDistance, eta: formattedETA };
//     }
//   }, [trackingService]);

//   // Handle cancellation toast - show only once
//   const showCancellationToast = useCallback(() => {
//     if (!toastShownRef.current && cancellationInfo) {
//       toast.error('🚫 This ride has been cancelled by the driver', {
//         autoClose: 5000,
//         closeButton: true,
//         toastId: 'cancellation-toast' // Unique ID to prevent duplicates
//       });
//       toastShownRef.current = true;
//     }
//   }, [cancellationInfo]);

//   useEffect(() => {
//     if (!bookingId) {
//       console.log('❌ No booking ID provided');
//       setLoading(false);
//       toast.error('No booking ID provided');
//       return;
//     }

//     if (isInitializedRef.current) {
//       console.log('⚠️ Already initialized, skipping...');
//       return;
//     }

//     isInitializedRef.current = true;
//     console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

//     unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
//       bookingId,
//       async (data) => {
//         if (data.error) {
//           console.error('Tracking error:', data.error);
//           toast.error('Failed to track ride');
//           return;
//         }

//         const { bookingData, driverLocation, customerLocation } = data;
        
//         setBookingData(bookingData);
        
//         // Check if ride is cancelled
//         if (bookingData.status === 'cancelled') {
//           setIsCancelled(true);
//           setCancellationInfo({
//             cancelledAt: bookingData.cancelledAt,
//             cancelledBy: bookingData.cancelledBy,
//             cancelledReason: bookingData.cancelledReason || 'Ride cancelled by driver',
//             cancelledDriverName: bookingData.cancelledDriverName || 'Driver'
//           });
          
//           // Show cancellation toast only once
//           showCancellationToast();
          
//           // Clear location intervals
//           if (locationIntervalRef.current) {
//             clearInterval(locationIntervalRef.current);
//           }
//         } else {
//           setIsCancelled(false);
//           setCancellationInfo(null);
//           toastShownRef.current = false; // Reset toast flag if ride is active again
//         }
        
//         if (bookingData.driverId && bookingData.status !== 'cancelled') {
//           setDriverInfo({
//             name: bookingData.driverName || 'Driver',
//             phone: bookingData.driverPhone || 'Not available',
//             vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
//             rating: bookingData.driverRating || '4.8',
//             driverId: bookingData.driverId
//           });
//         } else if (bookingData.status === 'cancelled') {
//           setDriverInfo(null);
//         }
        
//         if (customerLocation) {
//           setCustomerLocation(customerLocation);
//         }
        
//         if (driverLocation && !driverLocation.error && bookingData.status !== 'cancelled') {
//           if (driverLocationRef.current) {
//             previousDriverLoc.current = driverLocationRef.current;
//           }
          
//           driverLocationRef.current = driverLocation;
//           setDriverLocation(driverLocation);
          
//           if (customerLocation) {
//             await calculateUberETA(driverLocation, customerLocation);
//           }
//         } else if (driverLocation?.error) {
//           console.warn('Driver location error:', driverLocation.error);
//         }
        
//         setLoading(false);
//       }
//     );

//     if (!isCancelled) {
//       updateCustomerLocation();
//       locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
//     }

//     return () => {
//       console.log('🧹 Cleaning up tracking listeners');
//       isInitializedRef.current = false;
      
//       if (unsubscribeRef.current) {
//         unsubscribeRef.current();
//       }
      
//       if (locationIntervalRef.current) {
//         clearInterval(locationIntervalRef.current);
//       }
//     };
//   }, [bookingId, calculateUberETA, updateCustomerLocation, isCancelled, showCancellationToast]);

//   const formatTime = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatAddress = (location) => {
//     if (!location) return 'Location not available';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     return 'Location specified';
//   };

//   const handleRefresh = () => {
//     if (!isCancelled) {
//       updateCustomerLocation();
//       toast.info('Refreshing your location...');
//     }
//   };

//   const openMapNavigation = () => {
//     if (driverLocation && !isCancelled) {
//       window.open(
//         `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
//         '_blank'
//       );
//     }
//   };

//   const handleCallDriver = () => {
//     if (driverInfo?.phone && driverInfo.phone !== 'Not available' && !isCancelled) {
//       window.location.href = `tel:${driverInfo.phone}`;
//     } else {
//       toast.error('Driver phone number not available');
//     }
//   };

//   const handleBookNewRide = () => {
//     // Navigate to local transfer page
//     navigate('/local-pickup', { 
//       state: { 
//         pickup: details.pickup,
//         dropoff: details.dropoff,
//         vehicleDetails: details.vehicleDetails,
//         travelDate: details.travelDate,
//         hour: details.hour,
//         minute: details.minute
//       }
//     });
//   };

//   const handleCancelRide = () => {
//     if (!isCancelled) {
//       setShowCancelForm(true);
//     }
//   };

//   const handleCancelSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validate form
//     if (!cancelReason.trim()) {
//       toast.error('Please select a cancellation reason');
//       return;
//     }
    
//     if (!refundAccount.trim()) {
//       toast.error('Please enter your refund account details');
//       return;
//     }
    
//     if (!refundPhone.trim()) {
//       toast.error('Please enter your phone number for refund');
//       return;
//     }
    
//     try {
//       // Here you would normally send this data to your backend
//       // For now, we'll simulate an API call
//       const cancelData = {
//         bookingId,
//         userId: user?.uid,
//         cancelReason,
//         cancelDescription,
//         refundAccount,
//         refundPhone,
//         timestamp: new Date().toISOString()
//       };
      
//       console.log('Cancellation data:', cancelData);
      
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       toast.success('Cancellation request submitted successfully!');
//       setShowCancelForm(false);
      
//       // Reset form
//       setCancelReason('');
//       setCancelDescription('');
//       setRefundAccount('');
//       setRefundPhone('');
      
//     } catch (error) {
//       console.error('Cancellation error:', error);
//       toast.error('Failed to submit cancellation request');
//     }
//   };

//   const handleCancelClose = () => {
//     setShowCancelForm(false);
//     setCancelReason('');
//     setCancelDescription('');
//     setRefundAccount('');
//     setRefundPhone('');
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Starting live tracking...</p>
//           <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
//         </div>
//       </div>
//     );
//   }

//   if (!bookingData) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
//         <div className="text-center max-w-sm mx-auto">
//           <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
//           <p className="text-gray-600 mb-6">The booking you're trying to track doesn't exist</p>
//           <button
//             onClick={() => navigate('/')}
//             className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 w-full sm:w-auto"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastContainer position="top-center" autoClose={3000} />
      
//       {/* Cancellation Form Modal */}
//       {showCancelForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-bold text-gray-900">Cancel Ride & Request Refund</h3>
//                 <button
//                   onClick={handleCancelClose}
//                   className="p-1 rounded-full hover:bg-gray-100"
//                 >
//                   <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                   </svg>
//                 </button>
//               </div>
              
//               <form onSubmit={handleCancelSubmit} className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Reason for Cancellation *
//                   </label>
//                   <select
//                     value={cancelReason}
//                     onChange={(e) => setCancelReason(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   >
//                     <option value="">Select a reason</option>
//                     <option value="driver_delayed">Driver is delayed</option>
//                     <option value="change_of_plans">Change of plans</option>
//                     <option value="found_alternative">Found alternative transport</option>
//                     <option value="emergency">Emergency situation</option>
//                     <option value="other">Other reason</option>
//                   </select>
//                 </div>
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Additional Details (Optional)
//                   </label>
//                   <textarea
//                     value={cancelDescription}
//                     onChange={(e) => setCancelDescription(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     rows="3"
//                     placeholder="Please provide more details about why you're cancelling..."
//                   />
//                 </div>
                
//                 <div className="border-t pt-4">
//                   <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                  
//                   <div className="mb-3">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Account for Refund *
//                     </label>
//                     <input
//                       type="text"
//                       value={refundAccount}
//                       onChange={(e) => setRefundAccount(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="Bank account number / UPI ID / Wallet number"
//                       required
//                     />
//                   </div>
                  
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Phone Number for Refund *
//                     </label>
//                     <input
//                       type="tel"
//                       value={refundPhone}
//                       onChange={(e) => setRefundPhone(e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       placeholder="Your registered phone number"
//                       required
//                     />
//                   </div>
//                 </div>
                
//                 <div className="flex gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={handleCancelClose}
//                     className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
//                   >
//                     Go Back
//                   </button>
//                   <button
//                     type="submit"
//                     className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
//                   >
//                     Submit Cancellation
//                   </button>
//                 </div>
                
//                 <p className="text-xs text-gray-500 text-center">
//                   * Refunds will be processed within 3-5 business days
//                 </p>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex flex-col space-y-2">
//             <div className="flex items-center justify-between">
//               <button
//                 onClick={() => navigate(-1)}
//                 className="p-2 rounded-full hover:bg-gray-100"
//               >
//                 <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//                 </svg>
//               </button>
//               <h1 className="text-lg font-bold text-gray-900">
//                 {isCancelled ? 'Ride Cancelled' : 'Live Ride Tracking'}
//               </h1>
//               {!isCancelled && (
//                 <button
//                   onClick={handleRefresh}
//                   className="p-2 rounded-full hover:bg-gray-100"
//                 >
//                   <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                   </svg>
//                 </button>
//               )}
//             </div>
//             <p className="text-xs text-gray-500 text-center truncate">
//               Booking: {bookingId?.substring(0, 8)}...
//               {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6">
//         {/* Status Banner */}
//         <div className={`${isCancelled ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'} text-white rounded-xl p-4 mb-4 shadow-lg`}>
//           <div className="space-y-3">
//             <div>
//               <h2 className="text-lg font-bold mb-1">Current Status</h2>
//               <div className="flex items-center">
//                 <div className={`w-3 h-3 rounded-full mr-3 ${
//                   isCancelled ? 'bg-red-400' :
//                   bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
//                   bookingData?.status === 'accepted' ? 'bg-green-400' :
//                   bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
//                   bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
//                 }`}></div>
//                 <span className="text-base font-semibold">
//                   {isCancelled && '🚫 Ride Cancelled by Driver'}
//                   {!isCancelled && bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
//                   {!isCancelled && bookingData?.status === 'accepted' && '✅ Driver assigned'}
//                   {!isCancelled && bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
//                   {!isCancelled && bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
//                   {!isCancelled && bookingData?.status === 'completed' && '✓ Ride completed'}
//                   {!isCancelled && !bookingData?.status && 'Status unavailable'}
//                 </span>
//               </div>
//             </div>
            
//             {!isCancelled && distance && eta && (
//               <div className="bg-white/20 p-3 rounded-lg">
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <div className="text-xs opacity-90">Distance to you</div>
//                     <div className="text-xl font-bold">{distance}</div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-xs opacity-90">Estimated arrival</div>
//                     <div className="text-xl font-bold">{eta}</div>
//                   </div>
//                 </div>
//                 {liveRoute?.fallback && (
//                   <div className="text-xs opacity-75 mt-1 text-center">*Estimated values</div>
//                 )}
//               </div>
//             )}
            
//             {isCancelled && cancellationInfo && (
//               <div className="bg-white/20 p-3 rounded-lg">
//                 <div className="space-y-2">
//                   <div>
//                     <div className="text-xs opacity-90">Cancelled by</div>
//                     <div className="text-sm font-semibold">{cancellationInfo.cancelledDriverName || 'Driver'}</div>
//                   </div>
//                   <div>
//                     <div className="text-xs opacity-90">Reason</div>
//                     <div className="text-sm font-semibold">{cancellationInfo.cancelledReason || 'Ride cancelled by driver'}</div>
//                   </div>
//                   {cancellationInfo.cancelledAt && (
//                     <div>
//                       <div className="text-xs opacity-90">Cancelled at</div>
//                       <div className="text-sm font-semibold">
//                         {formatTime(cancellationInfo.cancelledAt)}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Cancellation Action Card */}
//         {isCancelled && (
//           <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
//             <div className="flex items-start">
//               <div className="text-red-500 mr-3">
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <div className="flex-1">
//                 <h3 className="font-bold text-red-800 text-lg mb-2">Ride Cancelled</h3>
//                 <p className="text-red-700 mb-3">
//                   The driver has cancelled this ride. We apologize for the inconvenience.
//                 </p>
//                 <div className="flex flex-col sm:flex-row gap-2">
//                   <button
//                     onClick={handleBookNewRide}
//                     className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-medium flex-1 text-center"
//                   >
//                     Book New Ride
//                   </button>
//                   <button
//                     onClick={() => navigate('/support')}
//                     className="bg-white hover:bg-gray-100 text-red-600 border border-red-300 px-4 py-3 rounded-lg font-medium flex-1 text-center"
//                   >
//                     Contact Support
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Driver Info Card - Only show if not cancelled */}
//         {!isCancelled && driverInfo && (
//           <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//             <div className="flex items-start space-x-3 mb-4">
//               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
//                 <span className="text-xl">👤</span>
//               </div>
//               <div className="flex-1 min-w-0">
//                 <h3 className="font-bold text-base">Your Driver</h3>
//                 <p className="text-lg font-semibold truncate">{driverInfo.name}</p>
//                 <div className="flex items-center flex-wrap gap-1 mt-1">
//                   <p className="text-gray-600 text-sm truncate">{driverInfo.vehicle}</p>
//                   <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs ml-2">
//                     ⭐ {driverInfo.rating}
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="flex gap-2">
//               <button
//                 onClick={handleCallDriver}
//                 className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//               >
//                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 Call
//               </button>
//               {driverLocation && (
//                 <button
//                   onClick={openMapNavigation}
//                   className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
//                 >
//                   <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
//                   </svg>
//                   Navigate
//                 </button>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Map Section - Only show if not cancelled and driver location available */}
//         {!isCancelled && (
//           <div className="bg-white rounded-xl shadow-md p-3 mb-4">
//             <div className="flex justify-between items-center mb-3">
//               <h3 className="font-bold text-base">Live Tracking Map</h3>
//               <div className="text-xs text-gray-500 flex items-center">
//                 {driverLocation && (
//                   <span className="flex items-center">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
//                     Live
//                   </span>
//                 )}
//               </div>
//             </div>
            
//             <div className="h-64 sm:h-80 md:h-96 rounded-lg bg-gray-200">
//               {driverLocation && customerLocation ? (
//                 <MapWithTracking
//                   driverLocation={driverLocation}
//                   customerLocation={customerLocation}
//                   pickupLocation={details.pickup}
//                   dropoffLocation={details.dropoff}
//                   routeData={liveRoute}
//                   apiKey={MAP_MY_INDIA_API_KEY}
//                   showPredictions={true}
//                 />
//               ) : (
//                 <div className="h-full flex items-center justify-center">
//                   <div className="text-center">
//                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3 mx-auto"></div>
//                     <p className="text-gray-600 text-sm">Loading live map...</p>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Map Legend */}
//             <div className="flex flex-wrap justify-center gap-3 mt-3">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                 <span className="text-xs text-gray-600">Your Driver</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                 <span className="text-xs text-gray-600">Your Location</span>
//               </div>
//               {liveRoute && (
//                 <div className="flex items-center">
//                   <div className="w-6 h-1 bg-blue-400 mr-2"></div>
//                   <span className="text-xs text-gray-600">Route</span>
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         {/* Location Information - Only show if not cancelled */}
//         {!isCancelled && (
//           <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//             <h3 className="font-bold text-base mb-3">Live Tracking Info</h3>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
//               {/* Driver Location Card */}
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center">
//                     <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//                     <h4 className="font-semibold text-gray-700 text-sm">Driver Location</h4>
//                   </div>
//                   <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
//                     Live
//                   </span>
//                 </div>
                
//                 {driverLocation ? (
//                   <div className="space-y-2">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <p className="text-xs text-gray-500">Latitude</p>
//                         <p className="font-mono text-xs truncate">{driverLocation.lat.toFixed(6)}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Longitude</p>
//                         <p className="font-mono text-xs truncate">{driverLocation.lng.toFixed(6)}</p>
//                       </div>
//                     </div>
//                     <p className="text-xs text-gray-500">
//                       Updated: {driverLocation.timestamp 
//                         ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
//                             hour: '2-digit', 
//                             minute: '2-digit'
//                           })
//                         : 'Just now'
//                       }
//                     </p>
//                   </div>
//                 ) : (
//                   <p className="text-gray-500 text-sm text-center py-2">Driver location not available</p>
//                 )}
//               </div>
              
//               {/* Your Location Card */}
//               <div className="bg-gray-50 p-3 rounded-lg">
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="flex items-center">
//                     <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//                     <h4 className="font-semibold text-gray-700 text-sm">Your Location</h4>
//                   </div>
//                   <span className={`text-xs px-2 py-1 rounded ${
//                     customerLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
//                   }`}>
//                     {customerLocation ? 'Active' : 'Inactive'}
//                   </span>
//                 </div>
                
//                 {customerLocation ? (
//                   <div className="space-y-2">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <p className="text-xs text-gray-500">Latitude</p>
//                         <p className="font-mono text-xs truncate">{customerLocation.lat.toFixed(6)}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-500">Longitude</p>
//                         <p className="font-mono text-xs truncate">{customerLocation.lng.toFixed(6)}</p>
//                       </div>
//                     </div>
//                     <button
//                       onClick={handleRefresh}
//                       className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mt-2"
//                     >
//                       <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//                       </svg>
//                       Update Location
//                     </button>
//                   </div>
//                 ) : (
//                   <div className="text-center py-2">
//                     <p className="text-gray-500 text-sm mb-2">Your location not shared</p>
//                     <button
//                       onClick={handleRefresh}
//                       className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
//                     >
//                       <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
//                       </svg>
//                       Share Location
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             {/* Distance & ETA */}
//             {(distance || eta) && (
//               <div className="border-t border-gray-200 pt-4">
//                 <h4 className="font-semibold text-gray-700 text-sm mb-3">Trip Information</h4>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                   <div className="bg-blue-50 p-3 rounded-lg">
//                     <div className="flex items-center mb-1">
//                       <div className="text-blue-500 mr-2 text-sm">📏</div>
//                       <p className="text-xs text-gray-600">Distance</p>
//                     </div>
//                     <p className="text-lg font-bold text-blue-600 truncate">{distance}</p>
//                   </div>
//                   <div className="bg-green-50 p-3 rounded-lg">
//                     <div className="flex items-center mb-1">
//                       <div className="text-green-500 mr-2 text-sm">⏱️</div>
//                       <p className="text-xs text-gray-600">ETA</p>
//                     </div>
//                     <p className="text-lg font-bold text-green-600 truncate">{eta}</p>
//                   </div>
//                 </div>
//                 {liveRoute?.fallback && (
//                   <p className="text-xs text-yellow-600 text-center mt-2">*Based on estimated values</p>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Trip Details */}
//         <div className="bg-white rounded-xl shadow-md p-4 mb-4">
//           <h3 className="font-bold text-base mb-3">Trip Details</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">From</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.pickup)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">To</p>
//               <p className="font-medium text-sm line-clamp-2">{formatAddress(details.dropoff)}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Vehicle</p>
//               <p className="font-medium text-sm truncate">{details.vehicleDetails?.name || 'Standard Car'}</p>
//             </div>
//             <div className="bg-gray-50 p-3 rounded-lg">
//               <p className="text-gray-600 text-xs mb-1">Time</p>
//               <p className="font-medium text-sm truncate">
//                 {details.travelDate ? new Date(details.travelDate).toLocaleDateString([], { 
//                   month: 'short', 
//                   day: 'numeric' 
//                 }) : 'N/A'}
//                 {details.hour && ` ${details.hour}:${details.minute || '00'}`}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Help Section */}
//         <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
//           <h4 className="font-semibold text-yellow-800 text-base mb-2">Need Help?</h4>
//           <p className="text-yellow-700 text-sm mb-3">
//             {isCancelled ? 'Your ride has been cancelled. What would you like to do?' : 'If you\'re experiencing issues with tracking:'}
//           </p>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//             {isCancelled ? (
//               <>
//                 <button
//                   onClick={handleBookNewRide}
//                   className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   🚗 Book New Ride
//                 </button>
//                 <button
//                   onClick={() => navigate('/support')}
//                   className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📞 Contact Support
//                 </button>
//                 <button
//                   onClick={() => navigate('/my-bookings')}
//                   className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📋 My Bookings
//                 </button>
//               </>
//             ) : (
//               <>
//                 <button
//                   onClick={() => window.location.reload()}
//                   className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   🔄 Refresh Page
//                 </button>
//                 <button
//                   onClick={handleCancelRide}
//                   className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   🚫 Cancel Ride
//                 </button>
//                 <button
//                   onClick={handleCallDriver}
//                   className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
//                 >
//                   📱 Call Driver
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Bottom Navigation Bar for Mobile */}
//       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between z-10 sm:hidden">
//         {!isCancelled && (
//           <>
//             <button
//               onClick={handleRefresh}
//               className="flex flex-col items-center text-blue-600"
//             >
//               <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//               <span className="text-xs">Refresh</span>
//             </button>
            
//             <button
//               onClick={handleCancelRide}
//               className="flex flex-col items-center text-red-600"
//             >
//               <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//               <span className="text-xs">Cancel</span>
//             </button>
            
//             {driverInfo?.phone && driverInfo.phone !== 'Not available' && (
//               <button
//                 onClick={handleCallDriver}
//                 className="flex flex-col items-center text-green-600"
//               >
//                 <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                 </svg>
//                 <span className="text-xs">Call</span>
//               </button>
//             )}
//           </>
//         )}
        
//         <button
//           onClick={() => navigate(-1)}
//           className="flex flex-col items-center text-gray-600"
//         >
//           <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//           </svg>
//           <span className="text-xs">Back</span>
//         </button>
//       </div>
//     </div>
//   );
// };

// export default TrackRidePage;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UberStyleTracking } from '../utils/uberTracking';
import { CustomerLocationService } from '../services/firebaseService';
import MapWithTracking from '../components/MapWithTracking';

const TrackRidePage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const bookingId = state?.bookingId;
  const details = state?.bookingDetails || {};
  
  const [bookingData, setBookingData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [liveRoute, setLiveRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [cancellationInfo, setCancellationInfo] = useState(null);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDescription, setCancelDescription] = useState('');
  const [refundAccount, setRefundAccount] = useState('');
  const [refundPhone, setRefundPhone] = useState('');
  
  const MAP_MY_INDIA_API_KEY = import.meta.env.VITE_MAP_MY_INDIA_API_KEY || 'mock_key';
  const [trackingService] = useState(() => 
    new UberStyleTracking(MAP_MY_INDIA_API_KEY, true)
  );
  
  const unsubscribeRef = useRef(null);
  const locationIntervalRef = useRef(null);
  const driverLocationRef = useRef(null);
  const previousDriverLoc = useRef(null);
  const locationHistoryRef = useRef([]);
  const isInitializedRef = useRef(false);
  const toastShownRef = useRef(false); // To prevent multiple toast messages

  const updateCustomerLocation = useCallback(async () => {
    if (!bookingId || !user?.uid || isCancelled || isCompleted) return;

    try {
      if (!navigator.geolocation) {
        toast.error('Your browser does not support location services');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now(),
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || null
          };

          console.log('📍 Customer location updated:', userLocation);
          
          try {
            await CustomerLocationService.updateCustomerLocation(bookingId, userLocation);
            setCustomerLocation(userLocation);
            
            if (driverLocationRef.current) {
              await calculateUberETA(driverLocationRef.current, userLocation);
            }
          } catch (error) {
            console.error('Error updating customer location in Firebase:', error);
          }
        },
        (error) => {
          // Suppress timeout errors as they're common and not user-actionable
          if (error.code === 3) { // TIMEOUT error
            console.log('Location request timed out - will retry later');
            return;
          }
          
          // Only log other errors silently without showing to user
          console.log('Location unavailable:', error.code === 1 ? 'Permission denied' : error.code === 2 ? 'Position unavailable' : error.message);
          
          // Only show toast for permission denied errors
          if (error.code === 1 && !toastShownRef.current) {
            toast.error('Location access is needed for better tracking experience');
            toastShownRef.current = true;
            // Reset after 30 seconds to allow future messages
            setTimeout(() => { toastShownRef.current = false; }, 30000);
          }
        },
        { 
          enableHighAccuracy: false, 
          timeout: 5000, // Reduced timeout to fail faster
          maximumAge: 60000 // Use cached location for up to 1 minute
        }
      );
    } catch (error) {
      console.error('Update location error:', error);
    }
  }, [bookingId, user?.uid, isCancelled, isCompleted]);

  const calculateUberETA = useCallback(async (driverLoc, customerLoc) => {
    try {
      console.log('📍 Calculating ETA between:', {
        driver: { lat: driverLoc.lat.toFixed(6), lng: driverLoc.lng.toFixed(6) },
        customer: { lat: customerLoc.lat.toFixed(6), lng: customerLoc.lng.toFixed(6) }
      });
      
      const newLocation = {
        ...driverLoc,
        timestamp: Date.now()
      };
      
      locationHistoryRef.current.push(newLocation);
      
      if (locationHistoryRef.current.length > 10) {
        locationHistoryRef.current.shift();
      }
      
      const route = await trackingService.calculateRoute(driverLoc, customerLoc);
      
      if (route) {
        setLiveRoute(route);
        
        const trafficFactor = route.trafficFactor || 1.2;
        const etaMinutes = trackingService.calculateETA(route.distance, trafficFactor);
        
        const formattedDistance = trackingService.formatDistance(route.distance);
        const formattedETA = trackingService.formatETA(etaMinutes);
        
        setDistance(formattedDistance);
        setEta(formattedETA);
        
        console.log('🚕 Tracking info:', {
          distance: formattedDistance,
          eta: formattedETA,
          distanceMeters: route.distance,
          etaMinutes,
          trafficFactor,
          fromMockAPI: route.mock,
          fromDirect: route.direct,
          fromFallback: route.fallback
        });
        
        return { distance: formattedDistance, eta: formattedETA };
      }
    } catch (error) {
      console.error('ETA calculation error:', error);
      
      const simpleDistance = trackingService.calculateHaversineDistance(driverLoc, customerLoc);
      const simpleETA = trackingService.calculateETA(simpleDistance, 1.5);
      
      const formattedDistance = trackingService.formatDistance(simpleDistance);
      const formattedETA = trackingService.formatETA(simpleETA);
      
      setDistance(formattedDistance);
      setEta(formattedETA);
      
      console.log('⚠️ Using fallback calculation:', {
        distance: formattedDistance,
        eta: formattedETA
      });
      
      return { distance: formattedDistance, eta: formattedETA };
    }
  }, [trackingService]);

  // Handle cancellation toast - show only once
  const showCancellationToast = useCallback(() => {
    if (!toastShownRef.current && cancellationInfo) {
      toast.error('🚫 This ride has been cancelled by the driver', {
        autoClose: 5000,
        closeButton: true,
        toastId: 'cancellation-toast' // Unique ID to prevent duplicates
      });
      toastShownRef.current = true;
    }
  }, [cancellationInfo]);

  // Handle completion toast - show only once
  const showCompletionToast = useCallback(() => {
    if (!toastShownRef.current && isCompleted) {
      toast.success('🎉 Ride completed successfully!', {
        autoClose: 5000,
        closeButton: true,
        toastId: 'completion-toast'
      });
      toastShownRef.current = true;
    }
  }, [isCompleted]);

  useEffect(() => {
    if (!bookingId) {
      console.log('❌ No booking ID provided');
      setLoading(false);
      toast.error('No booking ID provided');
      return;
    }

    if (isInitializedRef.current) {
      console.log('⚠️ Already initialized, skipping...');
      return;
    }

    isInitializedRef.current = true;
    console.log('🚀 Starting Uber-style tracking for booking:', bookingId);

    unsubscribeRef.current = CustomerLocationService.subscribeToRideTracking(
      bookingId,
      async (data) => {
        if (data.error) {
          console.error('Tracking error:', data.error);
          toast.error('Failed to track ride');
          setLoading(false);
          return;
        }

        const { bookingData, driverLocation, customerLocation } = data;
        
        setBookingData(bookingData);
        
        // Check ride status
        if (bookingData.status === 'cancelled') {
          setIsCancelled(true);
          setIsCompleted(false);
          setCancellationInfo({
            cancelledAt: bookingData.cancelledAt,
            cancelledBy: bookingData.cancelledBy,
            cancelledReason: bookingData.cancelledReason || 'Ride cancelled by driver',
            cancelledDriverName: bookingData.cancelledDriverName || 'Driver'
          });
          
          // Show cancellation toast only once
          showCancellationToast();
          
          // Clear location intervals for cancelled rides
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
          }
        } else if (bookingData.status === 'completed') {
          setIsCompleted(true);
          setIsCancelled(false);
          setCancellationInfo(null);
          
          // Show completion toast only once
          showCompletionToast();
          
          // Clear location intervals for completed rides
          if (locationIntervalRef.current) {
            clearInterval(locationIntervalRef.current);
            locationIntervalRef.current = null;
          }
        } else {
          // Ride is active
          setIsCancelled(false);
          setIsCompleted(false);
          setCancellationInfo(null);
          toastShownRef.current = false; // Reset toast flag if ride is active again
        }
        
        // Set driver info if available
        if (bookingData.driverId && bookingData.status !== 'cancelled') {
          setDriverInfo({
            name: bookingData.driverName || 'Driver',
            phone: bookingData.driverPhone || 'Not available',
            vehicle: bookingData.vehicleModel || bookingData.vehicleType || 'Car',
            rating: bookingData.driverRating || '4.8',
            driverId: bookingData.driverId
          });
        } else if (bookingData.status === 'cancelled') {
          setDriverInfo(null);
        }
        
        if (customerLocation) {
          setCustomerLocation(customerLocation);
        }
        
        if (driverLocation && !driverLocation.error && !isCancelled && !isCompleted) {
          if (driverLocationRef.current) {
            previousDriverLoc.current = driverLocationRef.current;
          }
          
          driverLocationRef.current = driverLocation;
          setDriverLocation(driverLocation);
          
          if (customerLocation) {
            await calculateUberETA(driverLocation, customerLocation);
          }
        } else if (driverLocation?.error) {
          console.warn('Driver location error:', driverLocation.error);
        }
        
        setLoading(false);
      }
    );

    // Start location updates only for active rides
    if (bookingData?.status && !['cancelled', 'completed'].includes(bookingData.status)) {
      updateCustomerLocation();
      locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
    } else if (!isCancelled && !isCompleted) {
      // Initial location update for active rides
      updateCustomerLocation();
    }

    return () => {
      console.log('🧹 Cleaning up tracking listeners');
      isInitializedRef.current = false;
      
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
    };
  }, [bookingId, calculateUberETA, updateCustomerLocation, isCancelled, isCompleted, showCancellationToast, showCompletionToast]);

  // Start/stop location updates based on ride status
  useEffect(() => {
    if (!bookingData) return;

    if (isCancelled || isCompleted) {
      // Stop location updates for cancelled/completed rides
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    } else if (bookingData.status && !['cancelled', 'completed'].includes(bookingData.status)) {
      // Start/continue location updates for active rides
      if (!locationIntervalRef.current) {
        updateCustomerLocation();
        locationIntervalRef.current = setInterval(updateCustomerLocation, 30000);
      }
    }
  }, [isCancelled, isCompleted, bookingData, updateCustomerLocation]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], {
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
    if (!location) return 'Location not available';
    if (typeof location === 'string') return location;
    if (location.name) return location.name;
    if (location.address) return location.address;
    return 'Location specified';
  };

  const handleRefresh = () => {
    if (!isCancelled && !isCompleted) {
      updateCustomerLocation();
      toast.info('Refreshing your location...');
    } else {
      toast.info('Refreshing ride information...');
    }
  };

  const openMapNavigation = () => {
    if (driverLocation && !isCancelled && !isCompleted) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${driverLocation.lat},${driverLocation.lng}`,
        '_blank'
      );
    }
  };

  const handleCallDriver = () => {
    if (driverInfo?.phone && driverInfo.phone !== 'Not available' && !isCancelled && !isCompleted) {
      window.location.href = `tel:${driverInfo.phone}`;
    } else {
      toast.error('Driver phone number not available');
    }
  };

  const handleBookNewRide = () => {
    navigate('/local-pickup', { 
      state: { 
        pickup: details.pickup,
        dropoff: details.dropoff,
        vehicleDetails: details.vehicleDetails,
        travelDate: details.travelDate,
        hour: details.hour,
        minute: details.minute
      }
    });
  };

  const handleCancelRide = () => {
    if (!isCancelled && !isCompleted) {
      setShowCancelForm(true);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!cancelReason.trim()) {
      toast.error('Please select a cancellation reason');
      return;
    }
    
    if (!refundAccount.trim()) {
      toast.error('Please enter your refund account details');
      return;
    }
    
    if (!refundPhone.trim()) {
      toast.error('Please enter your phone number for refund');
      return;
    }
    
    try {
      // Here you would normally send this data to your backend
      // For now, we'll simulate an API call
      const cancelData = {
        bookingId,
        userId: user?.uid,
        cancelReason,
        cancelDescription,
        refundAccount,
        refundPhone,
        timestamp: new Date().toISOString()
      };
      
      console.log('Cancellation data:', cancelData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Cancellation request submitted successfully!');
      setShowCancelForm(false);
      
      // Reset form
      setCancelReason('');
      setCancelDescription('');
      setRefundAccount('');
      setRefundPhone('');
      
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error('Failed to submit cancellation request');
    }
  };

  const handleCancelClose = () => {
    setShowCancelForm(false);
    setCancelReason('');
    setCancelDescription('');
    setRefundAccount('');
    setRefundPhone('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Starting live tracking...</p>
          <p className="text-gray-500 text-sm mt-2">Connecting to real-time updates</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-red-600 mb-3">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The booking you're trying to track doesn't exist</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-3 rounded-md hover:bg-orange-600 w-full sm:w-auto"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isRideActive = !isCancelled && !isCompleted && 
    ['searching_driver', 'accepted', 'driver_arrived', 'in_progress'].includes(bookingData?.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />
      
      {/* Cancellation Form Modal */}
      {showCancelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Cancel Ride & Request Refund</h3>
                <button
                  onClick={handleCancelClose}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCancelSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Cancellation *
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="driver_delayed">Driver is delayed</option>
                    <option value="change_of_plans">Change of plans</option>
                    <option value="found_alternative">Found alternative transport</option>
                    <option value="emergency">Emergency situation</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    value={cancelDescription}
                    onChange={(e) => setCancelDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Please provide more details about why you're cancelling..."
                  />
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Refund Information</h4>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account for Refund *
                    </label>
                    <input
                      type="text"
                      value={refundAccount}
                      onChange={(e) => setRefundAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Bank account number / UPI ID / Wallet number"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number for Refund *
                    </label>
                    <input
                      type="tel"
                      value={refundPhone}
                      onChange={(e) => setRefundPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your registered phone number"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Submit Cancellation
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  * Refunds will be processed within 3-5 business days
                </p>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                {isCancelled ? 'Ride Cancelled' : 
                 isCompleted ? 'Ride Completed' : 
                 'Live Ride Tracking'}
              </h1>
              <button
                onClick={handleRefresh}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center truncate">
              Booking: {bookingId?.substring(0, 8)}...
              {bookingData?.updatedAt && ` • Updated: ${formatTime(bookingData.updatedAt)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-20 sm:pb-6">
        {/* Status Banner */}
        <div className={`${
          isCancelled ? 'bg-gradient-to-r from-red-500 to-red-600' : 
          isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' :
          'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white rounded-xl p-4 mb-4 shadow-lg`}>
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold mb-1">Current Status</h2>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  isCancelled ? 'bg-red-400' :
                  isCompleted ? 'bg-green-400' :
                  bookingData?.status === 'searching_driver' ? 'bg-yellow-400 animate-pulse' :
                  bookingData?.status === 'accepted' ? 'bg-green-400' :
                  bookingData?.status === 'driver_arrived' ? 'bg-blue-400' :
                  bookingData?.status === 'in_progress' ? 'bg-purple-400' : 'bg-gray-400'
                }`}></div>
                <span className="text-base font-semibold">
                  {isCancelled && '🚫 Ride Cancelled'}
                  {isCompleted && '✅ Ride Completed'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'searching_driver' && '🔍 Searching for driver...'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'accepted' && '✅ Driver assigned'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'driver_arrived' && '🚗 Driver has arrived'}
                  {!isCancelled && !isCompleted && bookingData?.status === 'in_progress' && '🏁 Ride in progress'}
                  {!isCancelled && !isCompleted && !bookingData?.status && 'Status unavailable'}
                </span>
              </div>
            </div>
            
            {isRideActive && distance && eta && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-xs opacity-90">Distance to you</div>
                    <div className="text-xl font-bold">{distance}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-90">Estimated arrival</div>
                    <div className="text-xl font-bold">{eta}</div>
                  </div>
                </div>
                {liveRoute?.fallback && (
                  <div className="text-xs opacity-75 mt-1 text-center">*Estimated values</div>
                )}
              </div>
            )}
            
            {isCompleted && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-90">Ride Completed</div>
                    <div className="text-sm font-semibold">Thank you for riding with us!</div>
                  </div>
                  {bookingData?.completedAt && (
                    <div>
                      <div className="text-xs opacity-90">Completed at</div>
                      <div className="text-sm font-semibold">
                        {formatTime(bookingData.completedAt)}
                      </div>
                    </div>
                  )}
                  {bookingData?.fareAmount && (
                    <div>
                      <div className="text-xs opacity-90">Total Fare</div>
                      <div className="text-sm font-semibold">₹{bookingData.fareAmount}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {isCancelled && cancellationInfo && (
              <div className="bg-white/20 p-3 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <div className="text-xs opacity-90">Cancelled by</div>
                    <div className="text-sm font-semibold">{cancellationInfo.cancelledDriverName || 'Driver'}</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-90">Reason</div>
                    <div className="text-sm font-semibold">{cancellationInfo.cancelledReason || 'Ride cancelled by driver'}</div>
                  </div>
                  {cancellationInfo.cancelledAt && (
                    <div>
                      <div className="text-xs opacity-90">Cancelled at</div>
                      <div className="text-sm font-semibold">
                        {formatTime(cancellationInfo.cancelledAt)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation/Completion Action Card */}
        {(isCancelled || isCompleted) && (
          <div className={`${isCancelled ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'} rounded-xl p-4 mb-4`}>
            <div className="flex items-start">
              <div className={`${isCancelled ? 'text-red-500' : 'text-green-500'} mr-3`}>
                {isCancelled ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-2 ${isCancelled ? 'text-red-800' : 'text-green-800'}`}>
                  {isCancelled ? 'Ride Cancelled' : 'Ride Completed'}
                </h3>
                <p className={`mb-3 ${isCancelled ? 'text-red-700' : 'text-green-700'}`}>
                  {isCancelled 
                    ? 'The driver has cancelled this ride. We apologize for the inconvenience.' 
                    : 'Your ride has been completed successfully. Thank you for choosing our service!'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleBookNewRide}
                    className={`${isCancelled ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'} px-4 py-3 rounded-lg font-medium flex-1 text-center`}
                  >
                    Book New Ride
                  </button>
                  <button
                    onClick={() => navigate('/support')}
                    className={`${isCancelled ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300' : 'bg-white hover:bg-gray-100 text-green-600 border border-green-300'} px-4 py-3 rounded-lg font-medium flex-1 text-center`}
                  >
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Info Card - Show for active and completed rides */}
        {!isCancelled && driverInfo && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base">Your Driver</h3>
                <p className="text-lg font-semibold truncate">{driverInfo.name}</p>
                <div className="flex items-center flex-wrap gap-1 mt-1">
                  <p className="text-gray-600 text-sm truncate">{driverInfo.vehicle}</p>
                  <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs ml-2">
                    ⭐ {driverInfo.rating}
                  </span>
                </div>
              </div>
            </div>
            
            {isRideActive && (
              <div className="flex gap-2">
                <button
                  onClick={handleCallDriver}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call
                </button>
                {driverLocation && isRideActive && (
                  <button
                    onClick={openMapNavigation}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2.5 rounded-lg font-medium flex items-center justify-center transition shadow-sm text-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293a1 1 0 00-1.414 0l-1 1a1 1 0 000 1.414l15 15a1 1 0 001.414 0l1-1a1 1 0 000-1.414l-15-15z" clipRule="evenodd"/>
                    </svg>
                    Navigate
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Map Section - Show for active rides */}
        {isRideActive && (
          <div className="bg-white rounded-xl shadow-md p-3 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base">Live Tracking Map</h3>
              <div className="text-xs text-gray-500 flex items-center">
                {driverLocation && (
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </span>
                )}
              </div>
            </div>
            
            <div className="h-64 sm:h-80 md:h-96 rounded-lg bg-gray-200">
              {driverLocation && customerLocation ? (
                <MapWithTracking
                  driverLocation={driverLocation}
                  customerLocation={customerLocation}
                  pickupLocation={details.pickup}
                  dropoffLocation={details.dropoff}
                  routeData={liveRoute}
                  apiKey={MAP_MY_INDIA_API_KEY}
                  showPredictions={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3 mx-auto"></div>
                    <p className="text-gray-600 text-sm">Loading live map...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Map Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-gray-600">Your Driver</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Your Location</span>
              </div>
              {liveRoute && (
                <div className="flex items-center">
                  <div className="w-6 h-1 bg-blue-400 mr-2"></div>
                  <span className="text-xs text-gray-600">Route</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Information - Show for active rides */}
        {isRideActive && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <h3 className="font-bold text-base mb-3">Live Tracking Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {/* Driver Location Card */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <h4 className="font-semibold text-gray-700 text-sm">Driver Location</h4>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    Live
                  </span>
                </div>
                
                {driverLocation ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="font-mono text-xs truncate">{driverLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="font-mono text-xs truncate">{driverLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Updated: {driverLocation.timestamp 
                        ? new Date(driverLocation.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit'
                          })
                        : 'Just now'
                      }
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-2">Driver location not available</p>
                )}
              </div>
              
              {/* Your Location Card */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <h4 className="font-semibold text-gray-700 text-sm">Your Location</h4>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    customerLocation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {customerLocation ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                {customerLocation ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Latitude</p>
                        <p className="font-mono text-xs truncate">{customerLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Longitude</p>
                        <p className="font-mono text-xs truncate">{customerLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center mt-2"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Update Location
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-gray-500 text-sm mb-2">Your location not shared</p>
                    <button
                      onClick={handleRefresh}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      Share Location
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Distance & ETA */}
            {(distance || eta) && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-700 text-sm mb-3">Trip Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="text-blue-500 mr-2 text-sm">📏</div>
                      <p className="text-xs text-gray-600">Distance</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600 truncate">{distance}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="text-green-500 mr-2 text-sm">⏱️</div>
                      <p className="text-xs text-gray-600">ETA</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 truncate">{eta}</p>
                  </div>
                </div>
                {liveRoute?.fallback && (
                  <p className="text-xs text-yellow-600 text-center mt-2">*Based on estimated values</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trip Details - Always show */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <h3 className="font-bold text-base mb-3">Trip Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">From</p>
              <p className="font-medium text-sm line-clamp-2">{formatAddress(details.pickup)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">To</p>
              <p className="font-medium text-sm line-clamp-2">{formatAddress(details.dropoff)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Vehicle</p>
              <p className="font-medium text-sm truncate">{details.vehicleDetails?.name || 'Standard Car'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-600 text-xs mb-1">Time</p>
              <p className="font-medium text-sm truncate">
                {details.travelDate ? new Date(details.travelDate).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric' 
                }) : 'N/A'}
                {details.hour && ` ${details.hour}:${details.minute || '00'}`}
              </p>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 text-base mb-2">Need Help?</h4>
          <p className="text-yellow-700 text-sm mb-3">
            {isCancelled ? 'Your ride has been cancelled. What would you like to do?' : 
             isCompleted ? 'Your ride has been completed. What would you like to do next?' :
             'If you\'re experiencing issues with tracking:'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {isCancelled || isCompleted ? (
              <>
                <button
                  onClick={handleBookNewRide}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🚗 Book New Ride
                </button>
                <button
                  onClick={() => navigate('/support')}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📞 Contact Support
                </button>
                <button
                  onClick={() => navigate('/user-dashboard')}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📋 My Bookings
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🔄 Refresh Page
                </button>
                <button
                  onClick={handleCancelRide}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  🚫 Cancel Ride
                </button>
                <button
                  onClick={handleCallDriver}
                  className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-3 rounded-lg font-medium flex items-center justify-center text-sm"
                >
                  📱 Call Driver
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between z-10 sm:hidden">
        {isRideActive && (
          <>
            <button
              onClick={handleRefresh}
              className="flex flex-col items-center text-blue-600"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs">Refresh</span>
            </button>
            
            <button
              onClick={handleCancelRide}
              className="flex flex-col items-center text-red-600"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-xs">Cancel</span>
            </button>
            
            {driverInfo?.phone && driverInfo.phone !== 'Not available' && (
              <button
                onClick={handleCallDriver}
                className="flex flex-col items-center text-green-600"
              >
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-xs">Call</span>
              </button>
            )}
          </>
        )}
        
        <button
          onClick={() => navigate(-1)}
          className="flex flex-col items-center text-gray-600"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-xs">Back</span>
        </button>
      </div>
    </div>
  );
};

export default TrackRidePage;