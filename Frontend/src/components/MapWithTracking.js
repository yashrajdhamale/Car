// import React, { useEffect, useRef, useState } from 'react';
// import { UberStyleTracking } from '../utils/uberTracking';

// const MapWithTracking = ({ 
//   driverLocation, 
//   customerLocation, 
//   pickupLocation,
//   dropoffLocation,
//   routeData,
//   onMapClick,
//   showPredictions = true,
//   apiKey
// }) => {
//   const mapRef = useRef(null);
//   const mapInstanceRef = useRef(null);
//   const markersRef = useRef({});
//   const polylineRef = useRef(null);
//   const predictionLineRef = useRef(null);
//   const [mapLoaded, setMapLoaded] = useState(false);
//   const [trackingService] = useState(() => new UberStyleTracking(apiKey));

//   // Initialize map
//   useEffect(() => {
//     if (!apiKey) {
//       console.error('Map API key required');
//       return;
//     }

//     const initMap = async () => {
//       try {
//         await loadMapMyIndia();
        
//         if (!mapRef.current) return;
        
//         // Calculate center
//         const locations = [driverLocation, customerLocation, pickupLocation, dropoffLocation]
//           .filter(Boolean)
//           .map(loc => [loc.lat, loc.lng]);
        
//         const center = locations.length > 0 
//           ? [locations[0][0], locations[0][1]]
//           : [18.5204, 73.8567]; // Default to Pune
        
//         // Create map
//         const map = L.map(mapRef.current).setView(center, 13);
//         mapInstanceRef.current = map;
        
//         // Add MapMyIndia tile layer
//         L.mapmyindia.tileLayer('vector').addTo(map);
        
//         // Add zoom control
//         L.control.zoom({ position: 'topright' }).addTo(map);
        
//         setMapLoaded(true);
        
//         // Add click handler
//         if (onMapClick) {
//           map.on('click', onMapClick);
//         }
        
//         // Cleanup
//         return () => {
//           if (mapInstanceRef.current) {
//             mapInstanceRef.current.remove();
//             mapInstanceRef.current = null;
//           }
//         };
//       } catch (error) {
//         console.error('Map initialization error:', error);
//       }
//     };

//     initMap();
//   }, [apiKey]);

//   // Load MapMyIndia SDK
//   const loadMapMyIndia = () => {
//     return new Promise((resolve, reject) => {
//       if (window.L && window.L.mapmyindia) {
//         resolve(window.L.mapmyindia);
//         return;
//       }

//       const script = document.createElement('script');
//       script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${apiKey}/map_load?v=1.3`;
//       script.onload = () => {
//         // Load vector layer
//         const vectorScript = document.createElement('script');
//         vectorScript.src = `https://apis.mapmyindia.com/advancedmaps/api/${apiKey}/map_sdk?layer=vector&v=1.3`;
//         vectorScript.onload = () => resolve(window.L.mapmyindia);
//         vectorScript.onerror = reject;
//         document.head.appendChild(vectorScript);
//       };
//       script.onerror = reject;
//       document.head.appendChild(script);
//     });
//   };

//   // Update driver marker with animation
//   useEffect(() => {
//     if (!mapLoaded || !driverLocation || !mapInstanceRef.current) return;

//     const map = mapInstanceRef.current;
    
//     // Create or update driver marker
//     if (!markersRef.current.driver) {
//       const driverIcon = L.divIcon({
//         html: `
//           <div class="driver-marker" style="
//             background: #34D399;
//             width: 32px;
//             height: 32px;
//             border-radius: 50%;
//             border: 3px solid white;
//             box-shadow: 0 2px 10px rgba(0,0,0,0.3);
//             display: flex;
//             align-items: center;
//             justify-content: center;
//             animation: pulse 2s infinite;
//           ">
//             <div style="font-size: 16px;">🚗</div>
//             ${driverLocation.speed > 0 ? `
//               <div style="
//                 position: absolute;
//                 top: -25px;
//                 left: 50%;
//                 transform: translateX(-50%);
//                 background: white;
//                 padding: 2px 6px;
//                 border-radius: 10px;
//                 font-size: 10px;
//                 font-weight: bold;
//                 box-shadow: 0 1px 3px rgba(0,0,0,0.2);
//                 white-space: nowrap;
//               ">
//                 ${Math.round(driverLocation.speed || 0)} km/h
//               </div>
//             ` : ''}
//           </div>
//           <style>
//             @keyframes pulse {
//               0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
//               70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
//               100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
//             }
//           </style>
//         `,
//         iconSize: [32, 32],
//         iconAnchor: [16, 16],
//         className: 'driver-marker-container'
//       });

//       markersRef.current.driver = L.marker(
//         [driverLocation.lat, driverLocation.lng],
//         { icon: driverIcon, zIndexOffset: 1000 }
//       ).addTo(map);
      
//       // Add tooltip
//       markersRef.current.driver.bindTooltip(
//         `Driver<br>Speed: ${Math.round(driverLocation.speed || 0)} km/h<br>Updated: Just now`,
//         { direction: 'top', offset: [0, -10] }
//       );
//     } else {
//       // Smooth animation for marker movement
//       const oldLatLng = markersRef.current.driver.getLatLng();
//       const newLatLng = L.latLng(driverLocation.lat, driverLocation.lng);
      
//       // Only animate if distance > 10 meters
//       const distance = oldLatLng.distanceTo(newLatLng);
//       if (distance > 10) {
//         // Smooth transition
//         markersRef.current.driver.setLatLng(newLatLng, {
//           duration: 2000,
//           easeLinearity: 0.25
//         });
        
//         // Update tooltip
//         markersRef.current.driver.setTooltipContent(
//           `Driver<br>Speed: ${Math.round(driverLocation.speed || 0)} km/h<br>Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
//         );
//       }
//     }
//   }, [driverLocation, mapLoaded]);

//   // Update customer marker
//   useEffect(() => {
//     if (!mapLoaded || !customerLocation || !mapInstanceRef.current) return;

//     const map = mapInstanceRef.current;
    
//     if (!markersRef.current.customer) {
//       const customerIcon = L.divIcon({
//         html: `
//           <div style="
//             background: #3B82F6;
//             width: 28px;
//             height: 28px;
//             border-radius: 50%;
//             border: 3px solid white;
//             box-shadow: 0 2px 8px rgba(0,0,0,0.3);
//             display: flex;
//             align-items: center;
//             justify-content: center;
//           ">
//             <div style="font-size: 14px;">📍</div>
//           </div>
//         `,
//         iconSize: [28, 28],
//         iconAnchor: [14, 14]
//       });

//       markersRef.current.customer = L.marker(
//         [customerLocation.lat, customerLocation.lng],
//         { icon: customerIcon, zIndexOffset: 500 }
//       ).addTo(map);
      
//       markersRef.current.customer.bindTooltip(
//         `Customer Location<br>Accuracy: ±${Math.round(customerLocation.accuracy || 0)}m`,
//         { direction: 'top' }
//       );
//     } else {
//       markersRef.current.customer.setLatLng([customerLocation.lat, customerLocation.lng]);
//     }
//   }, [customerLocation, mapLoaded]);

//   // Draw route
//   useEffect(() => {
//     if (!mapLoaded || !routeData?.polyline || !mapInstanceRef.current) return;

//     const map = mapInstanceRef.current;
    
//     // Clear previous route
//     if (polylineRef.current) {
//       polylineRef.current.remove();
//     }
    
//     try {
//       // Decode polyline if needed (MapMyIndia returns encoded polyline)
//       const decodedPath = this.decodePolyline(routeData.polyline);
      
//       polylineRef.current = L.polyline(decodedPath, {
//         color: '#3B82F6',
//         weight: 4,
//         opacity: 0.8,
//         dashArray: routeData.distance > 5000 ? '10, 10' : null,
//         lineCap: 'round',
//         lineJoin: 'round'
//       }).addTo(map);
      
//       // Fit map to route bounds
//       const bounds = polylineRef.current.getBounds();
//       map.fitBounds(bounds, { padding: [50, 50] });
//     } catch (error) {
//       console.error('Error drawing route:', error);
//     }
//   }, [routeData, mapLoaded]);

//   // Draw predicted path
//   useEffect(() => {
//     if (!mapLoaded || !showPredictions || !driverLocation || !driverLocation.speed || !driverLocation.heading) return;

//     const map = mapInstanceRef.current;
    
//     // Clear previous prediction
//     if (predictionLineRef.current) {
//       predictionLineRef.current.remove();
//     }
    
//     // Predict position 30 seconds ahead
//     const predictedPos = trackingService.predictDriverPosition(
//       driverLocation,
//       driverLocation.speed,
//       driverLocation.heading,
//       30
//     );
    
//     const path = [
//       [driverLocation.lat, driverLocation.lng],
//       [predictedPos.lat, predictedPos.lng]
//     ];
    
//     predictionLineRef.current = L.polyline(path, {
//       color: '#10B981',
//       weight: 2,
//       opacity: 0.6,
//       dashArray: '5, 10',
//       className: 'prediction-line'
//     }).addTo(map);
//   }, [driverLocation, showPredictions, mapLoaded, trackingService]);

//   // Helper: Decode polyline
//   const decodePolyline = (encoded) => {
//     const points = [];
//     let index = 0, len = encoded.length;
//     let lat = 0, lng = 0;
    
//     while (index < len) {
//       let b, shift = 0, result = 0;
//       do {
//         b = encoded.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
//       lat += dlat;

//       shift = 0;
//       result = 0;
//       do {
//         b = encoded.charCodeAt(index++) - 63;
//         result |= (b & 0x1f) << shift;
//         shift += 5;
//       } while (b >= 0x20);
//       const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
//       lng += dlng;

//       points.push([lat * 1e-5, lng * 1e-5]);
//     }
    
//     return points;
//   };

//   return (
//     <div 
//       ref={mapRef} 
//       className="w-full h-full rounded-lg"
//       style={{ minHeight: '400px' }}
//     />
//   );
// };

// export default MapWithTracking;

// src/components/MapWithTracking.js - COMPLETE FIXED VERSION
import React, { useEffect, useRef, useState, useCallback } from 'react';

const MapWithTracking = ({ 
  driverLocation, 
  customerLocation, 
  pickupLocation,
  dropoffLocation,
  routeData,
  onMapClick,
  showPredictions = true,
  apiKey
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Load Leaflet once
  useEffect(() => {
    const loadLeaflet = () => {
      if (window.L) {
        console.log('✅ Leaflet already loaded');
        setLeafletLoaded(true);
        return;
      }

      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      
      script.onload = () => {
        console.log('✅ Leaflet loaded successfully');
        setLeafletLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Leaflet:', error);
        setMapError(true);
      };
      
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Initialize map only once
  const initializeMap = useCallback(() => {
    if (!leafletLoaded || mapInitialized || !mapRef.current) {
      console.log('⚠️ Cannot initialize map:', {
        leafletLoaded,
        mapInitialized,
        hasMapRef: !!mapRef.current
      });
      return;
    }

    console.log('🗺️ Initializing map...');
    
    try {
      // Clear any existing map
      if (mapInstanceRef.current) {
        console.log('🗑️ Removing existing map instance');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Get container dimensions
      const container = mapRef.current;
      if (!container || container.offsetWidth === 0) {
        console.log('⚠️ Map container has no dimensions');
        setTimeout(initializeMap, 100);
        return;
      }

      // Calculate center
      let centerLat = 18.5204; // Default Pune
      let centerLng = 73.8567;
      
      if (driverLocation) {
        centerLat = driverLocation.lat;
        centerLng = driverLocation.lng;
      } else if (customerLocation) {
        centerLat = customerLocation.lat;
        centerLng = customerLocation.lng;
      }

      // Create map
      console.log('📍 Creating map at:', centerLat, centerLng);
      const map = window.L.map(container).setView([centerLat, centerLng], 15);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      setMapLoaded(true);
      setMapInitialized(true);
      setMapError(false);
      
      console.log('✅ Map initialized successfully');

      // Add click handler if provided
      if (onMapClick) {
        map.on('click', onMapClick);
      }

      return map;
      
    } catch (error) {
      console.error('❌ Map initialization error:', error);
      setMapError(true);
      return null;
    }
  }, [leafletLoaded, mapInitialized, driverLocation, customerLocation, onMapClick]);

  // Initialize map when ready
  useEffect(() => {
    if (leafletLoaded && !mapInitialized && mapRef.current) {
      const timer = setTimeout(initializeMap, 100);
      return () => clearTimeout(timer);
    }
  }, [leafletLoaded, mapInitialized, initializeMap]);

  // Update driver marker
  useEffect(() => {
    if (!mapLoaded || !driverLocation || !mapInstanceRef.current) {
      return;
    }

    const map = mapInstanceRef.current;
    
    // Create driver icon
    const driverIcon = window.L.divIcon({
      html: `
        <div style="
          background: #34D399;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <div style="font-size: 16px;">🚗</div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(52, 211, 153, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
          }
        </style>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'driver-marker'
    });

    // Update or create marker
    if (markersRef.current.driver) {
      markersRef.current.driver.setLatLng([driverLocation.lat, driverLocation.lng]);
    } else {
      markersRef.current.driver = window.L.marker(
        [driverLocation.lat, driverLocation.lng],
        { icon: driverIcon, zIndexOffset: 1000 }
      ).addTo(map);
      
      markersRef.current.driver.bindTooltip('Driver');
    }
  }, [driverLocation, mapLoaded]);

  // Update customer marker
  useEffect(() => {
    if (!mapLoaded || !customerLocation || !mapInstanceRef.current) {
      return;
    }

    const map = mapInstanceRef.current;
    
    // Create customer icon
    const customerIcon = window.L.divIcon({
      html: `
        <div style="
          background: #3B82F6;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="font-size: 14px;">📍</div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Update or create marker
    if (markersRef.current.customer) {
      markersRef.current.customer.setLatLng([customerLocation.lat, customerLocation.lng]);
    } else {
      markersRef.current.customer = window.L.marker(
        [customerLocation.lat, customerLocation.lng],
        { icon: customerIcon, zIndexOffset: 500 }
      ).addTo(map);
      
      markersRef.current.customer.bindTooltip('Your Location');
    }
  }, [customerLocation, mapLoaded]);

  // Draw route line
  useEffect(() => {
    if (!mapLoaded || !driverLocation || !customerLocation || !mapInstanceRef.current) {
      return;
    }

    const map = mapInstanceRef.current;
    
    // Clear previous route
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
    }
    
    try {
      // Draw simple line between driver and customer
      const path = [
        [driverLocation.lat, driverLocation.lng],
        [customerLocation.lat, customerLocation.lng]
      ];
      
      polylineRef.current = window.L.polyline(path, {
        color: '#3B82F6',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      
      // Fit map to show both markers with padding
      const bounds = window.L.latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50] });
      
    } catch (error) {
      console.error('Error drawing route:', error);
    }
  }, [driverLocation, customerLocation, mapLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        console.log('🧹 Cleaning up map');
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 font-medium">Map Loading Failed</p>
            <p className="text-gray-500 text-sm mt-2">Location tracking is still active</p>
            <button
              onClick={() => {
                setMapError(false);
                setMapInitialized(false);
                setTimeout(initializeMap, 100);
              }}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4 mx-auto"></div>
            <p className="text-gray-700">Loading map...</p>
            {!leafletLoaded && <p className="text-sm text-gray-500 mt-1">Loading map library</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapWithTracking;