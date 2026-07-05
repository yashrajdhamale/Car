import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
import './LocationPicker.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// Make maplibregl available globally for geocoder
if (typeof window !== 'undefined') {
  window.maplibregl = maplibregl;
}

const LocationPicker = ({ onLocationSelect, city }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({
    pickup: null,
    drop: null
  });
  const [activeMarker, setActiveMarker] = useState('pickup');
  const [mapInitialized, setMapInitialized] = useState(false);
  const geocoder = useRef(null);

  // Handle geocoder result
  const handleGeocoderResult = useCallback((e) => {
    if (e.result && e.result.geometry) {
      const coordinates = e.result.geometry.coordinates;
      
      // Remove existing marker if it exists
      if (markers.current[activeMarker]) {
        markers.current[activeMarker].remove();
      }
      
      // Create new marker
      const marker = new maplibregl.Marker({
        color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
        draggable: true
      })
        .setLngLat(coordinates)
        .addTo(map.current);
      
      // Store marker reference
      markers.current[activeMarker] = marker;
      
      // Update marker position on drag end
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        if (onLocationSelect) {
          onLocationSelect(activeMarker, [lngLat.lng, lngLat.lat]);
        }
      });
      
      // Trigger location select
      if (onLocationSelect) {
        onLocationSelect(activeMarker, coordinates);
      }
      
      // Zoom to the selected location
      map.current.flyTo({
        center: coordinates,
        zoom: 14
      });
    }
  }, [activeMarker, onLocationSelect]);

  // Handle map click
  const handleMapClick = useCallback((e) => {
    if (!map.current) return;
    
    const coordinates = [e.lngLat.lng, e.lngLat.lat];
    
    // Remove existing marker if it exists
    if (markers.current[activeMarker]) {
      markers.current[activeMarker].remove();
    }
    
    // Create new marker at clicked location
    const marker = new maplibregl.Marker({
      color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
      draggable: true
    })
      .setLngLat(coordinates)
      .addTo(map.current);
    
    // Store marker reference
    markers.current[activeMarker] = marker;
    
    // Update marker position on drag end
    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      if (onLocationSelect) {
        onLocationSelect(activeMarker, [lngLat.lng, lngLat.lat]);
      }
    });
    
    // Trigger location select
    if (onLocationSelect) {
      onLocationSelect(activeMarker, coordinates);
    }
  }, [activeMarker, onLocationSelect]);

  // Initialize map and geocoder
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: [78.9629, 20.5937],
      zoom: 4
    });

    // Add navigation control
    mapInstance.addControl(new maplibregl.NavigationControl());

    // Handle map load
    mapInstance.on('load', () => {
      // Set map instance on window for debugging
      window.map = mapInstance;
      
      // Initialize geocoder
      const geocoderOptions = {
        placeholder: `Search for a location in ${city || 'India'}`,
        bbox: city ? undefined : [68.1766, 8.0768, 97.4024, 37.0902],
        filter: city ? (item) => {
          const displayName = item.properties.display_name?.toLowerCase() || '';
          return displayName.includes(city.toLowerCase());
        } : undefined,
        forwardGeocode: async (query) => {
          try {
            const request = `${API_BASE}/api/nominatim/search?q=${encodeURIComponent(query + (city ? `, ${city}` : ''))}`;
            const response = await fetch(request);
            const data = await response.json();
            return {
              features: (data.suggestions || data || []).map(feature => ({
                type: 'Feature',
                properties: { label: feature.display_name, id: feature.place_id || feature.osm_id },
                geometry: {
                  type: 'Point',
                  coordinates: [parseFloat(feature.lon), parseFloat(feature.lat)]
                }
              }))
            };
          } catch (error) {
            console.error('Geocoding error:', error);
            return { features: [] };
          }
        }
      };

      // Create geocoder instance
      const geocoderInstance = new MaplibreGeocoder({
        ...geocoderOptions,
        maplibregl: maplibregl,
        marker: false, // We'll handle markers manually
        showResultMarkers: false
      });
      
      // Add geocoder to map
      mapInstance.addControl(geocoderInstance, 'top-left');
      
      // Handle geocoder results
      geocoderInstance.on('result', handleGeocoderResult);
      
      // Store geocoder reference
      geocoder.current = geocoderInstance;
      
      // Add click handler for map
      mapInstance.on('click', handleMapClick);
      
      // Set map as initialized
      setMapInitialized(true);
    });

    // Store map instance
    map.current = mapInstance;

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      
      // Cleanup markers
      Object.values(markers.current).forEach(marker => {
        if (marker) marker.remove();
      });
      
      // Cleanup geocoder
      if (geocoder.current) {
        geocoder.current = null;
      }
    };
  }, [city, handleGeocoderResult, handleMapClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Marker type selector */}
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-md z-10">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveMarker('pickup')}
            className={`px-3 py-1 rounded-md ${
              activeMarker === 'pickup' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Pickup
          </button>
          <button
            onClick={() => setActiveMarker('drop')}
            className={`px-3 py-1 rounded-md ${
              activeMarker === 'drop' 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Drop
          </button>
        </div>
      </div>
      
      {/* Active marker indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md z-10">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-4 h-4 rounded-full ${
              activeMarker === 'pickup' ? 'bg-blue-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium">
            {activeMarker === 'pickup' ? 'Pickup' : 'Drop'} Location
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
