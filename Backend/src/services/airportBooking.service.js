import { FieldValue, firestore } from "./firebase.js";

export const createAirportBooking = async ({ user, body }) => {
  const transferDetails = body?.transferDetails || {};
  const vehicleDetails = body?.vehicleDetails || {};
  const bookingId = body?.bookingId || transferDetails.bookingId || null;

  const payload = {
    ...transferDetails,
    vehicleDetails,
    status: body?.status || "searching_driver",
    userId: user?.uid || body?.userId || "guest",
    userEmail: user?.email || body?.userEmail || "",
    bookingType: body?.bookingType || "airport",
    paymentStatus: body?.paymentStatus || "pending",
    driverId: body?.driverId || "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const transferRef = await firestore.collection("airportTransfers").add(payload);

  if (bookingId) {
    await firestore.collection("bookings").doc(bookingId).set(
      {
        status: "searching_driver",
        airportTransferId: transferRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return {
    success: true,
    bookingId: transferRef.id,
    status: payload.status,
  };
};
