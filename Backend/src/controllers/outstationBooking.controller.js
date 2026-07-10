import { createOutstationBooking } from "../services/outstationBooking.service.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
};

const getAuthenticatedUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) return null;
  const { firebaseAdmin } = await import("../services/firebase.js");
  try {
    return await firebaseAdmin.auth().verifyIdToken(token);
  } catch {
    return null;
  }
};

export const submitOutstationBooking = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    console.log("[OutstationController] POST /outstation-bookings received", {
      authenticatedUserId: user?.uid || null,
      bodyUserId: req.body?.userId || null,
      pickupCity: req.body?.pickupCity,
      pickupCityForDriver: req.body?.pickupCityForDriver,
      destinationCity: req.body?.destinationCity,
      destinationCityForDriver: req.body?.destinationCityForDriver,
      rideType: req.body?.rideType,
      status: req.body?.status,
    });

    const result = await createOutstationBooking({ user, body: req.body || {} });
    console.log("[OutstationController] POST /outstation-bookings completed", result);

    return res.status(201).json({ success: true, message: "Outstation booking created successfully", ...result });
  } catch (error) {
    next(error);
  }
};
