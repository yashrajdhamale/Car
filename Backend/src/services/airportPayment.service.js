import { FieldValue, firestore } from "./firebase.js";

const AIRPORT_INVOICE_URL =
  process.env.AIRPORT_INVOICE_URL ||
  "https://sendairportinvoice-fhq2rwxr2a-uc.a.run.app";

export const confirmAirportPaymentAndSendInvoice = async ({ user, bookingId, body }) => {
  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    throw error;
  }

  const bookingRef = firestore.collection("airportTransfers").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const booking = bookingSnap.data() || {};
  const customerName = body?.customerName || user.displayName || booking.customerName || booking.userName || "Customer";
  const customerEmail = body?.customerEmail || user.email || booking.customerEmail || booking.userEmail || "";

  const updateData = {
    paymentStatus: "paid",
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    customerName,
    userName: customerName,
    customerEmail,
    userEmail: customerEmail,
    customerPhone: body?.customerPhone || booking.customerPhone || booking.userPhone || "",
    userPhone: body?.customerPhone || booking.userPhone || "",
    phoneNumber: body?.customerPhone || booking.phoneNumber || booking.userPhone || "",
    waitingForLocation: true,
    locationShared: false,
    locationSkipped: false,
    customerInfoAvailable: true,
    customerInfoSavedAt: FieldValue.serverTimestamp(),
    termsAccepted: true,
    termsAcceptedAt: FieldValue.serverTimestamp(),
    cancellationPolicyAccepted: true,
    cancellationPolicyAcceptedAt: FieldValue.serverTimestamp(),
    status: booking.driverId && booking.status === "accepted" ? "accepted" : "searching_driver",
  };

  await bookingRef.update(updateData);

  if (!customerEmail) {
    return {
      success: true,
      bookingId,
      message: "Payment recorded but no customer email was available for invoice.",
      booking: { id: bookingId, ...booking, ...updateData },
    };
  }

  const invoicePayload = {
    to: customerEmail.trim(),
    customerName,
    bookingId,
    vehicleType: body?.vehicleType || booking.vehicleDetails?.name || booking.vehicleType || "Vehicle",
    pickup: body?.pickup || booking.pickupLocation?.name || booking.pickupLocation?.address || "",
    dropoff: body?.dropoff || booking.dropoffLocation?.name || booking.dropoffLocation?.address || "",
    travelDate: body?.travelDate || booking.travelDate || "",
    time: body?.time || "",
    adults: body?.adults || booking.adults || 1,
    children: body?.children || booking.children || 0,
    price: Number(body?.price ?? booking.price ?? 0),
  };

  const response = await fetch(AIRPORT_INVOICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(invoicePayload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.error || result?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.payload = result;
    throw error;
  }

  return {
    success: true,
    bookingId,
    invoice: result,
  };
};

export const updateAirportBookingLocation = async ({ user, bookingId, body }) => {
  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    throw error;
  }

  const bookingRef = firestore.collection("airportTransfers").doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  const updates = {
    ...(body?.userLocation ? { userLocation: body.userLocation } : {}),
    ...(body?.locationShared !== undefined ? { locationShared: Boolean(body.locationShared) } : {}),
    ...(body?.waitingForLocation !== undefined ? { waitingForLocation: Boolean(body.waitingForLocation) } : {}),
    ...(body?.locationSkipped !== undefined ? { locationSkipped: Boolean(body.locationSkipped) } : {}),
    ...(body?.status ? { status: body.status } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await bookingRef.set(updates, { merge: true });

  return {
    success: true,
    bookingId,
  };
};
