import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
} from "@firebase/auth";
import { ArrowRight, Loader2, Mail, Phone, Wifi, WifiOff } from "lucide-react";

import { auth } from "@config/firebase";
import { useNotification } from "../context/NotificationContext";
import { ScrollToTop } from "@components";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function NewLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();

  const [userType, setUserType] = useState("customer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState("email");

  const isPhoneLogin = loginMethod === "phone";
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleAuth = params.get("googleAuth");
    const customToken = params.get("customToken");

    const completeGoogleLogin = async () => {
      if (googleAuth !== "success" || !customToken) return;
      try {
        setIsGoogleLoading(true);
        const credential = await signInWithCustomToken(auth, customToken);
        params.delete("googleAuth");
        params.delete("customToken");
        const nextUrl = `${window.location.pathname}${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        window.history.replaceState({}, document.title, nextUrl);
        await handleLoginSuccess(credential.user);
      } catch (error) {
        console.error("Error completing backend Google login:", error);
        addNotification(
          "Google login could not be completed. Please try again.",
          "error"
        );
      } finally {
        setIsGoogleLoading(false);
      }
    };

    completeGoogleLogin();
  }, [addNotification]);

  const apiPost = async (path, body) => {
    const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Request failed");
    return data;
  };

  const handleSendOtp = async () => {
    if (!isValidPhone(identifier)) {
      addNotification("Please enter a valid 10-digit phone number", "error");
      return;
    }

    try {
      setIsSendingOtp(true);
      const data = await apiPost("/auth/phone/start", {
        phoneNumber: `+91${identifier}`,
        role: userType,
      });
      setConfirmationResult(data);
      setShowOtpField(true);
      addNotification("OTP sent successfully!", "success");
    } catch (error) {
      console.error("Error sending OTP:", error);
      addNotification(
        error.message || "Failed to send OTP. Please try again.",
        "error"
      );
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      addNotification("Please enter a valid 6-digit OTP", "error");
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiPost("/auth/phone/verify", {
        sessionId: confirmationResult?.sessionId,
        otp,
        role: userType,
      });
      const credential = await signInWithCustomToken(auth, data.customToken);
      await handleLoginSuccess(credential.user);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      addNotification(
        error.message || "Invalid OTP. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const redirectTo = encodeURIComponent(
        location.pathname + location.search
      );
      window.location.href = `${BACKEND_BASE_URL}/api/auth/google/start?redirectTo=${redirectTo}`;
    } catch (error) {
      console.error("Google Sign In Error:", error);
      addNotification(
        "Failed to sign in with Google. Please try again.",
        "error"
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  async function handleLoginSuccess(user) {
    try {
      setIsLoading(true);
      const pendingBooking = localStorage.getItem("pendingHolidayBooking");
      if (pendingBooking) {
        try {
          const bookingData = JSON.parse(pendingBooking);
          localStorage.removeItem("pendingHolidayBooking");
          navigate("/book", {
            state: {
              ...bookingData,
              requiresLogin: false,
            },
            replace: true,
          });
          return;
        } catch (error) {
          console.error("Error processing pending booking:", error);
          localStorage.removeItem("pendingHolidayBooking");
        }
      }

      const from =
        location.state?.from?.pathname || location.state?.from || "/";
      const role = String(userType || "customer")
        .toLowerCase()
        .trim();
      sessionStorage.clear();

      if (role === "driver") {
        addNotification("Login successful!", "success");
        window.location.href = "/driver/dashboard";
        return;
      }

      const redirectPath = ["agency", "travelagency", "travel_agency"].includes(
        role
      )
        ? "/agency-dashboard"
        : from;

      addNotification("Login successful!", "success");
      window.location.href = redirectPath;
    } catch (error) {
      console.error("Error in login success handler:", error);
      addNotification(
        "An error occurred during login. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleForgotPassword = async () => {
    if (!identifier || !isValidEmail(identifier)) {
      addNotification("Please enter your email address", "error");
      return;
    }

    try {
      setIsLoading(true);
      await apiPost("/auth/password-reset", { email: identifier });
      addNotification(
        "Password reset link has been generated. Check your email.",
        "success"
      );
      setShowForgotPassword(false);
      setIdentifier("");
    } catch (error) {
      console.error("Error in password reset:", error);
      addNotification(
        error.message || "An error occurred. Please try again later.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showForgotPassword) {
      await handleForgotPassword();
      return;
    }

    if (showOtpField) {
      await handleVerifyOtp();
      return;
    }

    if (isPhoneLogin) {
      await handleSendOtp();
      return;
    }

    if (!identifier || !password) {
      addNotification("Please fill in all fields", "error");
      return;
    }

    if (!isValidEmail(identifier)) {
      addNotification("Please enter a valid email address", "error");
      return;
    }

    try {
      setIsLoading(true);
      const data = await apiPost("/auth/login", {
        email: identifier,
        password,
        role: userType,
      });
      const credential = await signInWithCustomToken(auth, data.customToken);
      await handleLoginSuccess(credential.user);
    } catch (error) {
      console.error("Login error:", error);
      addNotification(
        error.message || "Login failed. Please try again.",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getSignupText = () => {
    switch (userType) {
      case "driver":
        return "Sign Up as Driver";
      case "travelAgency":
        return "Sign Up as Travel Agency";
      default:
        return "Create an account";
    }
  };

  const getSignupPath = () => {
    switch (userType) {
      case "driver":
        return "/driver-signup";
      case "travelAgency":
        return "/agency-register";
      default:
        return "/register";
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
          minWidth: "100vw",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md space-y-8 py-8 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              {showForgotPassword
                ? "Reset Password"
                : "Sign in to your account"}
            </h2>
            {!showForgotPassword && (
              <p className="mt-2 text-center text-sm text-gray-200">
                Or{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-medium text-blue-400 hover:text-blue-300"
                >
                  create a new account
                </button>
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white bg-opacity-90 py-8 px-4 shadow-xl rounded-lg sm:px-10 backdrop-blur-sm"
          >
            <div
              className={`mb-4 flex items-center justify-end ${
                isOnline ? "text-green-500" : "text-yellow-500"
              }`}
            >
              {isOnline ? (
                <span className="flex items-center">
                  <Wifi className="mr-1 h-4 w-4" /> Online
                </span>
              ) : (
                <span className="flex items-center">
                  <WifiOff className="mr-1 h-4 w-4" /> Offline
                </span>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login As
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["customer", "driver", "travelAgency"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setUserType(type)}
                    className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                      userType === type
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type === "travelAgency"
                      ? "Agency"
                      : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <p className="mb-2 text-sm text-gray-600">
              Enter your email or phone number
            </p>
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Email or phone number"
                autoComplete="username"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  identifier &&
                  !isValidEmail(identifier) &&
                  !isValidPhone(identifier)
                    ? "border-red-300"
                    : "border-gray-300"
                } rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={identifier}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setIdentifier(value.replace(/\D/g, "").slice(0, 10));
                    setLoginMethod("phone");
                  } else {
                    setIdentifier(value);
                    setLoginMethod("email");
                  }
                }}
                disabled={isLoading}
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isValidPhone(identifier) ? (
                  <Phone className="h-5 w-5 text-gray-400" />
                ) : (
                  <Mail className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {identifier &&
              !isValidEmail(identifier) &&
              !isValidPhone(identifier) && (
                <p className="mt-1 text-xs text-red-600">
                  Please enter a valid email or 10-digit phone number
                </p>
              )}
            {isValidPhone(identifier) && (
              <p className="mt-1 text-xs text-gray-500">
                We'll send you an OTP to verify your number
              </p>
            )}

            {!showOtpField &&
              !showForgotPassword &&
              !isValidPhone(identifier) && (
                <input
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              )}

            {!showForgotPassword &&
              isValidPhone(identifier) &&
              !showOtpField && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
              )}

            {showOtpField && (
              <input
                type="text"
                placeholder="Enter OTP"
                className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={isLoading}
              />
            )}

            {!showForgotPassword && !isValidPhone(identifier) ? (
              <div className="mb-4 text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-500 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            ) : (
              showForgotPassword && (
                <div className="mb-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setIdentifier("");
                    }}
                    className="text-sm text-blue-500 hover:underline flex items-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-1 transform rotate-180" />
                    Back to Login
                  </button>
                </div>
              )
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                (isValidPhone(identifier) && showOtpField && !otp) ||
                (!isValidPhone(identifier) &&
                  (!identifier || !isValidEmail(identifier) || !password))
              }
              className="w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {showForgotPassword
                ? isLoading
                  ? "Sending..."
                  : "Send Reset Link"
                : showOtpField
                ? "Verify OTP"
                : isLoading
                ? "Signing in..."
                : "Sign In"}
            </button>

            {userType === "customer" && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                  ) : (
                    <>
                      <img
                        src="https://www.google.com/favicon.ico"
                        alt="Google"
                        className="h-5 w-5 mr-2"
                      />
                      Continue with Google
                    </>
                  )}
                </button>
              </>
            )}

            {!showForgotPassword && (
              <div className="mt-6 text-center text-sm text-gray-600">
                New to our platform?{" "}
                <button
                  type="button"
                  onClick={() => navigate(getSignupPath())}
                  className="font-medium text-green-600 hover:text-green-500"
                >
                  {getSignupText()} <ArrowRight className="inline h-4 w-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default ScrollToTop(NewLogin);
