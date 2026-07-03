// src/components/driver/LocalPickupRequestCard.jsx

import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

const LocalPickupRequestCard = ({ request, onAction, isProcessing }) => {
  const [rideDetails, setRideDetails] = useState(request);
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────────────────────
  // Firestore live listener
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!request?.id) return;

    const requestRef = doc(db, 'localRides', request.rideId || request.id);

    const unsubscribe = onSnapshot(
      requestRef,
      (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();
        if (data.status === 'accepted' || data.status === 'no_driver_found' || data.status === 'cancelled') {
          return;
        }

        setRideDetails({
          id: docSnap.id,
          ...data,
          pickupLocation: data.pickupLocation || null,
          dropoffLocation: data.dropoffLocation || null,
          distance: data.distance ?? 0,
          duration: data.duration ?? 0,
          totalFare: data.totalFare ?? 0,
          createdAt: data.createdAt || null,
          note: data.note || '',
        });
      },
      (error) => {
        console.error('Error fetching local ride:', error);
        toast.error('Failed to load ride details');
      }
    );

    return () => unsubscribe();
  }, [request?.id]);

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────
  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleAction = async (type) => {
    if (isProcessing) return;
    try {
      setLoading(true);
      await onAction(rideDetails, type);
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // Loading skeleton
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border-l-2 border-orange-400 mb-3 hover:shadow-md transition-all">
      <div className="p-3">

        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center">
            <span className="text-orange-500 mr-2">🚕</span>
            <h3 className="font-semibold text-sm">Local Pickup</h3>
          </div>

          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {rideDetails.status || 'pending'}
          </span>
        </div>

        {/* Date & Time */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>📅 {formatDate(rideDetails.createdAt)}</span>
          <span>⏰ {formatTime(rideDetails.createdAt)}</span>
        </div>

        {/* Pickup */}
        <div className="bg-gray-50 p-2 rounded mb-2">
          <p className="text-xs text-gray-500 font-medium">Pickup</p>
          <p className="font-medium text-sm">
            {rideDetails.pickupLocation?.address || 'Not specified'}
          </p>
        </div>

        {/* Drop */}
        <div className="bg-gray-50 p-2 rounded mb-2">
          <p className="text-xs text-gray-500 font-medium">Drop</p>
          <p className="font-medium text-sm">
            {rideDetails.dropoffLocation?.address || 'Not specified'}
          </p>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500">Distance</p>
            <p className="font-medium">
              {Number(rideDetails.distance).toFixed(2)} km
            </p>
          </div>

          <div className="bg-gray-50 p-2 rounded">
            <p className="text-gray-500">Fare</p>
            <p className="font-medium text-orange-600">
              ₹{rideDetails.totalFare}
            </p>
          </div>
        </div>

        {/* Notes */}
        {rideDetails.note && (
          <div className="bg-orange-50 p-2 rounded text-xs mb-2">
            📝 {rideDetails.note}
          </div>
        )}

        {/* Actions */}
        {(rideDetails.status === 'pending' ||
          rideDetails.status === 'searching_driver') && (
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => handleAction('reject')}
              className="flex-1 bg-red-500 text-white py-2 rounded text-sm"
            >
              Reject
            </button>

            <button
              onClick={() => handleAction('accept')}
              className="flex-1 bg-green-500 text-white py-2 rounded text-sm"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalPickupRequestCard;