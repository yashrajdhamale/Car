// holiday book page 
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import PropTypes from "prop-types";
import BgCar from "../assets/images/BgCar.jpg";
import PaymentQR from "../assets/images/Qrpayment.jpg";
import { formatVehicleInfo, formatPackageInfo, formatPrice } from "../utils/formatUtils";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const apiRequest = async (path, { method = "GET", body } = {}) => {
  const currentUser = auth.currentUser;
  const idToken = currentUser ? await currentUser.getIdToken() : null;

  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || data?.error || "Request failed");
  }

  return data;
};

const getStateFromPackage = (pkg) => {
  if (!pkg) return "";
  if (pkg.state)           return String(pkg.state).trim();
  if (pkg.location?.state) return String(pkg.location.state).trim();
  const name = (pkg.name || "").toLowerCase();
  if (name.includes("kerala") || name.includes("munnar") || name.includes("wayanad"))   return "Kerala";
  if (name.includes("goa"))                                                              return "Goa";
  if (name.includes("rajasthan") || name.includes("jaipur") || name.includes("udaipur") || name.includes("jodhpur")) return "Rajasthan";
  if (name.includes("gujarat") || name.includes("surat") || name.includes("ahmedabad")) return "Gujarat";
  if (name.includes("ooty") || name.includes("tamil"))                                  return "Tamil Nadu";
  if (name.includes("coorg") || name.includes("karnataka"))                             return "Karnataka";
  if (name.includes("kashmir") || name.includes("srinagar"))                            return "Kashmir";
  if (name.includes("himachal") || name.includes("manali") || name.includes("shimla"))  return "Himachal Pradesh";
  if (name.includes("uttarakhand") || name.includes("nainital") || name.includes("rishikesh")) return "Uttarakhand";
  if (name.includes("maharashtra") || name.includes("pune") || name.includes("mumbai")) return "Maharashtra";
  return pkg.location || pkg.destination || "";
};

export default function Holidaybookpage() {
  const location = useLocation();
  const navigate  = useNavigate();

  const [user,        setUser]        = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [name,        setName]        = useState("");
  const [phone,       setPhone]       = useState("");
  const [date,        setDate]        = useState("");
  const [agree,       setAgree]       = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [bookingStatus,    setBookingStatus]    = useState("form");
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [driverInfo,       setDriverInfo]       = useState(null);
  const [error,            setError]            = useState(null);
  const [invoiceStatus,    setInvoiceStatus]    = useState(null);
  const [countdown,        setCountdown]        = useState(120);
  // NEW: tracks whether customer has confirmed payment
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [sendingInvoice,   setSendingInvoice]   = useState(false);

  const countdownRef     = useRef(null);
  const driverInfoRef    = useRef(null); // store for use in payment confirm

  const [booking] = useState(() => {
    try { return location.state || {}; } catch { return {}; }
  });

  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoadingUser(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!booking?.package) { alert("No package selected."); navigate("/holidays"); }
    if (!booking?.vehicle) { alert("No vehicle selected."); navigate(-1); }
  }, [booking, navigate]);

  useEffect(() => {
    if (!loadingUser && !user) navigate("/login", { state: { from: location } });
  }, [loadingUser, user, location, navigate]);

  useEffect(() => {
    if (bookingStatus !== "finding_driver") return;
    setCountdown(120);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setError("No driver accepted your request in time. Please try again.");
          setBookingStatus("error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [bookingStatus]);

  const handleDriverAssigned = useCallback((data, bookingId) => {
    console.log("✅ Driver assigned:", data);
    const info = data.driverInfo || {
      name:          data.driverName    || "Your Driver",
      phone:         data.driverPhone   || "",
      vehicle:       data.driverVehicle || booking.vehicle?.name || "",
      vehicleNumber: data.vehicleNumber || "",
      rating:        data.driverRating  || 4.8,
      rides:         100,
    };
    driverInfoRef.current = { info, bookingId: bookingId || currentBookingId };
    setDriverInfo(info);
    setBookingStatus("driver_confirmed");
    clearInterval(countdownRef.current);
    // Do NOT send invoice yet — wait for payment confirmation
  }, [booking.vehicle?.name, currentBookingId]);

  useEffect(() => {
    if (!currentBookingId || bookingStatus !== "finding_driver") return;

    let cancelled = false;

    const pollBookingStatus = async () => {
      try {
        const data = await apiRequest(`/holiday-bookings/${currentBookingId}`);
        if (cancelled) return;

        const bookingData = data.booking || {};

        if (bookingData.status === "driver_assigned" && bookingData.driverInfo) {
          handleDriverAssigned(bookingData, bookingData.id);
          return;
        }

        if (bookingData.status === "no_driver_available" || bookingData.status === "error") {
          setError(bookingData.error || "No drivers available at this time.");
          setBookingStatus("error");
          clearInterval(countdownRef.current);
        }
      } catch (pollError) {
        if (!cancelled) {
          console.warn("Holiday booking poll failed:", pollError.message);
        }
      }
    };

    pollBookingStatus();
    const intervalId = setInterval(pollBookingStatus, 4000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentBookingId, bookingStatus, handleDriverAssigned]);

  if (loadingUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500" />
    </div>
  );

  const sendInvoiceEmail = async (bookingId, dInfo) => {
    setInvoiceStatus("sending");
    setSendingInvoice(true);
    try {
      const payload = {
        to:            user?.email || "",
        customerName:  name,
        customerPhone: phone,
        bookingId,
        packageName:   booking.package?.name     || "",
        duration:      booking.package?.duration || "",
        vehicle:       booking.vehicle?.name     || booking.vehicle?.type || "",
        travelDate:    date,
        guests:        booking.guests || 1,
        price:         Number(booking.price) || 0,
        state:         getStateFromPackage(booking.package),
        driverName:    dInfo?.name  || "",
        driverPhone:   dInfo?.phone || "",
        itinerary:     Array.isArray(booking.package?.itinerary) ? booking.package.itinerary : [],
      };
      const result = await apiRequest(`/holiday-bookings/${bookingId}/invoice`, {
        method: "POST",
        body: payload,
      });
      if (!result.success) throw new Error(result.error || "Invoice request failed");
      setInvoiceStatus("sent");
    } catch (err) {
      console.error("❌ Invoice failed:", err.message);
      setInvoiceStatus("failed");
    } finally {
      setSendingInvoice(false);
    }
  };

  // Called when customer clicks "I've Paid"
  const handlePaymentDone = async () => {
    setPaymentConfirmed(true);
    const { info, bookingId } = driverInfoRef.current || {};

    // Now send invoice
    await sendInvoiceEmail(bookingId || currentBookingId, info);
  };

  const handleProceed = () => {
    if (!name || !phone || !date) return alert("Please fill all details and select a date!");
    
    // ADD THIS:
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) return alert("Please enter a valid 10-digit phone number.");
    
    if (!agree) return alert("Please agree to the terms and conditions.");
    setConfirmed(true);
  };

  const handleConfirmAndPay = async () => {
    setLoading(true);
    setError(null);
    let bookingId = null;

    try {
      const pkgState = getStateFromPackage(booking.package);
      const normalizedPhone = phone.replace(/\D/g, "");
      const response = await apiRequest("/holiday-bookings", {
        method: "POST",
        body: {
          userName: name,
          userEmail: user?.email || "",
          userPhone: normalizedPhone,
          travelDate: date,
          package: booking.package,
          vehicle: booking.vehicle,
          guests: booking.guests || 1,
          price: booking.price,
          state: pkgState,
        },
      });

      bookingId = response.bookingId;
      setCurrentBookingId(bookingId);

      setConfirmed(false);
      setBookingStatus(response.status === "no_driver_available" ? "error" : "finding_driver");

      if (response.status === "no_driver_available") {
        setError(response.message || "No drivers available at this time.");
      }
    } catch (err) {
      console.error("❌ Booking error:", err);
      setError("Failed to process your booking. Please try again.");
      setBookingStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pct = Math.round(((120 - countdown) / 120) * 100);

  // ── FINDING DRIVER ─────────────────────────────────────────────────────────
  if (bookingStatus === "finding_driver") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="relative flex items-center justify-center mb-7">
            <div className="absolute w-32 h-32 rounded-full border-2 border-orange-200 animate-ping opacity-20" />
            <div className="absolute w-24 h-24 rounded-full border-2 border-orange-300 animate-ping opacity-30" style={{ animationDelay: "0.4s" }} />
            <div className="absolute w-16 h-16 rounded-full border-2 border-orange-400 animate-ping opacity-40" style={{ animationDelay: "0.8s" }} />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg z-10 text-2xl">🚗</div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-1">Finding Your Driver</h2>
          <p className="text-gray-500 text-sm text-center mb-1">Sending request to all available drivers in</p>
          <p className="text-orange-600 font-bold text-center text-lg mb-5">
            📍 {getStateFromPackage(booking.package) || "your area"}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mb-5">
            <span>Contacting drivers…</span>
            <span className="text-orange-600 font-bold text-sm">{fmt(countdown)}</span>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-sm space-y-1.5 border border-orange-100 mb-3">
            <p><span className="font-semibold">📦 Package:</span> {booking.package?.name}</p>
            <p><span className="font-semibold">🚗 Vehicle:</span> {booking.vehicle?.name || ""}</p>
            <p><span className="font-semibold">📅 Travel Date:</span> {date}</p>
            <p><span className="font-semibold">👤 Name:</span> {name}</p>
            <p><span className="font-semibold">💰 Price:</span> ₹{booking.price}</p>
          </div>
          {currentBookingId && (
            <p className="text-xs text-gray-300 text-center">Booking: {currentBookingId.substring(0, 14)}…</p>
          )}
        </div>
      </div>
    );
  }

  // ── DRIVER CONFIRMED ───────────────────────────────────────────────────────
  if (bookingStatus === "driver_confirmed") {
    const price = Number(booking.price) || 0;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">

          {/* Success header */}
          <div className="relative flex items-center justify-center mb-4">
            <div className="absolute w-20 h-20 rounded-full bg-green-100 animate-ping opacity-30" />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl z-10 text-3xl">🎉</div>
          </div>
          <h2 className="text-2xl font-bold text-green-700 text-center mb-1">Driver Assigned!</h2>
          <p className="text-gray-500 text-sm text-center mb-5">Your holiday booking is confirmed</p>

          {/* Driver details */}
          {driverInfo && (
            <div className="bg-orange-50 rounded-xl p-4 space-y-3 border border-orange-200 mb-4">
              <p className="text-sm font-bold text-orange-800 mb-1">🧑‍✈️ Your Driver</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-2xl">🚗</div>
                  <div>
                    <p className="font-bold text-gray-800 text-base">{driverInfo.name}</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-xs ${i < Math.floor(driverInfo.rating || 4) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{driverInfo.rating || 4.8}</span>
                    </div>
                  </div>
                </div>
                {driverInfo.phone && (
                  <a href={`tel:${driverInfo.phone}`}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors">
                    📞 Call
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-orange-100">
                {driverInfo.phone && <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm font-semibold text-gray-700">{driverInfo.phone}</p></div>}
                {driverInfo.vehicle && <div><p className="text-xs text-gray-400">Vehicle</p><p className="text-sm font-semibold text-gray-700">{driverInfo.vehicle}</p></div>}
                {driverInfo.vehicleNumber && <div><p className="text-xs text-gray-400">Vehicle No.</p><p className="text-sm font-semibold text-gray-700">{driverInfo.vehicleNumber}</p></div>}
                <div><p className="text-xs text-gray-400">Experience</p><p className="text-sm font-semibold text-gray-700">{driverInfo.rides || 100}+ rides</p></div>
              </div>
            </div>
          )}

          {/* Booking summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5 mb-4 border border-gray-100">
            <p className="font-bold text-gray-700 mb-2">📋 Booking Summary</p>
            <div className="flex justify-between"><span className="text-gray-500">Package</span><span className="font-medium text-gray-800 text-right max-w-[60%]">{booking.package?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Travel Date</span><span className="font-medium text-gray-800">{date}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Guests</span><span className="font-medium text-gray-800">{booking.guests || 1}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Vehicle</span><span className="font-medium text-gray-800">{booking.vehicle?.name || booking.vehicle?.type || "—"}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 mt-1">
              <span className="font-bold text-gray-700">Total Amount</span>
              <span className="font-black text-green-600 text-lg">₹{price.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* ── PAYMENT SECTION ── */}
          {!paymentConfirmed ? (
            <>
              {/* QR code */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100 mb-4">
                <p className="text-sm font-bold text-orange-800 text-center mb-3">💳 Pay via QR Code</p>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-orange-100">
                    <img src={PaymentQR} alt="Payment QR Code" className="w-48 h-48 object-contain rounded-lg" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      Scan & Pay <span className="text-green-600 font-black">₹{price.toLocaleString("en-IN")}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PhonePe • GPay • Paytm • BHIM • Any UPI app</p>
                  </div>
                  <div className="w-full bg-orange-100 rounded-lg px-4 py-2 text-center">
                    <p className="text-xs text-orange-700 font-medium">📸 Screenshot this page for payment reference</p>
                  </div>
                </div>
              </div>

              {/* Payment done button */}
              <button
                onClick={handlePaymentDone}
                disabled={sendingInvoice}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors text-base flex items-center justify-center gap-2 mb-3"
              >
                {sendingInvoice ? (
                  <>
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-white" />
                    Sending Invoice…
                  </>
                ) : (
                  <>✅ I&apos;ve Completed the Payment</>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center mb-2">
                Click after completing payment to receive your invoice
              </p>
            </>
          ) : (
            /* ── AFTER PAYMENT CONFIRMED ── */
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center mb-4">
                <p className="text-2xl mb-1">🎊</p>
                <p className="text-green-700 font-bold text-base">Payment Confirmed!</p>
                {invoiceStatus === "sending" && (
                  <p className="text-blue-500 text-sm mt-1 flex items-center justify-center gap-1">
                    <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-blue-500" />
                    Sending invoice to {user?.email}…
                  </p>
                )}
                {invoiceStatus === "sent" && (
                  <p className="text-green-600 text-sm mt-1">📧 Invoice sent to {user?.email}</p>
                )}
                {invoiceStatus === "failed" && (
                  <div className="mt-2">
                    <p className="text-orange-500 text-sm">⚠️ Invoice could not be sent</p>
                    <button
                      onClick={() => sendInvoiceEmail(driverInfoRef.current?.bookingId || currentBookingId, driverInfoRef.current?.info)}
                      className="mt-2 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg"
                    >
                      🔄 Retry Invoice
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-400 text-xs text-center mb-4">
                Your driver will contact you before the travel date.
              </p>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ERROR ──────────────────────────────────────────────────────────────────
  if (bookingStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Unable to Find a Driver</h2>
          <p className="text-gray-600 mb-6">{error || "No drivers available at the moment."}</p>
          <button
            onClick={() => { setBookingStatus("form"); setConfirmed(false); setError(null); setLoading(false); }}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── CONFIRM ────────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div
        className="flex flex-col min-h-screen items-center justify-center px-4 py-16"
        style={{ backgroundImage: `url(${BgCar})`, backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "cover" }}
      >
        <div className="max-w-xl w-full p-8 bg-white bg-opacity-97 rounded-3xl shadow-2xl z-10 relative">
          <h2 className="text-2xl font-bold mb-5 text-green-700 text-center">Confirm Your Booking</h2>
          <div className="bg-orange-50 rounded-2xl p-5 mb-5 space-y-2.5 border border-orange-100">
            <SummaryRow label="Package"     value={formatPackageInfo?.(booking.package) ?? booking.package?.name} />
            <SummaryRow label="Vehicle"     value={formatVehicleInfo?.(booking.vehicle, "confirm") ?? booking.vehicle?.name} />
            <SummaryRow label="Guests"      value={booking.guests || 1} />
            <SummaryRow label="Price"       value={formatPrice?.(booking.price) ?? `₹${booking.price}`} highlight />
            <SummaryRow label="Name"        value={name} />
            <SummaryRow label="Phone"       value={phone} />
            <SummaryRow label="Email"       value={user?.email} />
            <SummaryRow label="Travel Date" value={date} />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-sm text-blue-700">
            ℹ️ After confirming, we&apos;ll search for an available driver in <strong>{getStateFromPackage(booking.package) || "your area"}</strong>.
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
          <button
            className="w-full py-3.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleConfirmAndPay}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
                Finding Driver…
              </span>
            ) : "Confirm & Find Driver"}
          </button>
          <button
            className="mt-3 w-full text-gray-500 hover:text-gray-800 text-sm underline"
            onClick={() => { setConfirmed(false); setError(null); }}
            disabled={loading}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // ── BOOKING FORM ───────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen pt-16">
      <div className="flex flex-col lg:flex-row items-center justify-center flex-1 px-4 lg:px-16 py-16 gap-8">
        <div className="w-full lg:w-1/2 flex justify-center">
          <img
            src="https://png.pngtree.com/png-clipart/20240912/original/pngtree-summer-vacation-clip-art-png-image_15994208.png"
            alt="Summer Vacation"
            className="w-full lg:w-[90%] max-w-2xl object-contain"
          />
        </div>
        <div className="w-full lg:w-1/2 max-w-xl p-8 bg-orange-50 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Booking Details</h2>
          <div className="mb-6 space-y-4">
            <div>
              <label className="block mb-1.5 font-semibold text-sm">Full Name</label>
              <input type="text" placeholder="Enter your full name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block mb-1.5 font-semibold text-sm">Phone Number</label>
              <input type="tel" placeholder="Enter your phone number" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
            <div>
              <label className="block mb-1.5 font-semibold text-sm">Email</label>
              <input type="email" value={user?.email || ""} disabled
                className="w-full p-2.5 border rounded-lg bg-gray-100 text-gray-500" />
            </div>
            <div>
              <label className="block mb-1.5 font-semibold text-sm">Select Travel Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>
          </div>

          <div className="mb-6 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
            <h3 className="text-base font-bold mb-2">Package Details</h3>
            <p className="text-sm"><strong>Package:</strong> {formatPackageInfo?.(booking.package) ?? booking.package?.name}</p>
            <p className="text-sm"><strong>Vehicle:</strong> {booking.vehicle ? (formatVehicleInfo?.(booking.vehicle) ?? booking.vehicle?.name) : "Not specified"}</p>
            <p className="text-sm"><strong>Guests:</strong> {booking.guests || 1}</p>
            <p className="text-sm"><strong>Price:</strong> {formatPrice?.(booking.price) ?? `₹${booking.price}`}</p>
            {getStateFromPackage(booking.package) && (
              <p className="text-sm"><strong>State:</strong> {getStateFromPackage(booking.package)}</p>
            )}
          </div>

          <div className="mb-6 border p-4 rounded-xl bg-white">
            <h3 className="text-base font-bold mb-2">Terms & Conditions</h3>
            <div className="text-sm space-y-2 mb-4 text-gray-600">
              <p className="font-medium text-gray-800">Included:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Driver allowances as per itinerary</li>
                <li>Road tolls, parking fees, and state taxes</li>
                <li>All sightseeing as mentioned</li>
                <li>Fuel charges for the confirmed route</li>
              </ul>
              <p className="font-medium text-gray-800 mt-3">Not Included:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Entry tickets for attractions</li>
                <li>Guest food and accommodation</li>
                <li>Personal expenses</li>
                <li>Tips or gratuities</li>
              </ul>
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
              <span className="text-sm">I agree to the terms and conditions and understand the cancellation policy</span>
            </label>
          </div>

          <button
            onClick={handleProceed}
            disabled={!name || !phone || !date || !agree || loading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-colors ${
              name && phone && date && agree && !loading
                ? "bg-orange-500 hover:bg-orange-600"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-orange-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className={`font-semibold text-sm ${highlight ? "text-green-600 text-lg" : "text-gray-800"}`}>{value}</span>
    </div>
  );
}

SummaryRow.propTypes = {
  label: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  highlight: PropTypes.bool,
};