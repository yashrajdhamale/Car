


import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================
// FIX LEAFLET DEFAULT MARKER ICONS
// This is CRITICAL for markers to show!
// ============================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OutstationTrackingMap({ 
  userLocation, 
  driverLocation,
  pickupLocation,
  destinationLocation,
  routeInfo 
}) {
  const [map, setMap] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);
  const [liveETA, setLiveETA] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapContainerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const mapInitialized = useRef(false);

  // ============================================
  // CALCULATE LIVE DISTANCE
  // ============================================
  useEffect(() => {
    if (!userLocation?.lat || !driverLocation?.lat) {
      setLiveDistance(null);
      setLiveETA(null);
      return;
    }

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const toRad = (value) => (value * Math.PI) / 180;

    const distanceKm = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      driverLocation.lat,
      driverLocation.lng
    );

    const etaMinutes = (distanceKm / 40) * 60;

    setLiveDistance(distanceKm);
    setLiveETA(Math.ceil(etaMinutes));

    console.log('📏 Distance:', distanceKm.toFixed(3), 'km =', (distanceKm * 1000).toFixed(0), 'm');
  }, [userLocation, driverLocation]);

  // ============================================
  // INITIALIZE MAP - With proper cleanup
  // ============================================
  useEffect(() => {
    if (!mapContainerRef.current || mapInitialized.current) return;

    console.log('🗺️ Initializing map...');

    // Prevent double initialization
    mapInitialized.current = true;

    // Default center
    const defaultCenter = userLocation?.lat 
      ? [userLocation.lat, userLocation.lng]
      : [18.5204, 73.8567]; // Pune

    try {
      // Create map
      const mapInstance = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Use OpenStreetMap tiles (ALWAYS works, no API key needed!)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance);

      console.log('✅ Map created successfully');

      setMap(mapInstance);
      setIsMapReady(true);

    } catch (error) {
      console.error('❌ Map initialization error:', error);
    }

    // Cleanup
    return () => {
      if (mapContainerRef.current?._leaflet_id) {
        try {
          mapContainerRef.current._leaflet?.remove();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []); // Only run once on mount

  // ============================================
  // UPDATE MARKERS
  // ============================================
  useEffect(() => {
    if (!map || !isMapReady) return;

    console.log('🔄 Updating markers...');

    // Remove old markers
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // Add USER marker (blue)
    if (userLocation?.lat && userLocation?.lng) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #4285F4; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); z-index: 10;"></div>
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #4285F4; opacity: 0.3; animation: pulse 2s infinite;"></div>
            <style>
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.3; }
                50% { transform: scale(1.5); opacity: 0.1; }
              }
            </style>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
      }).addTo(map);

      console.log('✅ User marker added');
    }

    // Add DRIVER marker (green)
    if (driverLocation?.lat && driverLocation?.lng) {
      const driverIcon = L.divIcon({
        className: 'driver-marker',
        html: `
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #10B981; border: 4px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });

      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], {
        icon: driverIcon,
      }).addTo(map);

      console.log('✅ Driver marker added');
    }

    // Draw route line
    if (userLocation?.lat && driverLocation?.lat) {
      routeLineRef.current = L.polyline(
        [
          [userLocation.lat, userLocation.lng],
          [driverLocation.lat, driverLocation.lng],
        ],
        {
          color: '#4285F4',
          weight: 4,
          opacity: 0.7,
        }
      ).addTo(map);

      console.log('✅ Route line added');

      // Fit bounds
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [driverLocation.lat, driverLocation.lng],
      ]);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 });
    } else if (userLocation?.lat) {
      map.setView([userLocation.lat, userLocation.lng], 15);
    } else if (driverLocation?.lat) {
      map.setView([driverLocation.lat, driverLocation.lng], 15);
    }
  }, [map, isMapReady, userLocation, driverLocation]);

  // Format distance
  const formatDistance = (distanceKm) => {
    if (!distanceKm && distanceKm !== 0) return '-- m';
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(2)} km`;
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ 
          minHeight: '400px',
          height: '100%',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          backgroundColor: '#f0f0f0'
        }}
      />
      
      {/* Loading indicator */}
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-[9999]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Live Distance - Top Right */}
      {liveDistance !== null && isMapReady && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 z-[1000] min-w-[180px]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Distance</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatDistance(liveDistance)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ETA</span>
              <span className="text-2xl font-bold text-green-600">
                {liveETA} min
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Legend - Bottom Left */}
      {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-xs font-medium">Your Location</span>
              {userLocation && <span className="text-xs text-green-600">●</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
              <span className="text-xs font-medium">Your Driver</span>
              {driverLocation && <span className="text-xs text-green-600">●</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span className="text-xs font-medium">Route</span>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {import.meta.env.DEV && isMapReady && (
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg z-[1000] font-mono max-w-xs">
          <div className="space-y-1">
            <div className="font-bold text-green-400">🔍 Debug</div>
            <div>Map: {isMapReady ? '✅' : '❌'}</div>
            <div>User: {userLocation ? `✅ ${userLocation.lat.toFixed(4)}` : '❌'}</div>
            <div>Driver: {driverLocation ? `✅ ${driverLocation.lat.toFixed(4)}` : '❌'}</div>
            <div>Distance: {liveDistance ? `${(liveDistance * 1000).toFixed(0)}m` : 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );
}