import { FieldValue, firestore } from "./firebase.js";

const getDriverRef = (driverId) => firestore.collection("drivers").doc(driverId);
const getBookingRef = (bookingId) => firestore.collection("airportTransfers").doc(bookingId);

export const updateDriverLocation = async ({ driverId, location }) => {
  if (!driverId) {
    const error = new Error("driverId is required");
    error.statusCode = 400;
    throw error;
  }
  await getDriverRef(driverId).set(
    {
      lastLocation: location || null,
      locationEnabled: true,
      lastUpdated: FieldValue.serverTimestamp(),
      isOnline: true,
      lastOnline: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { success: true };
};

export const updateDriverLocationInRides = async ({ driverId, location }) => {
  if (!driverId) {
    const error = new Error("driverId is required");
    error.statusCode = 400;
    throw error;
  }
  const snapshot = await firestore.collection("airportTransfers")
    .where("driverId", "==", driverId)
    .where("status", "in", ["accepted", "driver_arrived", "in_progress"])
    .get();
  const updates = snapshot.docs.map((docSnap) =>
    getBookingRef(docSnap.id).set(
      {
        driverLocation: location || null,
        driverLocationUpdatedAt: FieldValue.serverTimestamp(),
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )
  );
  await Promise.all(updates);
  return { success: true, updatedCount: updates.length };
};

export const getDriverLocation = async (driverId) => {
  const snap = await getDriverRef(driverId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  return {
    name: data.name || data.displayName || "Driver",
    isOnline: Boolean(data.isOnline),
    location: data.lastLocation || null,
  };
};

export const enforceDriverLocationSharing = async (driverId) => {
  await getDriverRef(driverId).set(
    {
      locationRequired: true,
      lastWarning: FieldValue.serverTimestamp(),
      onlineUntil: null,
    },
    { merge: true }
  );
  return { success: true, message: "Location sharing required" };
};

export const updateCustomerLocation = async ({ bookingId, location }) => {
  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    throw error;
  }
  await getBookingRef(bookingId).set(
    {
      userLocation: location || null,
      userLocationUpdatedAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
      locationShared: true,
    },
    { merge: true }
  );
  return { success: true };
};

export const getRideTracking = async (bookingId) => {
  const snap = await getBookingRef(bookingId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

export const findNearbyDrivers = async ({ customerLocation, radiusKm }) => {
  const snapshot = await firestore.collection("drivers").where("isOnline", "==", true).where("locationEnabled", "==", true).get();
  const drivers = [];
  snapshot.forEach((docSnap) => {
    const driver = docSnap.data();
    if (driver.lastLocation) {
      drivers.push({ id: docSnap.id, ...driver });
    }
  });
  return { success: true, drivers, radiusKm: radiusKm || 5, customerLocation: customerLocation || null };
};
