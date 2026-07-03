import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const DriverTrackingMap = ({ driverLocation, customerLocation, pickupLocation, dropoffLocation }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markers = useRef({});
  const directionsRenderer = useRef(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
          version: "weekly",
          libraries: ["places", "geometry"]
        });

        const google = await loader.load();
        
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 28.6139, lng: 77.2090 }, // Default to Delhi
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
        
        mapInstance.current = map;
        
        // Initialize directions renderer
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeOpacity: 0.8,
            strokeWeight: 5
          }
        });

        return google;
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    initMap();
    
    return () => {
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;

    const google = window.google;
    const map = mapInstance.current;
    
    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.setMap(null));
    markers.current = {};

    // Add driver marker
    if (driverLocation) {
      markers.current.driver = new google.maps.Marker({
        position: { lat: driverLocation.lat, lng: driverLocation.lng },
        map: map,
        title: 'Driver',
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          fillColor: "#34D399",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 2,
          scale: 6,
          rotation: driverLocation.heading || 0
        }
      });
    }

    // Add customer marker
    if (customerLocation) {
      markers.current.customer = new google.maps.Marker({
        position: { lat: customerLocation.lat, lng: customerLocation.lng },
        map: map,
        title: 'Customer',
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });
    }

    // Draw route between driver and customer
    if (driverLocation && customerLocation && directionsRenderer.current) {
      const directionsService = new google.maps.DirectionsService();
      
      const request = {
        origin: { lat: driverLocation.lat, lng: driverLocation.lng },
        destination: { lat: customerLocation.lat, lng: customerLocation.lng },
        travelMode: google.maps.TravelMode.DRIVING
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(result);
        }
      });
    }

    // Fit bounds to show all markers
    if (Object.keys(markers.current).length > 0) {
      const bounds = new google.maps.LatLngBounds();
      Object.values(markers.current).forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    }
  }, [driverLocation, customerLocation]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
      style={{ minHeight: '300px' }}
    />
  );
};

export default DriverTrackingMap;