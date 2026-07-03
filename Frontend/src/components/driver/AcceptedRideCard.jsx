// src/components/driver/AcceptedRideCard.jsx
// Renders a single accepted ride card in the My Rides tab.
// Extracted from DriverDashboard to keep that file manageable.

import { useState } from 'react';
import { toast } from 'react-toastify';
import OtpVerificationPanel from './OtpVerificationPanel';
import { updateRideStatus, cancelRide } from '../../utils/rideStatusHelpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getLocationText(location) {
  if (!location) return 'Location not specified';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    return location.name || location.address || location.formatted_address ||
      (location.lat && location.lng ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Location specified');
  }
  return 'Unknown location';
}

function getCustomerName(ride) {
  return ride.displayName || ride.customerName || ride.userName ||
    ride.name || (ride.firstName ? `${ride.firstName} ${ride.lastName || ''}`.trim() : null) ||
    (ride.email ? ride.email.split('@')[0] : 'Customer');
}

function getCustomerPhone(ride) {
  return ride.contactNumber1 || ride.contactNumber2 || ride.customerPhone ||
    ride.userPhone || ride.phone || ride.phoneNumber || ride.mobile ||
    ride.contactNumber || null;
}

function isFutureRide(ride) {
  if (!ride.travelDate && !ride.pickupTime) return false;
  try {
    const travelDate = new Date(ride.travelDate);
    if (ride.pickupTime) {
      const [h, m] = ride.pickupTime.split(':').map(Number);
      travelDate.setHours(h || 0, m || 0, 0, 0);
    } else if (ride.hour) {
      travelDate.setHours(ride.hour || 0, ride.minute || 0, 0, 0);
    }
    return travelDate > new Date();
  } catch { return false; }
}

function StatusBadge({ status }) {
  const map = {
    accepted:          'bg-blue-100 text-blue-700',
    driver_arrived:    'bg-yellow-100 text-yellow-700',
    in_progress:       'bg-orange-100 text-orange-700',
    completed:         'bg-green-100 text-green-700',
    cancelled:         'bg-red-100 text-red-700',
    scheduled_pending: 'bg-purple-100 text-purple-700',
    driver_assigned:   'bg-teal-100 text-teal-700',
  };
  const label = {
    cancelled:          'CANCELLED',
    scheduled_pending:  'SCHEDULED (Payment Pending)',
    driver_assigned:    'DRIVER ASSIGNED',
  }[status] || status.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`font-semibold px-2 py-1 rounded text-xs ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AcceptedRideCard({
  ride,
  driverUid,
  driverName,
  customerPhone,        // from parent's customerPhones state
  isFetchingPhone,
  onFetchPhone,
  onViewMap,
  onRideUpdated,        // called after cancel so parent removes it from list
}) {
  const phone = customerPhone || getCustomerPhone(ride);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this ride? The customer will be notified.')) return;
    const success = await cancelRide(ride, driverUid, driverName);
    if (success && onRideUpdated) onRideUpdated(ride.id, 'cancelled');
  };

  const handleStatusUpdate = async (status) => {
    await updateRideStatus(ride, status);
    // The real-time Firestore listener in DriverDashboard will update the ride
  };

  const showCancel =
    (ride.status === 'accepted' && isFutureRide(ride)) ||
    (ride.status === 'scheduled_pending' && ride.isScheduled);

  // OTP panel shows ONLY when driver has marked as arrived
  const showOtp = !ride.isScheduled && ride.status === 'driver_arrived';

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">

      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {getLocationText(
              ride.pickupSublocalityAddress || ride.pickupCity || ride.pickupLocation
            )} → {getLocationText(
              ride.destinationSublocalityAddress || ride.destinationCity || ride.dropoffLocation
            )}
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-gray-500 capitalize">
              {ride.type || 'airport'} ride
            </span>
            <StatusBadge status={ride.status} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            ID: {ride.id.substring(0, 12)}…
          </p>
        </div>

        {/* Map / Navigate buttons */}
        {ride.userLocation && ride.status !== 'cancelled' && !ride.isScheduled && (
          <div className="flex flex-col gap-2 ml-3">
            <button
              onClick={() => onViewMap && onViewMap(ride)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              📍 Map
            </button>
            <button
              onClick={() => window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${ride.userLocation.lat},${ride.userLocation.lng}`,
                '_blank'
              )}
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium"
            >
              🗺 Navigate
            </button>
          </div>
        )}
      </div>

      {/* ── Customer info ── */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
        <p className="text-sm font-semibold text-blue-900 mb-1">👤 Customer</p>
        <p className="text-sm text-gray-800">{getCustomerName(ride)}</p>
        <div className="flex items-center gap-2 mt-1">
          {phone ? (
            <a href={`tel:${phone}`} className="text-blue-600 hover:underline text-sm font-medium">
              📞 {phone}
            </a>
          ) : (
            <span className="text-gray-400 text-sm">No phone on file</span>
          )}
          <button
            onClick={() => onFetchPhone && onFetchPhone(ride)}
            disabled={isFetchingPhone}
            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-0.5 rounded"
          >
            {isFetchingPhone ? '🔄…' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* ── Trip info ── */}
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-3 text-sm text-gray-700 space-y-0.5">
        {ride.travelDate && (
          <p>📅 {new Date(ride.travelDate).toLocaleDateString()}
            {(ride.pickupTime || ride.hour) && ` at ${ride.pickupTime || `${ride.hour}:${ride.minute || '00'}`}`}
          </p>
        )}
        {(ride.adults || ride.children) && (
          <p>👥 {ride.adults || 0} Adults{ride.children ? `, ${ride.children} Children` : ''}</p>
        )}
        {(ride.vehicleType || ride.vehicleModel) && (
          <p>🚗 {ride.vehicleType || ride.vehicleModel}</p>
        )}
        {ride.isScheduled && (
          <p className="text-purple-700 font-medium">⏰ Scheduled — Payment Pending</p>
        )}
        {ride.driverLocation && (
          <p className="text-xs text-gray-400">
            📍 Driver: {ride.driverLocation.lat?.toFixed(4)}, {ride.driverLocation.lng?.toFixed(4)}
          </p>
        )}
      </div>

      {/* ── Customer location status ── */}
      {ride.userLocation ? (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3 text-sm">
          <p className="font-medium text-green-800">✅ Customer location shared</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {ride.userLocation.lat?.toFixed(5)}, {ride.userLocation.lng?.toFixed(5)}
            {ride.userLocation.timestamp && ` · ${new Date(ride.userLocation.timestamp).toLocaleTimeString()}`}
          </p>
        </div>
      ) : ride.waitingForLocation ? (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-3 text-sm text-yellow-800">
          ⏳ Waiting for customer to share location…
        </div>
      ) : ride.locationSkipped ? (
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200 mb-3 text-sm text-gray-600">
          ⏭ Customer skipped location sharing
        </div>
      ) : (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 mb-3 text-sm text-red-700">
          ❌ Location not shared by customer
        </div>
      )}

      {/* ── OTP panel (only after driver_arrived) ── */}
      {showOtp && (
        <div className="mb-3">
          <OtpVerificationPanel
            ride={ride}
            driverId={driverUid}
            onVerified={() => toast.success('🚗 Ride started!')}
          />
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div>
          {showCancel && (
            <button
              onClick={handleCancel}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              ✕ Cancel Ride
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {/* Step 1: accepted → mark arrived */}
          {!ride.isScheduled && (ride.status === 'accepted' || ride.status === 'driver_assigned') && (
            <button
              onClick={() => handleStatusUpdate('driver_arrived')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              ✓ Mark as Arrived
            </button>
          )}
          {/* Step 2: driver_arrived → OTP panel handles starting the ride */}
          {/* Step 3: in_progress → complete */}
          {!ride.isScheduled && ride.status === 'in_progress' && (
            <button
              onClick={() => handleStatusUpdate('completed')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              ✓ Complete Ride
            </button>
          )}
          {ride.isScheduled && ride.status === 'scheduled_pending' && (
            <button
              onClick={() => toast.info('Scheduled ride — waiting for customer payment')}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              ⏰ Scheduled Ride
            </button>
          )}
        </div>
      </div>
    </div>
  );
}