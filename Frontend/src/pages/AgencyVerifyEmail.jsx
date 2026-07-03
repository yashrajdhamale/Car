import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  auth
} from "../config/firebase";

import {
  resendAgencyEmailVerification,
  refreshAgencyVerificationFlags
} from "../services/agencyAuthService";

export default function AgencyVerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const uid = params.get("uid");

  const checkVerification = async () => {
    try {
      setLoading(true);

      await auth.currentUser.reload();

      if (!auth.currentUser.emailVerified) {
        setMessage("Email not verified yet.");
        return;
      }

      await refreshAgencyVerificationFlags(uid);

      navigate(`/agency-verify-phone?uid=${uid}`);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    try {
      await resendAgencyEmailVerification();
      setMessage("Verification email sent.");
    } catch (err) {
      setMessage(err.message);
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
        padding: "40px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          background: "#e8e9fb",
          margin: "-40px -40px 30px",
          padding: "20px 30px",
          borderRadius: "24px 24px 0 0",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#2d3f92",
            fontWeight: 800,
          }}
        >
          Email Verification
        </h2>
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "60px",
            marginBottom: "20px",
          }}
        >
          📧
        </div>

        <h3
          style={{
            color: "#222",
            marginBottom: "10px",
          }}
        >
          Verify Your Email Address
        </h3>

        <p
          style={{
            color: "#666",
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          We have sent a verification link to your registered email address.
          Please open your inbox and click the verification link before
          continuing.
        </p>

        {message && (
          <div
            style={{
              padding: "12px",
              borderRadius: "10px",
              background: "#eef5ff",
              color: "#2d3f92",
              marginBottom: "20px",
            }}
          >
            {message}
          </div>
        )}

        <button
          onClick={checkVerification}
          disabled={loading}
          style={{
            width: "100%",
            height: "56px",
            border: "none",
            borderRadius: "16px",
            background:
              "linear-gradient(180deg,#4056be 0%,#2a3b90 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "15px",
          }}
        >
          {loading
            ? "Checking Verification..."
            : "I've Verified My Email"}
        </button>

        <button
          onClick={resendEmail}
          style={{
            width: "100%",
            height: "52px",
            borderRadius: "16px",
            border: "1px solid #bfc8f0",
            background: "#fff",
            color: "#314395",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Resend Verification Email
        </button>
      </div>
    </div>
  </div>
);
}