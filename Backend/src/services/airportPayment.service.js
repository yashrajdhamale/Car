import { FieldValue, firestore } from "./firebase.js";
import { sendEmailThroughBackend } from "./emailProxy.service.js";

export const confirmAirportPaymentAndSendInvoice = async ({
  user,
  bookingId,
  body,
}) => {
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

  const customerName =
    body?.customerName ||
    user.displayName ||
    booking.customerName ||
    booking.userName ||
    "Customer";

  const customerEmail =
    body?.customerEmail ||
    user.email ||
    booking.customerEmail ||
    booking.userEmail ||
    "";

  const updateData = {
    paymentStatus: "paid",
    paidAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

    customerName,
    userName: customerName,

    customerEmail,
    userEmail: customerEmail,

    customerPhone:
      body?.customerPhone ||
      booking.customerPhone ||
      booking.userPhone ||
      "",

    userPhone:
      body?.customerPhone ||
      booking.userPhone ||
      "",

    phoneNumber:
      body?.customerPhone ||
      booking.phoneNumber ||
      booking.userPhone ||
      "",

    waitingForLocation: true,
    locationShared: false,
    locationSkipped: false,

    customerInfoAvailable: true,
    customerInfoSavedAt: FieldValue.serverTimestamp(),

    termsAccepted: true,
    termsAcceptedAt: FieldValue.serverTimestamp(),

    cancellationPolicyAccepted: true,
    cancellationPolicyAcceptedAt: FieldValue.serverTimestamp(),

    status:
      booking.driverId && booking.status === "accepted"
        ? "accepted"
        : "searching_driver",
  };

  await bookingRef.update(updateData);

  if (!customerEmail) {
    return {
      success: true,
      bookingId,
      message:
        "Payment recorded but customer email was not found.",
    };
  }

  try {
    await sendEmailThroughBackend({
      to: customerEmail.trim(),

      subject: `Airport Booking Invoice - ${bookingId}`,

      template: "airportInvoice",

      customerName,

      customerEmail,

      bookingId,

      vehicleType:
        body?.vehicleType ||
        booking.vehicleDetails?.name ||
        booking.vehicleType ||
        "Vehicle",

      pickup:
        body?.pickup ||
        booking.pickupLocation?.name ||
        booking.pickupLocation?.address ||
        "",

      drop:
        body?.dropoff ||
        booking.dropoffLocation?.name ||
        booking.dropoffLocation?.address ||
        "",

      travelDate:
        body?.travelDate ||
        booking.travelDate ||
        "",

      time:
        body?.time ||
        `${booking.hour || ""}:${booking.minute || ""}`,

      adults:
        body?.adults ??
        booking.adults ??
        1,

      children:
        body?.children ??
        booking.children ??
        0,

      price:
        Number(
          body?.price ??
          booking.price ??
          booking.vehicleDetails?.price ??
          0
        ),
    });

    console.log("✅ Airport invoice email sent.");

    return {
      success: true,
      bookingId,
      message: "Payment confirmed and invoice sent.",
    };
  } catch (err) {
    console.error("Airport invoice email failed:");
    console.error(err);

    return {
      success: true,
      bookingId,
      message:
        "Payment recorded successfully but invoice email failed.",
      invoiceError: err.message,
    };
  }
};

export const updateAirportBookingLocation = async ({
  user,
  bookingId,
  body,
}) => {
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
    ...(body?.userLocation && {
      userLocation: body.userLocation,
    }),

    ...(body?.locationShared !== undefined && {
      locationShared: Boolean(body.locationShared),
    }),

    ...(body?.waitingForLocation !== undefined && {
      waitingForLocation: Boolean(body.waitingForLocation),
    }),

    ...(body?.locationSkipped !== undefined && {
      locationSkipped: Boolean(body.locationSkipped),
    }),

    ...(body?.status && {
      status: body.status,
    }),

    updatedAt: FieldValue.serverTimestamp(),
  };

  await bookingRef.set(updates, {
    merge: true,
  });

  return {
    success: true,
    bookingId,
  };
};