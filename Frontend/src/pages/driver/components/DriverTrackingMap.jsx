// // src/components/DriverTrackingMap.jsx
// import { useEffect, useRef, useState } from 'react';
// import { doc, onSnapshot } from 'firebase/firestore';
// import { db } from "../../../config/firebase";

// const DriverTrackingMap = ({ bookingId, userId, isDriver = false }) => {
//   const mapRef = useRef(null);
//   const [map, setMap] = useState(null);
//   const [marker, setMarker] = useState(null);
//   const [driverLocation, setDriverLocation] = useState(null);

//   useEffect(() => {
//     // Load MapmyIndia script
//     const loadMap = () => {
//       if (!window.MapmyIndia) {
//         const script = document.createElement('script');
//         script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_API_KEY}/map_load?v=1.3`;
//         script.onload = initializeMap;
//         document.head.appendChild(script);
//       } else {
//         initializeMap();
//       }
//     };

//     const initializeMap = () => {
//       const map = new window.MapmyIndia.Map('map', {
//         center: [28.6129, 77.2295], // Default to Delhi coordinates
//         zoomControl: true,
//         hybrid: true
//       });
//       setMap(map);
//     };

//     loadMap();

//     return () => {
//       // Cleanup
//       if (map) {
//         map.remove();
//       }
//     };
//   }, []);

//   // Subscribe to driver location updates
//   useEffect(() => {
//     if (!bookingId) return;

//     const unsubscribe = onSnapshot(doc(db, 'driverLocations', bookingId), (doc) => {
//       const locationData = doc.data();
//       if (locationData) {
//         setDriverLocation([locationData.lat, locationData.lng]);
//         updateMarker([locationData.lat, locationData.lng]);
//       }
//     });

//     return () => unsubscribe();
//   }, [bookingId, map]);

//   const updateMarker = (position) => {
//     if (!map) return;

//     if (marker) {
//       marker.setPosition(position);
//     } else {
//       const newMarker = new window.MapmyIndia.Marker({
//         position: position,
//         map: map,
//         draggable: false
//       });
//       setMarker(newMarker);
//     }
//     map.setCenter(position);
//   };

//   // For driver to update their location
//   const updateDriverLocation = async () => {
//     if (!isDriver || !bookingId) return;

//     navigator.geolocation.getCurrentPosition(
//       async (position) => {
//         const { latitude, longitude } = position.coords;
//         await updateDoc(doc(db, 'driverLocations', bookingId), {
//           lat: latitude,
//           lng: longitude,
//           updatedAt: serverTimestamp()
//         });
//       },
//       (error) => {
//         console.error('Error getting location:', error);
//       },
//       { enableHighAccuracy: true }
//     );
//   };

//   // For driver: update location every 10 seconds
//   useEffect(() => {
//     if (!isDriver) return;

//     updateDriverLocation();
//     const interval = setInterval(updateDriverLocation, 10000);

//     return () => clearInterval(interval);
//   }, [isDriver, bookingId]);

//   return (
//     <div>
//       <div id="map" style={{ height: '400px', width: '100%' }}></div>
//       {isDriver && (
//         <button 
//           onClick={updateDriverLocation}
//           className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
//         >
//           Update My Location
//         </button>
//       )}
//     </div>
//   );
// };

// export default DriverTrackingMap;

// import { useEffect, useRef, useState } from 'react';
// import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../../../config/firebase';

// const DriverTrackingMap = ({ 
//   bookingId, 
//   userId, 
//   isDriver = false,
//   pickupLocation,
//   dropoffLocation 
// }) => {
//   const mapRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const pickupMarkerRef = useRef(null);
//   const dropoffMarkerRef = useRef(null);
//   const routeLayerRef = useRef(null);
//   const watchIdRef = useRef(null);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [isMapLoaded, setIsMapLoaded] = useState(false);

//   // Initialize MapMyIndia map
//   useEffect(() => {
//     if (!mapRef.current || isMapLoaded) return;

//     const initMap = () => {
//       try {
//         // Check if MapmyIndia is loaded
//         if (typeof mappls === 'undefined') {
//           console.error('MapMyIndia SDK not loaded');
//           setError('Map service not available');
//           return;
//         }

//         // Initialize map
//         const map = new mappls.Map(mapRef.current, {
//           center: pickupLocation?.coordinates 
//             ? [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng]
//             : [18.5204, 73.8567], // Default to Pune
//           zoom: 12,
//           zoomControl: true,
//           location: true
//         });

//         mapInstanceRef.current = map;
//         setIsMapLoaded(true);

//         // Add pickup marker
//         if (pickupLocation?.coordinates) {
//           const pickupMarker = new mappls.Marker({
//             position: [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng],
//             map: map,
//             title: 'Pickup Location',
//             icon: {
//               url: 'https://apis.mapmyindia.com/map_v3/1.png',
//               size: [32, 32]
//             }
//           });
//           pickupMarkerRef.current = pickupMarker;
//         }

//         // Add dropoff marker
//         if (dropoffLocation?.coordinates) {
//           const dropoffMarker = new mappls.Marker({
//             position: [dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng],
//             map: map,
//             title: 'Dropoff Location',
//             icon: {
//               url: 'https://apis.mapmyindia.com/map_v3/2.png',
//               size: [32, 32]
//             }
//           });
//           dropoffMarkerRef.current = dropoffMarker;
//         }

//         console.log('MapMyIndia map initialized successfully');
//       } catch (err) {
//         console.error('Error initializing map:', err);
//         setError('Failed to initialize map');
//       }
//     };

//     // Load MapMyIndia script if not already loaded
//     if (typeof mappls === 'undefined') {
//       const script = document.createElement('script');
//       script.src = 'https://apis.mapmyindia.com/advancedmaps/api/YOUR_API_KEY/map_sdk?v=3.0';
//       script.async = true;
//       script.onload = initMap;
//       script.onerror = () => {
//         console.error('Failed to load MapMyIndia SDK');
//         setError('Failed to load map service');
//       };
//       document.head.appendChild(script);

//       // Also load CSS
//       const link = document.createElement('link');
//       link.rel = 'stylesheet';
//       link.href = 'https://apis.mapmyindia.com/advancedmaps/api/YOUR_API_KEY/map_sdk?v=3.0';
//       document.head.appendChild(link);
//     } else {
//       initMap();
//     }

//     return () => {
//       if (mapInstanceRef.current) {
//         // Cleanup map instance
//         mapInstanceRef.current = null;
//       }
//     };
//   }, [pickupLocation, dropoffLocation, isMapLoaded]);

//   // Start tracking driver location (for drivers)
//   useEffect(() => {
//     if (!isDriver || !bookingId || !isMapLoaded) return;

//     if (!navigator.geolocation) {
//       setError('Geolocation not supported');
//       return;
//     }

//     // Watch position and update Firestore
//     watchIdRef.current = navigator.geolocation.watchPosition(
//       async (position) => {
//         const location = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//           timestamp: Date.now(),
//           accuracy: position.coords.accuracy,
//           heading: position.coords.heading,
//           speed: position.coords.speed
//         };

//         setDriverLocation(location);

//         // Update Firestore with current location
//         try {
//           await updateDoc(doc(db, 'bookings', bookingId), {
//             driverLocation: location,
//             lastLocationUpdate: serverTimestamp()
//           });

//           // Update or create driver marker on map
//           if (mapInstanceRef.current) {
//             if (driverMarkerRef.current) {
//               driverMarkerRef.current.setPosition([location.lat, location.lng]);
//             } else {
//               const driverMarker = new mappls.Marker({
//                 position: [location.lat, location.lng],
//                 map: mapInstanceRef.current,
//                 title: 'Your Location',
//                 icon: {
//                   url: 'https://apis.mapmyindia.com/map_v3/car.png',
//                   size: [32, 32]
//                 }
//               });
//               driverMarkerRef.current = driverMarker;
//             }

//             // Center map on driver location
//             mapInstanceRef.current.setCenter([location.lat, location.lng]);
//           }
//         } catch (err) {
//           console.error('Error updating location:', err);
//         }
//       },
//       (err) => {
//         console.error('Geolocation error:', err);
//         setError('Failed to get location');
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 5000,
//         maximumAge: 0
//       }
//     );

//     return () => {
//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//       }
//     };
//   }, [isDriver, bookingId, isMapLoaded]);

//   // Listen to driver location updates (for customers)
//   useEffect(() => {
//     if (isDriver || !bookingId || !isMapLoaded) return;

//     const unsubscribe = onSnapshot(
//       doc(db, 'bookings', bookingId),
//       (doc) => {
//         if (doc.exists()) {
//           const data = doc.data();
//           if (data.driverLocation) {
//             setDriverLocation(data.driverLocation);

//             // Update driver marker on map
//             if (mapInstanceRef.current) {
//               if (driverMarkerRef.current) {
//                 driverMarkerRef.current.setPosition([
//                   data.driverLocation.lat, 
//                   data.driverLocation.lng
//                 ]);
//               } else {
//                 const driverMarker = new mappls.Marker({
//                   position: [data.driverLocation.lat, data.driverLocation.lng],
//                   map: mapInstanceRef.current,
//                   title: 'Driver Location',
//                   icon: {
//                     url: 'https://apis.mapmyindia.com/map_v3/car.png',
//                     size: [32, 32]
//                   }
//                 });
//                 driverMarkerRef.current = driverMarker;
//               }
//             }
//           }
//         }
//       },
//       (err) => {
//         console.error('Error listening to location updates:', err);
//       }
//     );

//     return () => unsubscribe();
//   }, [isDriver, bookingId, isMapLoaded]);

//   // Draw route when all locations are available
//   useEffect(() => {
//     if (!isMapLoaded || !mapInstanceRef.current || !pickupLocation?.coordinates || !dropoffLocation?.coordinates) {
//       return;
//     }

//     // Use MapMyIndia Directions API to draw route
//     const drawRoute = async () => {
//       try {
//         if (typeof mappls === 'undefined' || !mappls.direction) {
//           console.log('Direction service not available');
//           return;
//         }

//         const directionService = new mappls.direction({
//           map: mapInstanceRef.current,
//           divId: 'route-panel',
//           start: `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`,
//           end: `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`,
//           via: driverLocation ? `${driverLocation.lat},${driverLocation.lng}` : null,
//         });

//         routeLayerRef.current = directionService;
//       } catch (err) {
//         console.error('Error drawing route:', err);
//       }
//     };

//     drawRoute();
//   }, [isMapLoaded, pickupLocation, dropoffLocation, driverLocation]);

//   if (error) {
//     return (
//       <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
//         <div className="text-center p-6">
//           <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//           </svg>
//           <p className="text-red-600 font-medium">{error}</p>
//           <p className="text-sm text-gray-500 mt-2">Please check your location permissions</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full w-full relative">
//       <div ref={mapRef} className="h-full w-full rounded-lg" />
      
//       {/* Location info overlay */}
//       {driverLocation && (
//         <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm">
//           <div className="font-medium text-gray-700 mb-1">
//             {isDriver ? 'Your Location' : 'Driver Location'}
//           </div>
//           <div className="text-gray-600 space-y-1">
//             <div>Lat: {driverLocation.lat.toFixed(6)}</div>
//             <div>Lng: {driverLocation.lng.toFixed(6)}</div>
//             {driverLocation.speed && (
//               <div>Speed: {(driverLocation.speed * 3.6).toFixed(1)} km/h</div>
//             )}
//             <div className="text-xs text-gray-500">
//               Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Route details panel */}
//       <div id="route-panel" className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 max-h-32 overflow-auto" />
      
//       {/* Status indicator */}
//       {isDriver && (
//         <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
//           <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
//           <span className="text-sm font-medium">Live Tracking Active</span>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DriverTrackingMap;


// import { useEffect, useRef, useState } from 'react';
// import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
// import { db } from '../../../config/firebase';

// const DriverTrackingMap = ({ 
//   bookingId, 
//   userId, 
//   isDriver = false,
//   pickupLocation,
//   dropoffLocation 
// }) => {
//   const mapRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const driverMarkerRef = useRef(null);
//   const pickupMarkerRef = useRef(null);
//   const dropoffMarkerRef = useRef(null);
//   const userMarkerRef = useRef(null);
//   const routeLayerRef = useRef(null);
//   const watchIdRef = useRef(null);
//   const lastUpdateRef = useRef(0);
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [userLocation, setUserLocation] = useState(null);
//   const [error, setError] = useState(null);
//   const [isMapLoaded, setIsMapLoaded] = useState(false);
//   const [isTracking, setIsTracking] = useState(false);

//   // Throttle location updates - only update every 10 seconds
//   const UPDATE_INTERVAL = 10000;

//   // Initialize MapMyIndia map
//   useEffect(() => {
//     if (!mapRef.current || isMapLoaded) return;

//     const initMap = () => {
//       try {
//         if (typeof mappls === 'undefined') {
//           console.error('MapMyIndia SDK not loaded');
//           setError('Map service not available');
//           return;
//         }

//         const map = new mappls.Map(mapRef.current, {
//           center: pickupLocation?.coordinates 
//             ? [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng]
//             : [18.5204, 73.8567],
//           zoom: 12,
//           zoomControl: true,
//           location: true
//         });

//         mapInstanceRef.current = map;
//         setIsMapLoaded(true);

//         // Add pickup marker
//         if (pickupLocation?.coordinates) {
//           const pickupMarker = new mappls.Marker({
//             position: [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng],
//             map: map,
//             title: 'Pickup Location',
//             icon: {
//               url: 'https://apis.mapmyindia.com/map_v3/1.png',
//               size: [32, 32]
//             }
//           });
//           pickupMarkerRef.current = pickupMarker;
//         }

//         // Add dropoff marker
//         if (dropoffLocation?.coordinates) {
//           const dropoffMarker = new mappls.Marker({
//             position: [dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng],
//             map: map,
//             title: 'Dropoff Location',
//             icon: {
//               url: 'https://apis.mapmyindia.com/map_v3/2.png',
//               size: [32, 32]
//             }
//           });
//           dropoffMarkerRef.current = dropoffMarker;
//         }

//         console.log('MapMyIndia map initialized successfully');
//       } catch (err) {
//         console.error('Error initializing map:', err);
//         setError('Failed to initialize map');
//       }
//     };

//     if (typeof mappls === 'undefined') {
//       const script = document.createElement('script');
//       script.src = 'https://apis.mapmyindia.com/advancedmaps/api/5daf36ad6713382dc933efe4f514708e/map_sdk?v=3.0';
//       script.async = true;
//       script.onload = initMap;
//       script.onerror = () => {
//         console.error('Failed to load MapMyIndia SDK');
//         setError('Failed to load map service');
//       };
//       document.head.appendChild(script);

//       const link = document.createElement('link');
//       link.rel = 'stylesheet';
//       link.href = 'https://apis.mapmyindia.com/advancedmaps/api/5daf36ad6713382dc933efe4f514708e/map_sdk?v=3.0';
//       document.head.appendChild(link);
//     } else {
//       initMap();
//     }

//     return () => {
//       if (mapInstanceRef.current) {
//         mapInstanceRef.current = null;
//       }
//     };
//   }, [pickupLocation, dropoffLocation, isMapLoaded]);

//   // Start tracking driver location (for drivers)
//   useEffect(() => {
//     if (!isDriver || !bookingId || !isMapLoaded) return;

//     if (!navigator.geolocation) {
//       setError('Geolocation not supported');
//       return;
//     }

//     setIsTracking(true);

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       async (position) => {
//         const now = Date.now();
//         const timeSinceLastUpdate = now - lastUpdateRef.current;

//         const location = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//           timestamp: now,
//           accuracy: position.coords.accuracy,
//           heading: position.coords.heading,
//           speed: position.coords.speed
//         };

//         setDriverLocation(location);

//         // Update driver marker locally (smooth UI)
//         if (mapInstanceRef.current) {
//           if (driverMarkerRef.current) {
//             driverMarkerRef.current.setPosition([location.lat, location.lng]);
//           } else {
//             const driverMarker = new mappls.Marker({
//               position: [location.lat, location.lng],
//               map: mapInstanceRef.current,
//               title: 'Your Location',
//               icon: {
//                 url: 'https://apis.mapmyindia.com/map_v3/car.png',
//                 size: [32, 32]
//               }
//             });
//             driverMarkerRef.current = driverMarker;
//           }

//           if (!lastUpdateRef.current) {
//             mapInstanceRef.current.setCenter([location.lat, location.lng]);
//           }
//         }

//         // Throttle Firestore updates
//         if (timeSinceLastUpdate < UPDATE_INTERVAL) {
//           return;
//         }

//         try {
//           await updateDoc(doc(db, 'airportTransfers', bookingId), {
//             driverLocation: location,
//             lastLocationUpdate: serverTimestamp()
//           });
//           lastUpdateRef.current = now;
//         } catch (err) {
//           console.error('Error updating location in Firestore:', err);
//         }
//       },
//       (err) => {
//         console.error('Geolocation error:', err);
//         setError('Failed to get location. Please enable location permissions.');
//         setIsTracking(false);
//       },
//       {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 5000
//       }
//     );

//     return () => {
//       if (watchIdRef.current) {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//       }
//       setIsTracking(false);
//     };
//   }, [isDriver, bookingId, isMapLoaded]);

//   // Listen to driver AND user location updates (for both driver and customer)
//   useEffect(() => {
//     if (!bookingId || !isMapLoaded) return;

//     const unsubscribe = onSnapshot(
//       doc(db, 'airportTransfers', bookingId),
//       (docSnapshot) => {
//         if (docSnapshot.exists()) {
//           const data = docSnapshot.data();
          
//           // Update driver location
//           if (data.driverLocation) {
//             setDriverLocation(data.driverLocation);

//             if (mapInstanceRef.current && !isDriver) {
//               if (driverMarkerRef.current) {
//                 driverMarkerRef.current.setPosition([
//                   data.driverLocation.lat, 
//                   data.driverLocation.lng
//                 ]);
//               } else {
//                 const driverMarker = new mappls.Marker({
//                   position: [data.driverLocation.lat, data.driverLocation.lng],
//                   map: mapInstanceRef.current,
//                   title: 'Driver Location',
//                   icon: {
//                     url: 'https://apis.mapmyindia.com/map_v3/car.png',
//                     size: [32, 32]
//                   }
//                 });
//                 driverMarkerRef.current = driverMarker;
//               }
//             }
//           }

//           // Update user location (displayed for driver)
//           if (data.userLocation) {
//             setUserLocation(data.userLocation);

//             if (mapInstanceRef.current && isDriver) {
//               if (userMarkerRef.current) {
//                 userMarkerRef.current.setPosition([
//                   data.userLocation.lat,
//                   data.userLocation.lng
//                 ]);
//               } else {
//                 const userMarker = new mappls.Marker({
//                   position: [data.userLocation.lat, data.userLocation.lng],
//                   map: mapInstanceRef.current,
//                   title: 'Customer Location',
//                   icon: {
//                     url: 'https://apis.mapmyindia.com/map_v3/person.png',
//                     size: [32, 32]
//                   }
//                 });
//                 userMarkerRef.current = userMarker;
//               }
//             }
//           }
//         }
//       },
//       (err) => {
//         console.error('Error listening to location updates:', err);
//       }
//     );

//     return () => unsubscribe();
//   }, [bookingId, isMapLoaded, isDriver]);

//   // Draw route when all locations are available
//   useEffect(() => {
//     if (!isMapLoaded || !mapInstanceRef.current || !pickupLocation?.coordinates || !dropoffLocation?.coordinates) {
//       return;
//     }

//     const drawRoute = async () => {
//       try {
//         if (typeof mappls === 'undefined' || !mappls.direction) {
//           return;
//         }

//         if (routeLayerRef.current) {
//           routeLayerRef.current.remove();
//         }

//         const directionService = new mappls.direction({
//           map: mapInstanceRef.current,
//           divId: 'route-panel',
//           start: `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`,
//           end: `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`,
//           via: driverLocation ? `${driverLocation.lat},${driverLocation.lng}` : null,
//         });

//         routeLayerRef.current = directionService;
//       } catch (err) {
//         console.error('Error drawing route:', err);
//       }
//     };

//     const timeoutId = setTimeout(drawRoute, 1000);
//     return () => clearTimeout(timeoutId);
//   }, [isMapLoaded, pickupLocation, dropoffLocation, driverLocation]);

//   if (error) {
//     return (
//       <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
//         <div className="text-center p-6">
//           <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//           </svg>
//           <p className="text-red-600 font-medium">{error}</p>
//           <p className="text-sm text-gray-500 mt-2">Please check your location permissions</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-full w-full relative">
//       <div ref={mapRef} className="h-full w-full rounded-lg" />
      
//       {/* Driver Location Info */}
//       {driverLocation && (
//         <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm max-w-xs">
//           <div className="font-medium text-gray-700 mb-1">
//             {isDriver ? 'Your Location' : 'Driver Location'}
//           </div>
//           <div className="text-gray-600 space-y-1">
//             <div className="text-xs">Lat: {driverLocation.lat.toFixed(6)}</div>
//             <div className="text-xs">Lng: {driverLocation.lng.toFixed(6)}</div>
//             {driverLocation.speed !== null && driverLocation.speed !== undefined && (
//               <div className="text-xs">Speed: {(driverLocation.speed * 3.6).toFixed(1)} km/h</div>
//             )}
//             <div className="text-xs text-gray-500">
//               Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* User Location Info (shown to driver) */}
//       {isDriver && userLocation && (
//         <div className="absolute top-32 left-4 bg-blue-50 rounded-lg shadow-lg p-3 text-sm max-w-xs border border-blue-200">
//           <div className="font-medium text-blue-700 mb-1">
//             Customer Location
//           </div>
//           <div className="text-blue-600 space-y-1">
//             <div className="text-xs">Lat: {userLocation.lat.toFixed(6)}</div>
//             <div className="text-xs">Lng: {userLocation.lng.toFixed(6)}</div>
//             <div className="text-xs text-blue-500">
//               Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
//             </div>
//           </div>
//         </div>
//       )}

//       <div id="route-panel" className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 max-h-32 overflow-auto hidden" />
      
//       {isDriver && isTracking && (
//         <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
//           <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
//           <span className="text-sm font-medium">Tracking Active</span>
//         </div>
//       )}

//       {!isMapLoaded && (
//         <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading map...</p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DriverTrackingMap;

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';

const DriverTrackingMap = ({ 
  bookingId, 
  userId, 
  isDriver = false,
  pickupLocation,
  dropoffLocation 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastUpdateRef = useRef(0);
  const [driverLocation, setDriverLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isTracking, setIsTracking] = useState(false);

  // Throttle location updates - only update every 10 seconds
  const UPDATE_INTERVAL = 10000; // 10 seconds

  // Initialize MapMyIndia map
  useEffect(() => {
    if (!mapRef.current || isMapLoaded) return;

    const initMap = () => {
      try {
        // Check if MapmyIndia is loaded
        if (typeof mappls === 'undefined') {
          console.error('MapMyIndia SDK not loaded');
          setError('Map service not available');
          return;
        }

        // Initialize map
        const map = new mappls.Map(mapRef.current, {
          center: pickupLocation?.coordinates 
            ? [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng]
            : [18.5204, 73.8567], // Default to Pune
          zoom: 12,
          zoomControl: true,
          location: true
        });

        mapInstanceRef.current = map;
        setIsMapLoaded(true);

        // Add pickup marker
        if (pickupLocation?.coordinates) {
          const pickupMarker = new mappls.Marker({
            position: [pickupLocation.coordinates.lat, pickupLocation.coordinates.lng],
            map: map,
            title: 'Pickup Location',
            icon: {
              url: 'https://apis.mapmyindia.com/map_v3/1.png',
              size: [32, 32]
            }
          });
          pickupMarkerRef.current = pickupMarker;
        }

        // Add dropoff marker
        if (dropoffLocation?.coordinates) {
          const dropoffMarker = new mappls.Marker({
            position: [dropoffLocation.coordinates.lat, dropoffLocation.coordinates.lng],
            map: map,
            title: 'Dropoff Location',
            icon: {
              url: 'https://apis.mapmyindia.com/map_v3/2.png',
              size: [32, 32]
            }
          });
          dropoffMarkerRef.current = dropoffMarker;
        }

        console.log('MapMyIndia map initialized successfully');
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map');
      }
    };

    // Load MapMyIndia script if not already loaded
    if (typeof mappls === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://apis.mapmyindia.com/advancedmaps/api/5daf36ad6713382dc933efe4f514708e/map_sdk?v=3.0';
      script.async = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Failed to load MapMyIndia SDK');
        setError('Failed to load map service');
      };
      document.head.appendChild(script);

      // Also load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://apis.mapmyindia.com/advancedmaps/api/5daf36ad6713382dc933efe4f514708e/map_sdk?v=3.0';
      document.head.appendChild(link);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) {
        // Cleanup map instance
        mapInstanceRef.current = null;
      }
    };
  }, [pickupLocation, dropoffLocation, isMapLoaded]);

  // Start tracking driver location (for drivers)
  useEffect(() => {
    if (!isDriver || !bookingId || !isMapLoaded) return;

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);

    // Watch position and update Firestore with throttling
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        const timeSinceLastUpdate = now - lastUpdateRef.current;

        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: now,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        };

        // Always update local state for smooth UI
        setDriverLocation(location);

        // Update or create driver marker on map (local update - no throttling)
        if (mapInstanceRef.current) {
          if (driverMarkerRef.current) {
            driverMarkerRef.current.setPosition([location.lat, location.lng]);
          } else {
            const driverMarker = new mappls.Marker({
              position: [location.lat, location.lng],
              map: mapInstanceRef.current,
              title: 'Your Location',
              icon: {
                url: 'https://apis.mapmyindia.com/map_v3/car.png',
                size: [32, 32]
              }
            });
            driverMarkerRef.current = driverMarker;
          }

          // Center map on driver location only on first update or significant movement
          if (!lastUpdateRef.current) {
            mapInstanceRef.current.setCenter([location.lat, location.lng]);
          }
        }

        // Only update Firestore if enough time has passed (throttling)
        if (timeSinceLastUpdate < UPDATE_INTERVAL) {
          console.log(`Skipping Firestore update. Next update in ${Math.ceil((UPDATE_INTERVAL - timeSinceLastUpdate) / 1000)}s`);
          return;
        }

        // Update Firestore with current location
        try {
          console.log('Updating driver location in Firestore:', location);
          await updateDoc(doc(db, 'airportTransfers', bookingId), {
            driverLocation: location,
            lastLocationUpdate: serverTimestamp()
          });
          lastUpdateRef.current = now;
          console.log('Location updated successfully');
        } catch (err) {
          console.error('Error updating location in Firestore:', err);
          // Don't set error state here to avoid disrupting the UI
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('Failed to get location. Please enable location permissions.');
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => {
      console.log('Cleaning up geolocation watch');
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsTracking(false);
    };
  }, [isDriver, bookingId, isMapLoaded]);

  // Listen to driver location and user location updates
  useEffect(() => {
    if (!bookingId || !isMapLoaded) return;

    console.log('Setting up listener for location updates');

    const unsubscribe = onSnapshot(
      doc(db, 'airportTransfers', bookingId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          
          // Update driver location (for customers viewing driver)
          if (data.driverLocation && !isDriver) {
            console.log('Received driver location update:', data.driverLocation);
            setDriverLocation(data.driverLocation);

            // Update driver marker on map
            if (mapInstanceRef.current) {
              if (driverMarkerRef.current) {
                driverMarkerRef.current.setPosition([
                  data.driverLocation.lat, 
                  data.driverLocation.lng
                ]);
              } else {
                const driverMarker = new mappls.Marker({
                  position: [data.driverLocation.lat, data.driverLocation.lng],
                  map: mapInstanceRef.current,
                  title: 'Driver Location',
                  icon: {
                    url: 'https://apis.mapmyindia.com/map_v3/car.png',
                    size: [32, 32]
                  }
                });
                driverMarkerRef.current = driverMarker;
              }
            }
          }

          // Update user location (for drivers viewing customer)
          if (data.userLocation && isDriver) {
            console.log('Received user location update:', data.userLocation);
            setUserLocation(data.userLocation);

            // Update user marker on map
            if (mapInstanceRef.current) {
              if (userMarkerRef.current) {
                userMarkerRef.current.setPosition([
                  data.userLocation.lat,
                  data.userLocation.lng
                ]);
              } else {
                const userMarker = new mappls.Marker({
                  position: [data.userLocation.lat, data.userLocation.lng],
                  map: mapInstanceRef.current,
                  title: 'Customer Location',
                  icon: {
                    url: 'https://apis.mapmyindia.com/map_v3/person.png',
                    size: [32, 32]
                  }
                });
                userMarkerRef.current = userMarker;
              }
            }
          }
        }
      },
      (err) => {
        console.error('Error listening to location updates:', err);
      }
    );

    return () => {
      console.log('Cleaning up location listener');
      unsubscribe();
    };
  }, [bookingId, isMapLoaded, isDriver]);

  // Draw route when all locations are available
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current || !pickupLocation?.coordinates || !dropoffLocation?.coordinates) {
      return;
    }

    // Use MapMyIndia Directions API to draw route
    const drawRoute = async () => {
      try {
        if (typeof mappls === 'undefined' || !mappls.direction) {
          console.log('Direction service not available');
          return;
        }

        // Clear existing route if any
        if (routeLayerRef.current) {
          routeLayerRef.current.remove();
        }

        const directionService = new mappls.direction({
          map: mapInstanceRef.current,
          divId: 'route-panel',
          start: `${pickupLocation.coordinates.lat},${pickupLocation.coordinates.lng}`,
          end: `${dropoffLocation.coordinates.lat},${dropoffLocation.coordinates.lng}`,
          via: driverLocation ? `${driverLocation.lat},${driverLocation.lng}` : null,
        });

        routeLayerRef.current = directionService;
      } catch (err) {
        console.error('Error drawing route:', err);
      }
    };

    // Debounce route drawing to avoid excessive API calls
    const timeoutId = setTimeout(drawRoute, 1000);
    return () => clearTimeout(timeoutId);
  }, [isMapLoaded, pickupLocation, dropoffLocation, driverLocation]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center p-6">
          <svg className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please check your location permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full rounded-lg" />
      
      {/* Driver Location info overlay */}
      {driverLocation && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-sm max-w-xs">
          <div className="font-medium text-gray-700 mb-1">
            {isDriver ? 'Your Location' : 'Driver Location'}
          </div>
          <div className="text-gray-600 space-y-1">
            <div className="text-xs">Lat: {driverLocation.lat.toFixed(6)}</div>
            <div className="text-xs">Lng: {driverLocation.lng.toFixed(6)}</div>
            {driverLocation.speed !== null && driverLocation.speed !== undefined && (
              <div className="text-xs">Speed: {(driverLocation.speed * 3.6).toFixed(1)} km/h</div>
            )}
            <div className="text-xs text-gray-500">
              Updated: {new Date(driverLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* User Location Info (shown to driver) */}
      {isDriver && userLocation && (
        <div className="absolute top-32 left-4 bg-blue-50 rounded-lg shadow-lg p-3 text-sm max-w-xs border border-blue-200">
          <div className="font-medium text-blue-700 mb-1">
            Customer Location
          </div>
          <div className="text-blue-600 space-y-1">
            <div className="text-xs">Lat: {userLocation.lat.toFixed(6)}</div>
            <div className="text-xs">Lng: {userLocation.lng.toFixed(6)}</div>
            <div className="text-xs text-blue-500">
              Updated: {new Date(userLocation.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Route details panel */}
      <div id="route-panel" className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 max-h-32 overflow-auto hidden" />
      
      {/* Status indicator */}
      {isDriver && isTracking && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium">Tracking Active</span>
        </div>
      )}

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTrackingMap;