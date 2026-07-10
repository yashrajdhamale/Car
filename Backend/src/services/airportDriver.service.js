import { FieldValue, firestore } from "./firebase.js";

const normalizeLocation = (location) => {
  if (!location) return "";
  if (typeof location === "string") return location.toLowerCase().trim();
  return String(location.name || location.address || location.cityName || location.displayAddress || "")
    .toLowerCase()
    .trim();
};

const isExpired = (booking) => booking?.expiresAt?.toDate && booking.expiresAt.toDate() <= new Date();

export const getAirportBookingById = async ({ bookingId, user }) => {
  const bookingRef = firestore.collection("airportTransfers").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  const booking = { id: snap.id, ...snap.data() };
  return { success: true, booking };
};

export const findAndAssignAirportDriver = async ({ bookingId }) => {
  const bookingRef = firestore.collection("airportTransfers").doc(bookingId);
  const snap = await bookingRef.get();
  if (!snap.exists) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const booking = snap.data();
  if (booking.status === "accepted" || booking.driverId) {
    return { success: true, status: "accepted", driverId: booking.driverId || null };
  }

  if (isExpired(booking)) {
    await bookingRef.set({ status: "expired", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true, status: "expired" };
  }

  const pickup = booking.pickupLocation?.name || booking.pickupLocation?.address || booking.pickupLocation || "";
  const dropoff = booking.dropoffLocation?.name || booking.dropoffLocation?.address || booking.dropoffLocation || "";
  const pickupNorm = normalizeLocation(pickup);
  const dropoffNorm = normalizeLocation(dropoff);

  const driversSnapshot = await firestore.collection("drivers").get();
  for (const driverDoc of driversSnapshot.docs) {
    const driver = driverDoc.data();
    const status = String(driver.status || "unknown").toLowerCase();
    if (!["available", "online", "active"].includes(status)) continue;

    // Query routes from top-level /routes collection for this driver
    const driverRoutesSnapshot = await firestore.collection("routes").where("driverId", "==", driverDoc.id).get();
    const matched = driverRoutesSnapshot.docs.some((routeDoc) => {
      const route = routeDoc.data();
      const routeFrom = normalizeLocation(route.from);
      const routeTo = normalizeLocation(route.to);
      return (
        (routeFrom === pickupNorm && routeTo === dropoffNorm) ||
        (routeFrom === dropoffNorm && routeTo === pickupNorm)
      );
    });

    if (matched) {
      await bookingRef.set(
        {
          status: "accepted",
          driverId: driverDoc.id,
          driverName: driver.displayName || driver.fullName || "Driver",
          driverPhone: driver.phoneNumber || driver.phone || "",
          vehicleType: driver.vehicleType || "Standard",
          vehicleModel: driver.vehicleModel || "",
          vehicleNumber: driver.vehicleNumber || "",
          acceptedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return {
        success: true,
        status: "accepted",
        driverId: driverDoc.id,
        driverName: driver.displayName || driver.fullName || "Driver",
      };
    }
  }

  await bookingRef.set(
    { status: "searching_driver", updatedAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return { success: true, status: "searching_driver" };
};
