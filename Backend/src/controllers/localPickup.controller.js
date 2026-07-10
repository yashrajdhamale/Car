import { firebaseAdmin } from "../services/firebase.js";
import {
  calculateDistance,
  createLocalPickupRide,
  getLocalPickupRide,
  resolveELoc,
  reverseGeocode,
  searchPlaces,
  sendLocalPickupInvoice,
  updateLocalPickupRide,
} from "../services/localPickup.service.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};

const getAuthenticatedUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    return await firebaseAdmin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
};

export const proxySearchPlaces = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter q is required" });
    }

    const result = await searchPlaces(query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const proxyReverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query || {};
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "lat and lng are required" });
    }

    const result = await reverseGeocode(lat, lng);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const proxyResolveELoc = async (req, res, next) => {
  try {
    const result = await resolveELoc(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const proxyCalculateDistance = async (req, res, next) => {
  try {
    console.log(
      "📥 DISTANCE REQUEST BODY:",
      req.body
    );

    const result = await calculateDistance(
      req.body || {}
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "❌ DISTANCE CONTROLLER ERROR:",
      error
    );

    next(error);
  }
};

export const submitLocalPickupRide = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    console.log("[LocalPickupController] POST /rides received", {
      authenticatedUserId: user?.uid || null,
      bodyUserId: req.body?.userId || null,
      hasPickupLocation: Boolean(req.body?.pickupLocation),
      hasDropoffLocation: Boolean(req.body?.dropoffLocation),
      distance: req.body?.distance,
      totalFare: req.body?.totalFare,
    });

    const result = await createLocalPickupRide({ user, body: req.body || {} });
    console.log("[LocalPickupController] POST /rides completed", result);

    return res.status(201).json({
      success: true,
      message: "Local pickup ride created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const readLocalPickupRide = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await getLocalPickupRide({ rideId: req.params.rideId, user });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const patchLocalPickupRide = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await updateLocalPickupRide({ rideId: req.params.rideId, user, body: req.body || {} });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const submitLocalPickupInvoice = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await sendLocalPickupInvoice({ rideId: req.params.rideId, user, body: req.body || {} });

    return res.status(200).json({
      success: true,
      message: "Local pickup invoice sent successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
