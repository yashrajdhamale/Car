import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const CityMap = ({ onCitySelect, initialPosition, markerPosition, className = '' }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [advancedMarker, setAdvancedMarker] = useState(null);

  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const defaultCenter = initialPosition || { lat: 20.5937, lng: 78.9629 }; // Default to India
    const newMap = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 5,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(newMap);

    // Add click listener to the map
    const clickListener = newMap.addListener('click', async (e) => {
      const { lat, lng } = e.latLng.toJSON();
      await handleLocationSelect(lat, lng);
    });

    return () => {
      window.google.maps.event.removeListener(clickListener);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (marker) {
        marker.setMap(null);
      }
      if (advancedMarker) {
        advancedMarker.map = null;
      }
    };
  }, [marker, advancedMarker]);

  // Update marker when markerPosition changes
  useEffect(() => {
    if (!map || !markerPosition) return;

    // Use AdvancedMarkerElement if available, fallback to Marker
    if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
      if (advancedMarker) {
        advancedMarker.position = markerPosition;
      } else {
        const newMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position: markerPosition,
          map,
          title: 'Selected Location',
        });
        setAdvancedMarker(newMarker);
      }
    } else if (marker) {
      // Fallback to legacy Marker
      marker.setPosition(markerPosition);
    } else {
      const newMarker = new window.google.maps.Marker({
        position: markerPosition,
        map,
        animation: window.google.maps.Animation.DROP,
      });
      setMarker(newMarker);
    }

    // Pan to the marker
    map.panTo(markerPosition);
  }, [markerPosition, map]);

  const handleLocationSelect = async (lat, lng) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results.length > 0) {
        // Find city or administrative area level 1
        const cityResult = response.results.find(result => 
          result.types.some(type => ['locality', 'administrative_area_level_1'].includes(type))
        );

        if (cityResult) {
          const viewport = cityResult.geometry.viewport;
          onCitySelect({
            placeId: cityResult.place_id,
            name: cityResult.formatted_address,
            lat: cityResult.geometry.location.lat(),
            lng: cityResult.geometry.location.lng(),
            bounds: {
              northeast: {
                lat: viewport.getNorthEast().lat(),
                lng: viewport.getNorthEast().lng()
              },
              southwest: {
                lat: viewport.getSouthWest().lat(),
                lng: viewport.getSouthWest().lng()
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error during geocoding:', error);
    }
  };

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-[300px] rounded-lg overflow-hidden border border-gray-300 ${className}`}
    />
  );
};

CityMap.propTypes = {
  onCitySelect: PropTypes.func.isRequired,
  initialPosition: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  markerPosition: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  className: PropTypes.string
};

export default CityMap;
