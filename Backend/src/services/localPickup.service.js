import { FieldValue, firestore } from "./firebase.js";
import {
  autosuggestProxy,
  reverseGeocodeProxy,
  resolveELocProxy,
  calculateDistanceProxy,
} from "./mapmyindia.service.js";
import { sendEmailThroughBackend } from "./emailProxy.service.js";

const getRideDoc = async (rideId) => {
  const snapshot = await firestore.collection("localRides").doc(rideId).get();
  if (!snapshot.exists) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

const requireOwnerOrGuest = async (rideId, user) => {
  const ride = await getRideDoc(rideId);
  if (!ride) {
    const error = new Error("Ride not found");
    error.statusCode = 404;
    throw error;
  }

  if (ride.userId && user?.uid && ride.userId !== user.uid) {
    const error = new Error("You do not have access to this ride");
    error.statusCode = 403;
    throw error;
  }

  if (ride.userId && !user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  return ride;
};

export const searchPlaces = async (query) => {
  return autosuggestProxy(query);
};

export const reverseGeocode = async (lat, lng) => {
  return reverseGeocodeProxy(lat, lng);
};

export const resolveELoc = async ({ eLoc, placeAddress }) => {
  return resolveELocProxy({ eLoc, placeAddress });
};

export const calculateDistance = async ({ originLat, originLng, destinationLat, destinationLng }) => {
  return calculateDistanceProxy({ originLat, originLng, destinationLat, destinationLng });
};


export const createLocalPickupRide = async ({ user, body }) => {
  const payload = {
    userId: user?.uid || body?.userId || "guest",
    userName: body?.userName || body?.customerName || user?.displayName || user?.email || "Guest",
    userPhone: body?.userPhone || body?.customerPhone || "",
    userEmail: body?.userEmail || user?.email || "",
    pickupLocation: body?.pickupLocation || null,
    dropoffLocation: body?.dropoffLocation || null,
    distance: Number(body?.distance || 0),
    duration: Number(body?.duration || 0),
    totalFare: Number(body?.totalFare || 0),
    isScheduled: Boolean(body?.isScheduled),
    status: "searching_driver",
    waitingForLocation: true,
    locationShared: false,
    locationSkipped: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const rideRef = await firestore.collection("localRides").add(payload);

  return {
    success: true,
    rideId: rideRef.id,
    status: payload.status,
  };
};

export const getLocalPickupRide = async ({ rideId, user }) => {
  const ride = await requireOwnerOrGuest(rideId, user);
  return {
    success: true,
    ride,
  };
};

export const updateLocalPickupRide = async ({ rideId, user, body }) => {
  await requireOwnerOrGuest(rideId, user);

  const updates = {
    ...(body?.status ? { status: body.status } : {}),
    ...(body?.locationShared !== undefined ? { locationShared: Boolean(body.locationShared) } : {}),
    ...(body?.locationSkipped !== undefined ? { locationSkipped: Boolean(body.locationSkipped) } : {}),
    ...(body?.waitingForLocation !== undefined ? { waitingForLocation: Boolean(body.waitingForLocation) } : {}),
    ...(body?.userLocation ? { userLocation: body.userLocation } : {}),
    ...(body?.paymentStatus ? { paymentStatus: body.paymentStatus } : {}),
    ...(body?.driverInfo ? { driverInfo: body.driverInfo } : {}),
    ...(body?.driverId ? { driverId: body.driverId } : {}),
    ...(body?.endedAt ? { endedAt: body.endedAt } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await firestore.collection("localRides").doc(rideId).set(updates, { merge: true });

  return {
    success: true,
    rideId,
  };
};

export const sendLocalPickupInvoice = async ({ rideId, user, body }) => {
  const ride = await requireOwnerOrGuest(rideId, user);
  const invoiceUrl = process.env.LOCAL_PICKUP_INVOICE_URL || PROXIED_URLS.sendLocalPickupInvoice;

  const payload = {
    to: body?.to || user?.email || ride.userEmail || "",
    customerName: body?.customerName || ride.userName || "",
    bookingId: rideId,
    vehicleType: body?.vehicleType || ride.vehicleType || ride.vehicle?.name || "Car",
    pickup: body?.pickup || ride.pickupLocation?.address || ride.pickupLocation?.name || "",
    drop: body?.drop || ride.dropoffLocation?.address || ride.dropoffLocation?.name || "",
    city: body?.city || ride.city || "",
    distance: Number(body?.distance ?? ride.distance ?? 0),
    duration: Number(body?.duration ?? ride.duration ?? 0),
    driverName: body?.driverName || ride.driverInfo?.name || "",
    driverPhone: body?.driverPhone || ride.driverInfo?.phone || "",
  };

  if (!payload.to || !payload.to.includes("@")) {
    const error = new Error(`Invalid email: "${payload.to}"`);
    error.statusCode = 400;
    throw error;
  }

  await firestore.collection("localRides").doc(rideId).set(
    {
      paymentStatus: "paid",
      paymentConfirmedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const result = await sendEmailThroughBackend({
    ...payload,
    subject: `Invoice for Ride #${rideId}`,
    template: "localPickupInvoice",
  });

  return {
    success: true,
    rideId,
    invoice: result,
  };
};
