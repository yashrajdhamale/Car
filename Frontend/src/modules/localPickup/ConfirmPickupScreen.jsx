import React, { useEffect, useRef, useState } from "react";

export default function ConfirmPickupScreen({ location, onConfirm }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const initializedRef = useRef(false);

  // ✅ local copy (never mutate props)
  const [localLoc, setLocalLoc] = useState(() => ({ ...location }));

  // 🔒 Lock background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);

  // 🗺️ Initialize map ONCE
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

    const marker = window.L.marker(
      [localLoc.lat, localLoc.lng],
      { draggable: true }
    ).addTo(map);

    markerRef.current = marker;

    marker.on("dragend", () => {
      const pos = marker.getLatLng();

      // ✅ update LOCAL state only
      setLocalLoc(prev => ({
        ...prev,
        lat: pos.lat,
        lng: pos.lng,
        eLoc: undefined, // force reverse-geocode in parent
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
    {/* 🗺️ MAP — pointer events DISABLED */}
    <div
      ref={mapRef}
      id="confirm-pickup-map"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none", // 🔥 THIS IS THE FIX
      }}
    />

    {/* ✅ BUTTON — pointer events ENABLED */}
    <div
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
        zIndex: 100000,
        pointerEvents: "auto", // 🔥 REQUIRED
        maxWidth: 520,
        margin: "0 auto",
      }}
    >
      <button
        onClick={() => {
          console.log("✅ CONFIRM PICKUP CLICKED", localLoc);
          onConfirm({ ...localLoc });
        }}
        style={{
          width: "100%",
          padding: 16,
          borderRadius: 14,
          background: "#000",
          color: "#fff",
          fontSize: "1.1rem",
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        Confirm pickup location
      </button>
    </div>
  </div>
);

}
