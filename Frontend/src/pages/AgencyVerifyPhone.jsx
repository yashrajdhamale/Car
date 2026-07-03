import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAgencyProfile,
  sendAgencyPhoneOtp,
  verifyAgencyPhoneOtp,
} from "../services/agencyAuthService";

export default function AgencyVerifyPhone() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid");

  const [profile, setProfile] = useState(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        if (!uid) return;

        const data = await getAgencyProfile(uid);
        setProfile(data);
      } catch (err) {
        setError("Unable to load agency profile.");
      }
    };

    init();
  }, [uid]);

  const handleSendOtp = async () => {
    try {
      setError("");
      setMessage("");
      setLoading(true);

      await sendAgencyPhoneOtp(profile.phone);

      setMessage("OTP sent successfully to your registered mobile number.");
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setError("");
      setMessage("");
      setLoading(true);

      await verifyAgencyPhoneOtp(uid, otp);

      setMessage(
        "Registration completed successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(90deg,#40159b 0,#5d33b0 6%,transparent 6%,transparent 94%,#b589e2 94%,#9168d9 100%), #fafafa",
        padding: "120px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "700px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            background: "#e8e9fb",
            padding: "20px 30px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#2d3f92",
              fontWeight: 800,
            }}
          >
            Phone Verification
          </h2>
        </div>

        <div
          style={{
            padding: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "60px",
              marginBottom: "20px",
            }}
          >
            📱
          </div>

          <h3
            style={{
              marginTop: 0,
              color: "#222",
            }}
          >
            Verify Your Mobile Number
          </h3>

          <p
            style={{
              color: "#666",
              lineHeight: 1.6,
              marginBottom: "30px",
            }}
          >
            Step 2 of 2
            <br />
            Enter the OTP sent to your registered mobile number.
          </p>

          {profile && (
            <div
              style={{
                background: "#f8f9ff",
                border: "1px solid #e5e7ff",
                borderRadius: "14px",
                padding: "16px",
                marginBottom: "25px",
                color: "#2d3f92",
                fontWeight: 600,
              }}
            >
              Mobile Number: {profile.phone}
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#eaf8ef",
                color: "#167c45",
                marginBottom: "20px",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#fff1f3",
                color: "#cf334d",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <div id="recaptcha-container" />

          <button
            onClick={handleSendOtp}
            disabled={loading}
            style={{
              width: "100%",
              height: "56px",
              border: "none",
              borderRadius: "16px",
              background:
                "linear-gradient(180deg,#4056be 0%,#2a3b90 100%)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{
              width: "100%",
              height: "56px",
              border: "1px solid #e6e7ec",
              borderRadius: "16px",
              padding: "0 18px",
              fontSize: "16px",
              marginBottom: "20px",
              outline: "none",
            }}
          />

          <button
            onClick={handleVerifyOtp}
            disabled={loading || !otp}
            style={{
              width: "100%",
              height: "56px",
              border: "none",
              borderRadius: "16px",
              background:
                "linear-gradient(180deg,#4056be 0%,#2a3b90 100%)",
              color: "#fff",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </div>
    </div>
  );
}