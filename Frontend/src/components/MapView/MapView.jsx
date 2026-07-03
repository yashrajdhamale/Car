import { forwardRef, useEffect, useImperativeHandle, useRef, useCallback } from "react";
import { initMapmyIndia } from "@/services/mapmyindia";

const MapView = forwardRef(({ pickupLocation, dropLocation }, ref) => {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef({ pickup: null, drop: null });
  const isInitialized = useRef(false);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    flyTo: (latlng, zoom = 15) => {
      if (mapRef.current) {
        mapRef.current.setView(latlng, zoom);
      }
    },
    getMap: () => mapRef.current
  }));

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || isInitialized.current) return;
    
    isInitialized.current = true;
    
    // Ensure the map container has proper dimensions
    mapContainerRef.current.style.width = '100%';
    mapContainerRef.current.style.height = '100%';
    
    initMapmyIndia()
      .then((map) => {
        mapRef.current = map;
      })
      .catch((error) => {
        console.error('Failed to initialize map:', error);
      });

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      isInitialized.current = false;
    };
  }, []);

  // Update pickup & drop markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.MapmyIndia) return;

    // Clear old markers
    if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = null;
    }
    if (markersRef.current.drop) {
      map.removeLayer(markersRef.current.drop);
      markersRef.current.drop = null;
    }

    if (pickupLocation) {
      markersRef.current.pickup = new window.MapmyIndia.Marker({
        position: [pickupLocation.lat, pickupLocation.lng],
        map,
        title: "Pickup",
        icon: "https://maps.mapmyindia.com/images/marker_green.png"
      });

      if (!dropLocation) {
        map.setView([pickupLocation.lat, pickupLocation.lng], 15);
      }
    }

    if (dropLocation) {
      markersRef.current.drop = new window.MapmyIndia.Marker({
        position: [dropLocation.lat, dropLocation.lng],
        map,
        title: "Drop",
        icon: "https://maps.mapmyindia.com/images/marker_red.png"
      });
    }

    // Fit bounds if both locations are set
    if (pickupLocation && dropLocation) {
      const bounds = new window.MapmyIndia.LatLngBounds(
        [pickupLocation.lat, pickupLocation.lng],
        [dropLocation.lat, dropLocation.lng]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickupLocation, dropLocation]);

  // Return the map container with ref
  return (
    <div 
      ref={mapContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '400px' // Ensure minimum height
      }} 
    />
  );
});

MapView.displayName = 'MapView';
export default MapView;
