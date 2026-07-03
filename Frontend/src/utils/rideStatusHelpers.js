// src/utils/rideStatusHelpers.js
// Fixed versions of updateRideStatus and handleCancelRide
// that work correctly for ALL 4 ride types.

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { toast } from 'react-toastify';

/**
 * Returns the correct Firestore collection for a given ride type.
 */
export function collectionForRide(ride) {
  if (!ride?.type) {
    console.warn('Ride type missing, defaulting to airportTransfers');
    return 'airportTransfers';
  }

  switch (ride.type) {
    case 'airport':
      return 'airportTransfers';

    case 'localPickup':
      return 'localRides';

    case 'outstation':
      return 'bookings';   // ✅ Explicit handling

    case 'holiday':
      return 'holidayBookings';

    default:
      console.warn(`Unknown ride type: ${ride.type}, defaulting to airportTransfers`);
      return 'airportTransfers';
  }
}

/**
 * Updates the status of any accepted ride regardless of type.
 * Replaces the old updateRideStatus which was hardcoded to airportTransfers.
 */
export async function updateRideStatus(ride, status) {
  const collection = collectionForRide(ride);

  console.log(`Updating ride ${ride.id} in collection: ${collection}`);

  try {
    const rideRef = doc(db, collection, ride.id);

    await updateDoc(rideRef, {
      status,
      updatedAt: serverTimestamp(),

      ...(status === 'driver_arrived' && {
        driverArrivedAt: serverTimestamp(),
      }),

      ...(status === 'in_progress' && {
        rideStartedAt: serverTimestamp(),
      }),

      ...(status === 'completed' && {
        completedAt: serverTimestamp(),
      }),
    });

    toast.success(`Ride status updated to ${status.replace(/_/g, ' ')}`);
  } catch (error) {
    console.error('Error updating ride status:', error);
    toast.error('Failed to update ride status');
  }
}

/**
 * Cancels any accepted ride regardless of type.
 * Replaces the old handleCancelRide which was hardcoded to airportTransfers.
 */
export async function cancelRide(ride, driverUid, driverName) {
  const collection = collectionForRide(ride);
  const loadingToast = toast.loading('Cancelling ride...');
  try {
    const rideRef = doc(db, collection, ride.id);
    await updateDoc(rideRef, {
      status:              'cancelled',
      cancelledAt:         serverTimestamp(),
      cancelledBy:         'driver',
      cancelledReason:     'Driver unavailable',
      cancelledDriverId:   driverUid,
      cancelledDriverName: driverName || 'Driver',
      updatedAt:           serverTimestamp(),
      driverLocation:      null,
      driverLocationUpdatedAt: null,
    });
    toast.update(loadingToast, {
      render:      '✅ Ride cancelled successfully.',
      type:        'success',
      isLoading:   false,
      autoClose:   4000,
      closeButton: true,
    });
    return true;
  } catch (error) {
    console.error('Error cancelling ride:', error);
    toast.update(loadingToast, {
      render:      '❌ Failed to cancel ride. Please try again.',
      type:        'error',
      isLoading:   false,
      autoClose:   4000,
      closeButton: true,
    });
    return false;
  }
}