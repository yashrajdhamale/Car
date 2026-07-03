import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
import './LocationPicker.css';

// Make maplibregl available globally for geocoder
if (typeof window !== 'undefined' && !window.maplibregl) {
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
  const [pickupInput, setPickupInput] = useState('');
  const [dropInput, setDropInput] = useState('');
  const geocoder = useRef(null);
  // Update map center when city changes
  useEffect(() => {
    if (!map.current || !city) return;

    // In a real app, you would geocode the city name to get its coordinates
    // For now, we'll use a simple mapping of Indian cities
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

  // Handle map click
  const handleMapClick = useCallback((e) => {
    if (!map.current) return;
    
    const coords = [e.lngLat.lng, e.lngLat.lat];
    
    // Reverse geocode to get address
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[1]}&lon=${coords[0]}&zoom=18&addressdetails=1`;
    
    fetch(url, {
      headers: {
        'User-Agent': 'CarziHolidays/1.0 (your@email.com)'
      }
    })
    .then(response => response.json())
    .then(data => {
      const address = data.display_name || 'Selected Location';
      
      // Remove existing marker if it exists
      if (markers.current[activeMarker]) {
        markers.current[activeMarker].remove();
      }

      // Add new marker using the global maplibregl instance
      const marker = new window.maplibregl.Marker({
        color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
        draggable: true
      })
        .setLngLat(coords)
        .addTo(map.current);

      // Update marker reference
      markers.current[activeMarker] = marker;

      // Notify parent component with address and coordinates
      onLocationSelect(activeMarker, address, coords);

      // Fit map to show both markers if they exist
      fitMapToMarkers();
      
      // Update the input field if it exists
      const inputField = document.querySelector(`input[data-type="${activeMarker}"]`);
      if (inputField) {
        inputField.value = address;
      }
    })
    .catch(error => {
      console.error('Error reverse geocoding:', error);
      
      // Fallback to just coordinates if reverse geocoding fails
      if (markers.current[activeMarker]) {
        markers.current[activeMarker].remove();
      }
      
      const marker = new window.maplibregl.Marker({
        color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
        draggable: true
      })
        .setLngLat(coords)
        .addTo(map.current);
        
      markers.current[activeMarker] = marker;
      onLocationSelect(activeMarker, `Location at ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`, coords);
      
      const inputField = document.querySelector(`input[data-type="${activeMarker}"]`);
      if (inputField) {
        inputField.value = `Location at ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
      }
    });
  }, [activeMarker, onLocationSelect, fitMapToMarkers]);

  // Handle geocoder result selection
  const handleGeocoderResult = useCallback((e) => {
    if (!map.current) return;
    
    const { result } = e;
    const { geometry, properties } = result;
    const { coordinates } = geometry;
    
    // Remove existing marker if it exists
    if (markers.current[activeMarker]) {
      markers.current[activeMarker].remove();
    }

    // Add new marker using the global maplibregl instance
    const marker = new window.maplibregl.Marker({
      color: activeMarker === 'pickup' ? '#3b82f6' : '#ef4444',
      draggable: true
    })
      .setLngLat(coordinates)
      .addTo(map.current);

    // Update marker reference
    markers.current[activeMarker] = marker;

    // Notify parent component
    onLocationSelect(activeMarker, properties.label, coordinates);

    // Fit map to show both markers if they exist
    fitMapToMarkers();
  }, [activeMarker, onLocationSelect, fitMapToMarkers]);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Initialize map
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.stadiamaps.com/styles/osm_bright.json',
      center: [78.9629, 20.5937], // Center on India
      zoom: 4,
      attributionControl: false // We'll add this later with custom attribution
    });
    
    // Add attribution control
    mapInstance.addControl(new maplibregl.AttributionControl({
      customAttribution: ' OpenStreetMap contributors,  Stadia Maps'
    }));

    // Store map instance
    map.current = mapInstance;
    
    // Make maplibregl available globally for geocoder
    if (typeof window !== 'undefined' && !window.maplibregl) {
      window.maplibregl = maplibregl;
    }

    // Handle map load
    const onMapLoad = () => {
      // Set map instance on window for debugging
      window.map = mapInstance;
      
      // Suppress missing icon warnings
      mapInstance.on('styleimagemissing', (e) => {
        const { id } = e;
        if (!mapInstance.hasImage(id)) {
          const size = 1;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const context = canvas.getContext('2d');
          // Add any canvas drawing logic here if needed
        }
      });
      
      geocoder.current = geocoderInstance;
    }

    // Add navigation control
    mapInstance.addControl(new maplibregl.NavigationControl());

    // Geocoder options
    const geocoderOptions = {
      placeholder: `Search for a location in ${city || 'India'}`,
      bbox: city ? undefined : [68.1766, 8.0768, 97.4024, 37.0902],
      filter: city ? (item) => {
        const displayName = item.properties.display_name?.toLowerCase() || '';
        return displayName.includes(city.toLowerCase());
      } : undefined,
      forwardGeocode: async (query) => {
        try {
          const request = `https://nominatim.openstreetmap.org/search?q=${
            encodeURIComponent(query + (city ? `, ${city}` : ''))
          }&format=json&limit=5`;
          
          const response = await fetch(request, {
            headers: {
              'User-Agent': 'CarziHolidays/1.0 (your@email.com)'
            }
          });
          
          const data = await response.json();
          return {
            features: data.map(feature => ({
              type: 'Feature',
              properties: { label: feature.display_name, id: feature.place_id },
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

    // Add map click handler
    const clickHandler = (e) => handleMapClick(e);
    mapInstance.on('click', clickHandler);

    // Store cleanup handlers
    const cleanup = () => {
      // Remove event listeners
      mapInstance.off('click', clickHandler);
      
      // Remove geocoder
      if (geocoderInstance && mapInstance.hasControl(geocoderInstance)) {
        mapInstance.removeControl(geocoderInstance);
        geocoder.current = null;
      }
      
      // Remove markers
      Object.values(markers.current).forEach(marker => {
        try {
          if (marker?.remove) marker.remove();
        } catch (e) {
          console.error('Error removing marker:', e);
        }
      });
      markers.current = {};
    };

    return cleanup;
  }, [handleMapClick, handleGeocoderResult, onLocationSelect, fitMapToMarkers, onMapLoad]);

  // Set up map load handler
  mapInstance.on('load', onMapLoad);

  // Main cleanup function
  return () => {
    // Remove all event listeners
    mapInstance.off();
    
    // Clean up geocoder
    if (geocoder.current) {
      try {
        if (mapInstance.hasControl(geocoder.current)) {
          mapInstance.removeControl(geocoder.current);
        }
      } catch (e) {
        console.error('Error removing geocoder:', e);
      }
      geocoder.current = null;
    }
    
    // Remove markers
    Object.values(markers.current).forEach(marker => {
      try {
        if (marker?.remove) marker.remove();
      } catch (e) {
        console.error('Error removing marker:', e);
      }
    });
    markers.current = {};
    
    // Remove map
    try {
      if (mapInstance.getContainer()?.parentNode) {
        mapInstance.remove();
      }
    } catch (e) {
      console.error('Error removing map:', e);
    }
    
    map.current = null;
  };
}, [city, handleMapClick, handleGeocoderResult, fitMapToMarkers, onMapLoad]);

  // Update geocoder placeholder and search functionality when city changes
  useEffect(() => {
    if (!geocoder.current) return;
    
    // Update placeholder
    geocoder.current.setPlaceholder(`Search for a location in ${city || 'India'}`);
    
    // Update search functionality to filter by city
    if (city) {
      geocoder.current.setFilter((item) => {
        const displayName = item.properties?.display_name?.toLowerCase() || '';
        return displayName.includes(city.toLowerCase());
      });
    } else {
      geocoder.current.setFilter(undefined);
    });
  }, [city]);

  // Handle manual location input
  const handleManualLocation = (type, e) => {
    const value = e.target.value;
    
    // Update the input state
    if (type === 'pickup') {
      setPickupInput(value);
    } else {
      setDropInput(value);
    }
    
    if (e.key !== 'Enter') return;
    
    // If user presses Enter, try to geocode the input
    const query = city ? `${value}, ${city}` : value;
    const request = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    fetch(request, {
      headers: {
        'User-Agent': 'CarziHolidays/1.0 (your@email.com)'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data && data.length > 0) {
        const feature = data[0];
        const coords = [parseFloat(feature.lon), parseFloat(feature.lat)];
        
        // Remove existing marker if it exists
        if (markers.current[type]) {
          markers.current[type].remove();
        }
        
        // Add new marker using the global maplibregl instance
        const marker = new window.maplibregl.Marker({
          color: type === 'pickup' ? '#3b82f6' : '#ef4444',
          draggable: true
        })
          .setLngLat(coords)
          .addTo(map.current);
          
        // Update marker reference
        markers.current[type] = marker;
        
        // Notify parent component
        onLocationSelect(type, feature.display_name, coords);
        
        // Fit map to show both markers if they exist
        fitMapToMarkers();
        
        // Pan to the new location
        map.current.flyTo({
          center: coords,
          zoom: 14,
          essential: true
        });
      } else {
        console.warn('Location not found');
      }
    })
    .catch(error => {
      console.error('Error geocoding location:', error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Pickup Location Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
          <div className="relative">
            <input
              type="text"
              data-type="pickup"
              value={pickupInput}
              onChange={(e) => handleManualLocation('pickup', e)}
              onKeyDown={(e) => handleManualLocation('pickup', e)}
              placeholder="Enter pickup location"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setActiveMarker('pickup')}
                className={`p-1 rounded-full ${
                  activeMarker === 'pickup' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Set pickup location on map"
              >
                📍
              </button>
            </div>
          </div>
        </div>
        
        {/* Drop Location Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Drop-off Location</label>
          <div className="relative">
            <input
              type="text"
              data-type="drop"
              value={dropInput}
              onChange={(e) => handleManualLocation('drop', e)}
              onKeyDown={(e) => handleManualLocation('drop', e)}
              placeholder="Enter drop-off location"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <button
                type="button"
                onClick={() => setActiveMarker('drop')}
                className={`p-1 rounded-full ${
                  activeMarker === 'drop' 
                    ? 'bg-red-100 text-red-700' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Set drop-off location on map"
              >
                📍
              </button>
            </div>
          </div>
        </div>
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
}

export default LocationPicker;
