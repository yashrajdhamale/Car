// components/driver/HolidayRideRequestCard.jsx

import React, { useState } from "react";

export default function HolidayRideRequestCard({ request, onAccept, onReject }) {
  const [acting, setActing] = useState(null); // 'accept' | 'reject' | null

  const pkg = request.package || {};
  const veh = request.vehicle || {};
// AFTER
const handleAccept = async () => {
  setActing("accept");
  try { await onAccept(); } finally { setActing(null); }
};
const handleReject = async () => {
  setActing("reject");
  try { await onReject(); } finally { setActing(null); }
};

  // Format createdAt timestamp
  const timeAgo = (() => {
    try {
      const d = request.createdAt?.toDate?.() || new Date(request.createdAt);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  })();

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-md overflow-hidden hover:shadow-lg transition-shadow">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white min-w-0">
          <span className="text-lg flex-shrink-0">🏖️</span>
          <span className="font-bold text-base truncate">
            {request.packageName || pkg.name || "Holiday Package"}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {timeAgo && (
            <span className="text-orange-100 text-xs">🕐 {timeAgo}</span>
          )}
          {(request.packageDuration || pkg.duration) && (
            <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {request.packageDuration || pkg.duration}
            </span>
          )}
        </div>
      </div>

      <div className="p-5">

        {/* ── Details grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
          {request.state && (
            <Detail emoji="📍" label="State" value={request.state} />
          )}
          {request.travelDate && (
            <Detail emoji="📅" label="Travel Date" value={request.travelDate} />
          )}
          <Detail emoji="👥" label="Guests" value={request.guests || 1} />
          {(request.vehicleType || veh.name) && (
            <Detail emoji="🚗" label="Vehicle" value={request.vehicleType || veh.name} />
          )}
        </div>

        {/* ── Price ────────────────────────────────────────────────────── */}
        {request.price > 0 && (
          <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
            <span className="text-gray-600 text-sm font-medium">💰 Package Price</span>
            <span className="text-2xl font-black text-green-600">₹{request.price}</span>
          </div>
        )}

        {/* ── Customer ─────────────────────────────────────────────────── */}
        {(request.userName || request.userPhone) && (
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5 mb-4">
            <span className="text-gray-500 text-xs">👤 Customer:</span>
            <span className="text-sm font-semibold text-gray-700 flex-1 truncate">
              {request.userName || "—"}
            </span>
            {request.userPhone && (
              <a
                href={`tel:${request.userPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-xs shadow-sm transition-colors"
              >
                📞
              </a>
            )}
          </div>
        )}

        {/* ── Booking ID reference ──────────────────────────────────────── */}
        {request.bookingId && (
          <p className="text-xs text-gray-300 mb-4 font-mono truncate">
            ID: {request.bookingId.substring(0, 16)}…
          </p>
        )}

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={!!acting}
            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            {acting === "accept"
              ? <span className="animate-spin inline-block h-4 w-4 border-t-2 border-white rounded-full" />
              : "✅"}
            Accept Trip
          </button>

          <button
            onClick={handleReject}
            disabled={!!acting}
            className="flex-1 py-3 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 font-bold rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {acting === "reject"
              ? <span className="animate-spin inline-block h-4 w-4 border-t-2 border-red-400 rounded-full" />
              : "❌"}
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ emoji, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-sm flex-shrink-0 mt-0.5">{emoji}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
}