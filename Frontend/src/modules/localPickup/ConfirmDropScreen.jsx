import React, { useEffect, useState } from "react";

export default function ConfirmDropScreen({ location, onConfirm }) {
  const [localLoc, setLocalLoc] = useState({ ...location });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h3 style={{ marginBottom: 10 }}>Confirm Drop Location</h3>

        <p style={{ fontSize: 14, color: "#666" }}>
          Lat: {localLoc.lat?.toFixed(6)} <br />
          Lng: {localLoc.lng?.toFixed(6)}
        </p>

        <button
          onClick={() => onConfirm(localLoc)}
          style={{
            width: "100%",
            padding: 14,
            marginTop: 16,
            borderRadius: 12,
            background: "#000",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Confirm Drop
        </button>
      </div>
    </div>
  );
}