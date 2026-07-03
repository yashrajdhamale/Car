// HolidayPaymentPage.jsx
// Route: /holiday-payment
// Receives state: { bookingId, bookingData, pkg, vehicle, guests, price, travelDate, stateName, driver }

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { confirmHolidayBooking } from "./holidayDriverService"; // adjust path
import {
  MapPin, Calendar, Users, Car, IndianRupee,
  ChevronRight, ChevronLeft, Loader2, CheckCircle2,
  Shield, Smartphone, CreditCard, Banknote, Phone, Star,
} from "lucide-react";

const METHODS = [
  { id: "upi",  Icon: Smartphone,  label: "UPI",                desc: "GPay · PhonePe · Paytm · any UPI",  accent: "#7C3AED", badge: "Instant" },
  { id: "card", Icon: CreditCard,  label: "Credit / Debit Card", desc: "Visa · Mastercard · RuPay",          accent: "#0EA5E9", badge: null },
  { id: "cash", Icon: Banknote,    label: "Cash on Trip",        desc: "Pay driver at start of trip",        accent: "#10B981", badge: "No advance" },
];

const Row = ({ icon: Icon, label, value, big }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="flex items-center gap-2 text-gray-500 text-sm">
      <Icon size={14} className="text-orange-400" />{label}
    </span>
    <span className={`font-semibold ${big ? "text-2xl text-green-600" : "text-gray-800 text-sm"}`}>{value}</span>
  </div>
);

export default function HolidayPaymentPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const {
    bookingId, bookingData, pkg, vehicle,
    guests, price, travelDate, stateName, driver,
  } = location.state || {};

  const [method,   setMethod]   = useState("cash");
  const [upiId,    setUpiId]    = useState("");
  const [paying,   setPaying]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [err,      setErr]      = useState("");

  if (!bookingId) { navigate("/"); return null; }

  const handlePay = async () => {
    if (method === "upi" && !upiId.trim()) { setErr("Please enter your UPI ID."); return; }
    setErr(""); setPaying(true);
    try {
      // ── In production: trigger Razorpay/PhonePe here before confirming ──
      await new Promise((r) => setTimeout(r, 1400)); // simulate gateway delay
      const result = await confirmHolidayBooking(bookingId, method);
      if (!result.success) throw new Error(result.error);
      setDone(true);
    } catch (e) {
      setErr("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          {/* animated check */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute w-28 h-28 rounded-full bg-green-100 animate-ping opacity-30" />
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl z-10">
              <CheckCircle2 size={40} className="text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-black text-gray-800 mb-2">Booking Confirmed! 🎉</h2>
          <p className="text-gray-500 text-sm mb-6">Have a wonderful holiday trip!</p>

          {/* Driver card */}
          {driver?.name && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-5 flex items-center gap-4 text-left">
              <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center text-xl font-bold text-orange-700 flex-shrink-0">
                {(driver.name || "D")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{driver.name}</p>
                <div className="flex items-center gap-0.5 text-yellow-500 text-xs">
                  <Star size={11} fill="currentColor" />
                  <span className="text-gray-400 ml-0.5">{driver.rating || 4.8}</span>
                </div>
                <p className="text-xs text-gray-500">{driver.vehicle || vehicle?.name}</p>
              </div>
              {driver.phone && (
                <a href={`tel:${driver.phone}`} className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md">
                  <Phone size={14} />
                </a>
              )}
            </div>
          )}

          {/* Confirmation summary */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Confirmed Booking</p>
            <Row icon={MapPin}       label="Package"     value={pkg?.name} />
            <Row icon={Calendar}     label="Travel Date" value={travelDate} />
            <Row icon={Users}        label="Guests"      value={guests} />
            <Row icon={Car}          label="Vehicle"     value={vehicle?.name} />
            <Row icon={IndianRupee}  label="Amount"      value={`₹${price}`} big />
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate("/my-bookings")} className="flex-1 btn-green flex items-center justify-center gap-2">
              My Bookings <ChevronRight size={16} />
            </button>
            <button onClick={() => navigate("/")} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl py-3 hover:border-gray-300 transition-colors text-sm">
              Home
            </button>
          </div>
        </div>
        <Styles />
      </div>
    );
  }

  // ── PAYMENT UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 flex justify-center items-start pt-8 pb-16">
      <div className="w-full max-w-lg space-y-5">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm transition-colors">
          <ChevronLeft size={16} /> Back
        </button>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-black text-gray-800">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Secure your {stateName} holiday trip</p>
        </div>

        {/* Driver assigned banner */}
        {driver?.name && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center font-bold text-green-700 text-sm flex-shrink-0">
              {(driver.name || "D")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800 truncate">{driver.name} is ready for your trip</p>
              <p className="text-xs text-green-600">Complete payment to lock your booking</p>
            </div>
            {driver.phone && (
              <a href={`tel:${driver.phone}`} className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm flex-shrink-0">
                <Phone size={13} />
              </a>
            )}
          </div>
        )}

        {/* Booking summary card */}
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Booking Summary</p>
          <Row icon={MapPin}      label="Package"     value={pkg?.name} />
          <Row icon={Calendar}    label="Travel Date" value={travelDate} />
          <Row icon={Users}       label="Guests"      value={guests} />
          <Row icon={Car}         label="Vehicle"     value={vehicle?.name} />
          <div className="mt-3 pt-3 border-t border-dashed border-orange-200 flex items-center justify-between">
            <span className="text-gray-700 font-bold">Total Amount</span>
            <span className="text-3xl font-black text-green-600">₹{price}</span>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="bg-white rounded-2xl shadow-md border border-orange-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Payment Method</p>
          <div className="space-y-3">
            {METHODS.map(({ id, Icon, label, desc, accent, badge }) => (
              <button
                key={id}
                onClick={() => { setMethod(id); setErr(""); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  method === id
                    ? "border-orange-400 bg-orange-50 shadow-md"
                    : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/30"
                }`}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}18` }}>
                  <Icon size={20} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 text-sm">{label}</span>
                    {badge && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}18`, color: accent }}>
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${method === id ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                  {method === id && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
              </button>
            ))}
          </div>

          {/* UPI input */}
          {method === "upi" && (
            <div className="mt-4">
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Enter UPI ID</label>
              <input
                type="text" placeholder="yourname@upi" value={upiId}
                onChange={(e) => { setUpiId(e.target.value); setErr(""); }}
                className="w-full border-2 border-purple-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-colors"
              />
            </div>
          )}

          {/* Card mock inputs */}
          {method === "card" && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                  className="w-full border-2 border-sky-200 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">Expiry</label>
                  <input type="text" placeholder="MM / YY" maxLength={7}
                    className="w-full border-2 border-sky-200 focus:border-sky-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-1.5 block">CVV</label>
                  <input type="password" placeholder="•••" maxLength={4}
                    className="w-full border-2 border-sky-200 focus:border-sky-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors" />
                </div>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Shield size={11} className="text-sky-400" /> 256-bit SSL encrypted
              </p>
            </div>
          )}

          {method === "cash" && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              💵 Pay <strong>₹{price}</strong> directly to your driver at the start of the trip. No advance needed.
            </div>
          )}
        </div>

        {err && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{err}</div>
        )}

        {/* Pay button */}
        <button onClick={handlePay} disabled={paying} className="btn-orange w-full flex items-center justify-center gap-2">
          {paying
            ? <><Loader2 size={18} className="animate-spin" /> Processing…</>
            : <><Shield size={16} /> {method === "cash" ? `Confirm Booking · ₹${price} Cash` : `Pay ₹${price} Now`} <ChevronRight size={18} /></>}
        </button>

        <p className="text-xs text-gray-400 text-center pb-4 flex items-center justify-center gap-1">
          <Shield size={10} /> Secured by Carzi Holidays
        </p>
      </div>
      <Styles />
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      .btn-orange {
        background: linear-gradient(135deg, #f97316, #ea580c);
        color: white; font-weight: 700; font-size: 1rem;
        padding: 1rem 1.5rem; border-radius: 0.875rem; border: none;
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 14px rgba(249,115,22,0.35);
      }
      .btn-orange:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(249,115,22,0.45); }
      .btn-orange:disabled { opacity: 0.6; cursor: not-allowed; }
      .btn-green {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white; font-weight: 700; font-size: 0.9rem;
        padding: 0.75rem 1rem; border-radius: 0.75rem; border: none;
        cursor: pointer; transition: all 0.2s;
        box-shadow: 0 4px 14px rgba(34,197,94,0.3);
      }
      .btn-green:hover { transform: translateY(-1px); }
    `}</style>
  );
}