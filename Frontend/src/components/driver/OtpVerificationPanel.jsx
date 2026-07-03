// OtpVerificationPanel.jsx
// Drop this into src/components/driver/
//
// Usage in DriverDashboard — replace the "Start Ride" button with:
//   <OtpVerificationPanel ride={ride} driverId={user.uid} onVerified={() => { /* ride is now in_progress */ }} />

import { useState, useRef } from "react";
import { toast } from "react-toastify";

const CLOUD_FN_BASE = "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net";

/**
 * Maps the ride's `type` field to the rideType expected by the OTP Cloud Function.
 * Supports all 4 modules.
 */
function resolveRideType(ride) {
  const t = ride?.type || ride?.tripType || "";
  if (t === "airport")     return "airport";
  if (t === "holiday")     return "holiday";
  if (t === "localPickup") return "localPickup";
  return "outstation"; // default covers outstation + any unknown
}

/**
 * Resolves the booking document ID for a given ride.
 * For outstation, the booking ID might live under ride.bookingId or ride.id.
 * For airport, the ride itself IS the top-level document.
 */
function resolveBookingId(ride) {
  return ride?.bookingId || ride?.id;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function OtpVerificationPanel({ ride, driverId, onVerified }) {
  const [digits, setDigits]       = useState(["", "", "", "", "", ""]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs                 = useRef([]);

  const otp = digits.join("");

  // ── Focus management: auto-advance on digit input ──────────────────────────
  const handleDigitChange = (idx, val) => {
    const cleaned = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    setError("");

    if (cleaned && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (!digits[idx] && idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "Enter" && otp.length === 6) {
      handleVerify();
    }
  };

  // Handle paste — fills all 6 boxes at once
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = pasted.split("").concat(Array(6).fill("")).slice(0, 6);
    setDigits(next);
    setError("");
    // Focus the last filled box
    const lastIdx = Math.min(pasted.length, 5);
    setTimeout(() => inputRefs.current[lastIdx]?.focus(), 0);
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const bookingId = resolveBookingId(ride);
      const rideType  = resolveRideType(ride);

      const res  = await fetch(`${CLOUD_FN_BASE}/verifyRideOtp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rideType, otp, driverId }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success("✅ OTP Verified! Ride has started.");
        if (onVerified) onVerified();
      } else {
        setError(data.message || "Incorrect OTP. Please try again.");
        // Shake the inputs
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      const bookingId   = resolveBookingId(ride);
      const rideType    = resolveRideType(ride);

      const res  = await fetch(`${CLOUD_FN_BASE}/generateRideOtp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          rideType,
          driverName:    ride.driverName   || "",
          driverPhone:   ride.driverPhone  || "",
          vehicleType:   ride.vehicleType  || ride.car?.name || "",
          vehicleNumber: ride.vehicleNumber || "",
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.info("📧 A new OTP has been sent to the customer's email.");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 50);
      } else {
        setError(data.error || data.warning || "Failed to resend OTP.");
      }
    } catch (err) {
      setError("Failed to resend OTP. Check your connection.");
    } finally {
      setResending(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div style={{
        background: "linear-gradient(135deg, #1b5e20, #2e7d32)",
        borderRadius: 14, padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: "0 4px 16px rgba(30,100,30,0.25)"
      }}>
        <div style={{
          width: 44, height: 44, background: "rgba(255,255,255,0.2)",
          borderRadius: "50%", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 22, flexShrink: 0
        }}>✅</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>OTP Verified — Ride Started!</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 }}>
            The ride is now in progress.
          </div>
        </div>
      </div>
    );
  }

  // ── Main OTP input UI ──────────────────────────────────────────────────────
  return (
    <div style={{
      background: "#fff",
      border: "2px solid #302b63",
      borderRadius: 16,
      padding: "20px 20px 18px",
      marginTop: 12,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginBottom: 6
        }}>
          <div style={{
            width: 36, height: 36, background: "linear-gradient(135deg, #302b63, #4a3fa0)",
            borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18, flexShrink: 0
          }}>🔒</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
              Enter Ride OTP
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              Ask the customer for the 6-digit OTP sent to their email
            </div>
          </div>
        </div>
      </div>

      {/* 6-digit input boxes */}
      <div
        style={{
          display: "flex", gap: 8, justifyContent: "center",
          marginBottom: error ? 10 : 16
        }}
        onPaste={handlePaste}
      >
        {digits.map((d, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            style={{
              width: 44, height: 52,
              textAlign: "center",
              fontSize: 22, fontWeight: 700,
              border: `2px solid ${error ? "#e53e3e" : d ? "#302b63" : "#ddd"}`,
              borderRadius: 10,
              background: d ? "#f0f0ff" : "#fafafa",
              color: "#1a1a2e",
              outline: "none",
              transition: "border-color 0.15s, background 0.15s",
              fontFamily: "'Courier New', monospace",
              cursor: "text",
            }}
            disabled={loading}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5",
          borderRadius: 8, padding: "8px 12px",
          fontSize: 13, color: "#b91c1c", fontWeight: 600,
          marginBottom: 12, display: "flex", alignItems: "center", gap: 6
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading || otp.length !== 6}
        style={{
          width: "100%", padding: "12px 0",
          background: loading || otp.length !== 6
            ? "#eee"
            : "linear-gradient(135deg, #302b63, #4a3fa0)",
          color: loading || otp.length !== 6 ? "#aaa" : "#fff",
          border: "none", borderRadius: 10,
          fontWeight: 700, fontSize: 15,
          cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
          transition: "all 0.2s",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontFamily: "inherit",
        }}
      >
        {loading ? (
          <>
            <div style={{
              width: 16, height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            Verifying…
          </>
        ) : (
          "🚀 Verify & Start Ride"
        )}
      </button>

      {/* Resend OTP */}
      <div style={{ textAlign: "center", marginTop: 12 }}>
        <button
          onClick={handleResend}
          disabled={resending}
          style={{
            background: "none", border: "none",
            color: resending ? "#aaa" : "#302b63",
            fontSize: 13, fontWeight: 600,
            cursor: resending ? "not-allowed" : "pointer",
            textDecoration: "underline", fontFamily: "inherit",
          }}
        >
          {resending ? "Sending new OTP…" : "📧 Resend OTP to customer"}
        </button>
      </div>

      {/* Spin keyframe — injected inline since we can't guarantee global CSS */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}