import React, { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';

// Helper function to get city bounding box
const getBoundingBox = (city) => {
  const cityBounds = {
    'Pune': [73.7929, 18.4136, 73.9678, 18.6358],
    'Mumbai': [72.7759, 18.9068, 72.9954, 19.2710],
    'Delhi': [77.0689, 28.4024, 77.3425, 28.6448],
    'Bangalore': [77.4660, 12.8648, 77.7238, 13.1126],
    'Hyderabad': [78.3626, 17.2666, 78.5749, 17.5407],
    'Chennai': [80.1398, 12.9081, 80.3045, 13.1729],
    'Kolkata': [88.2235, 22.4578, 88.4502, 22.6509],
    'Jaipur': [75.6505, 26.7637, 75.9358, 27.0238],
    'Ahmedabad': [72.4555, 22.9089, 72.6939, 23.1656],
    'Goa': [73.7008, 15.1443, 74.2599, 15.8055]
  };
  return cityBounds[city] || [68.1766, 8.0768, 97.4024, 37.0902]; // Default to India bounds
};

const LocationPicker = ({ onLocationSelect, city }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({
    pickup: null,
    drop: null
  });
  const [activeMarker, setActiveMarker] = useState('pickup');
  const geocoder = useRef(null);

  // Update map center when city changes
  useEffect(() => {
    if (!map.current || !city) return;

    const cityCenters = {
      'Pune': [73.8567, 18.5204],
      'Mumbai': [72.8777, 19.0760],
      'Delhi': [77.1025, 28.7041],
      'Bangalore': [77.5946, 12.9716],
      'Hyderabad': [78.4867, 17.3850],
      'Chennai': [80.2707, 13.0827],
      'Kolkata': [88.3639, 22.5726],
      'Jaipur': [75.7873, 26.9124],
      'Ahmedabad': [72.5714, 23.0225],
      'Goa': [74.1240, 15.2993]
    };

    const cityCenter = cityCenters[city];
    if (cityCenter) {
      map.current.flyTo({
        center: cityCenter,
        zoom: 12,
        essential: true
      });
    }
  }, [city]);

  // Fit map to show all markers
  const fitMapToMarkers = useCallback(() => {
    if (!map.current) return;
    
    const markerLngLats = Object.values(markers.current)
      .filter(marker => marker !== null)
      .map(marker => marker.getLngLat());
    
    if (markerLngLats.length === 0) return;
    
    const bounds = new maplibregl.LngLatBounds();
    markerLngLats.forEach(lngLat => bounds.extend(lngLat));
    
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15
    });
  }, []);

  // Initialize map and geocoder
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Initialize map
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: [78.9629, 20.5937], // Center on India
      zoom: 4
    });

    map.current = mapInstance;

    // Add navigation control
    mapInstance.addControl(new maplibregl.NavigationControl());

    // Initialize geocoder
    const geocoderInstance = new MaplibreGeocoder({
      maplibregl: maplibregl,
      marker: false,
      showResultMarkers: false,
      placeholder: `Search in ${city || 'India'}`,
      bbox: getBoundingBox(city),
      countries: 'in'
    });

    // Add geocoder to map
    mapInstance.addControl(geocoderInstance, 'top-left');
    geocoder.current = geocoderInstance;

    // Handle map click
    const handleMapClick = (e) => {
      const coords = [e.lngLat.lng, e.lngLat.lat];
      
      // Remove existing marker if it exists
      if (markers.current[activeMarker]) {
        markers.current[activeMarker].remove();
      }

      // Add new marker
      const marker = new maplibregl.Marker({
        color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
        draggable: true
      })
        .setLngLat(coords)
        .addTo(mapInstance);

      // Update marker reference
      markers.current[activeMarker] = marker;

      // Notify parent component
      onLocationSelect(activeMarker, 'Custom Location', coords);

      // Fit map to show all markers
      fitMapToMarkers();
    };

    // Handle geocoder result
    const handleGeocoderResult = (e) => {
      const { result } = e;
      const { geometry, properties } = result;
      const { coordinates } = geometry;
      
      // Remove existing marker if it exists
      if (markers.current[activeMarker]) {
        markers.current[activeMarker].remove();
      }

      // Add new marker
      const marker = new maplibregl.Marker({
        color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
        draggable: true
      })
        .setLngLat(coordinates)
        .addTo(mapInstance);

      // Update marker reference
      markers.current[activeMarker] = marker;

      // Notify parent component
      onLocationSelect(activeMarker, properties.label || 'Selected Location', coordinates);

      // Fit map to show all markers
      fitMapToMarkers();
    };

    // Add event listeners
    mapInstance.on('click', handleMapClick);
    geocoderInstance.on('result', handleGeocoderResult);

    // Cleanup function
    return () => {
      // Remove event listeners
      if (mapInstance) {
        mapInstance.off('click', handleMapClick);
      }
      
      if (geocoderInstance) {
        geocoderInstance.off('result', handleGeocoderResult);
      }
      
      // Remove markers
      if (markers.current.pickup) {
        markers.current.pickup.remove();
        markers.current.pickup = null;
      }
      if (markers.current.drop) {
        markers.current.drop.remove();
        markers.current.drop = null;
      }
      
      // Remove map
      if (mapInstance && mapInstance.remove) {
        mapInstance.remove();
      }
      
      map.current = null;
    };
  }, [activeMarker, city, fitMapToMarkers, onLocationSelect]);

  // Update geocoder placeholder when city changes
  useEffect(() => {
    if (geocoder.current) {
      geocoder.current.setPlaceholder(`Search in ${city || 'India'}`);
      geocoder.current.setBbox(getBoundingBox(city));
    }
  }, [city]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setActiveMarker('pickup')}
          className={`px-4 py-2 rounded-md ${
            activeMarker === 'pickup' 
              ? 'bg-blue-100 text-blue-700 border-blue-300' 
              : 'bg-gray-100 text-gray-700 border-gray-200'
          } border`}
        >
          Set Pickup
        </button>
        <button
          type="button"
          onClick={() => setActiveMarker('drop')}
          className={`px-4 py-2 rounded-md ${
            activeMarker === 'drop' 
              ? 'bg-red-100 text-red-700 border-red-300' 
              : 'bg-gray-100 text-gray-700 border-gray-200'
          } border`}
        >
          Set Drop-off
        </button>
      </div>
      
      <div className="relative h-96 w-full rounded-lg overflow-hidden border border-gray-200">
        <div ref={mapContainer} className="h-full w-full" />
      </div>
      
      {!city && (
        <div className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded-md">
          Select a city to improve location accuracy
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
