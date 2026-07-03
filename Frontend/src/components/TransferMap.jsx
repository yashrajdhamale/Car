import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const TransferMap = ({ pickup, dropoff, onMapLoad, onRouteInfo }) => {
  const mapRef = useRef(null);
  const directionsRenderer = useRef(null);
  const markers = useRef({ pickup: null, dropoff: null });
  const infoWindows = useRef({ pickup: null, dropoff: null });
  const directionsService = useRef(null);

  // Create custom marker icons
  const markerIcons = {
    pickup: {
      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      scaledSize: new window.google.maps.Size(40, 40),
      origin: new window.google.maps.Point(0, 0),
      anchor: new window.google.maps.Point(20, 40)
    },
    dropoff: {
      url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: new window.google.maps.Size(40, 40),
      origin: new window.google.maps.Point(0, 0),
      anchor: new window.google.maps.Point(20, 40)
    }
  };

  // Update markers when pickup/dropoff changes
  useEffect(() => {
    if (!window.google?.maps) return;

    const updateMarker = (type, position, title) => {
      // Remove existing marker
      if (markers.current[type]) {
        markers.current[type].setMap(null);
      }

      // Create new marker if position is valid
      if (position?.lat && position?.lng) {
        markers.current[type] = new window.google.maps.Marker({
          position,
          map: mapRef.current ? window.google.maps.Map.getInstance(mapRef.current) : null,
          title,
          icon: markerIcons[type],
          animation: window.google.maps.Animation.DROP
        });

        // Create info window
        if (!infoWindows.current[type]) {
          infoWindows.current[type] = new window.google.maps.InfoWindow({
            content: `<div class="p-2"><strong>${type.toUpperCase()}</strong><br>${title || 'Location'}</div>`,
            disableAutoPan: true
          });
        }

        // Add click listener to show info window
        markers.current[type].addListener('click', () => {
          infoWindows.current[type].open({
            anchor: markers.current[type],
            map: window.google.maps.Map.getInstance(mapRef.current)
          });
        });
      }
    };

    updateMarker('pickup', pickup, pickup?.address || 'Pickup Location');
    updateMarker('dropoff', dropoff, dropoff?.address || 'Dropoff Location');
  }, [pickup, dropoff]);

  // Initialize map and directions
  useEffect(() => {
    if (!window.google?.maps || !mapRef.current) return;

    // Initialize map with better defaults
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      mapTypeControlOptions: {
        style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: window.google.maps.ControlPosition.TOP_RIGHT
      },
      zoomControl: true,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER
      },
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Initialize directions service
    directionsService.current = new window.google.maps.DirectionsService();

    // Initialize directions renderer
    directionsRenderer.current = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true, // We'll use custom markers
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 5,
        strokeOpacity: 0.8
      },
      suppressInfoWindows: true
    });
    directionsRenderer.current.setMap(map);

    if (onMapLoad) {
      onMapLoad(map);
    }

    // Fit bounds to show both markers
    const bounds = new window.google.maps.LatLngBounds();
    if (pickup?.lat && pickup?.lng) bounds.extend(pickup);
    if (dropoff?.lat && dropoff?.lng) bounds.extend(dropoff);
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
      // Add padding and max zoom level
      map.panToBounds(bounds);
      const zoom = map.getZoom();
      if (zoom > 15) map.setZoom(15);
    }

    return () => {
      if (directionsRenderer.current) {
        directionsRenderer.current.setMap(null);
      }
      Object.values(markers.current).forEach(marker => {
        if (marker) marker.setMap(null);
      });
    };
  }, []);

  // Update route when pickup or dropoff changes
  useEffect(() => {
    if (!directionsRenderer.current || !pickup?.lat || !dropoff?.lat || !directionsService.current) return;

    directionsService.current.route(
      {
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.current.setDirections(response);
          
          // Extract and pass route information to parent
          const route = response.routes[0];
          if (route?.legs[0]) {
            const distance = route.legs[0].distance;
            const duration = route.legs[0].duration;
            
            if (onRouteInfo) {
              onRouteInfo({
                distance: distance.text,
                distanceMeters: distance.value,
                duration: duration.text,
                durationSeconds: duration.value,
                startAddress: route.legs[0].start_address,
                endAddress: route.legs[0].end_address
              });
            }
          }
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }, [pickup, dropoff, onRouteInfo]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
      className="rounded-lg shadow-lg"
    />
  );
};

TransferMap.propTypes = {
  pickup: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
    address: PropTypes.string
  }),
  dropoff: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
    address: PropTypes.string
  }),
  onMapLoad: PropTypes.func,
  onRouteInfo: PropTypes.func
};

TransferMap.defaultProps = {
  pickup: {},
  dropoff: {},
  onMapLoad: () => {},
  onRouteInfo: () => {}
};

export default TransferMap;
