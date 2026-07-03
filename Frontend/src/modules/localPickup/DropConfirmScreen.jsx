import React, { useEffect, useRef, useState } from "react";

export default function DropConfirmScreen({ 
  location, 
  pickupLocation, 
  onConfirm, 
  onBack 
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const initializedRef = useRef(false);

  // Local copy of location
  const [localLoc, setLocalLoc] = useState(() => {
    // If we have coords from dropDraft, use them, otherwise use pickup location
    if (location.lat && location.lng) {
      return { ...location };
    }
    return { 
      ...location,
      lat: pickupLocation?.lat || 19.0760,  // Default to Mumbai if no pickup location
      lng: pickupLocation?.lng || 72.8777
    };
  });

  // Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);

  // Initialize map
  useEffect(() => {
    if (initializedRef.current) return;
    if (!window.MapmyIndia || !window.L) return;
    if (!mapRef.current) return;

    initializedRef.current = true;

    const map = new window.MapmyIndia.Map(mapRef.current, {
      center: [localLoc.lat, localLoc.lng],
      zoom: 16,
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = window.L.marker(
      [localLoc.lat, localLoc.lng],
      { 
        draggable: true,
        icon: window.L.icon({
          iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }
    ).addTo(map);

    markerRef.current = marker;

    // Handle marker drag
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLocalLoc(prev => ({
        ...prev,
        lat: pos.lat,
        lng: pos.lng,
        eLoc: undefined, // Will trigger reverse geocode
      }));
    });
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
      }}
    >
      {/* Map container */}
      <div
        ref={mapRef}
        id="confirm-drop-map"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "auto", // Allow user interaction
        }}
      />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 100,
          background: "white",
          border: "none",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      >
        ←
      </button>

      {/* Confirm button */}
      <div
        style={{
          position: "fixed",
          left: 16,
          right: 16,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
          zIndex: 100,
          pointerEvents: "auto",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => onConfirm(localLoc)}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 12,
            background: "#000",
            color: "#fff",
            fontSize: "1rem",
            fontWeight: 500,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Confirm drop location
        </button>
      </div>
    </div>
  );
}
