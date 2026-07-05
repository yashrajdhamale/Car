import { createAirportBooking } from "../services/airportBooking.service.js";
import { firestore, FieldValue } from "../services/firebase.js";
import { findAndAssignAirportDriver, getAirportBookingById } from "../services/airportDriver.service.js";

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

export const submitAirportBooking = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await createAirportBooking({ user, body: req.body || {} });

    return res.status(201).json({
      success: true,
      message: "Airport booking created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAirportBooking = async (req, res, next) => {
  try {
    const result = await getAirportBookingById({ bookingId: req.params.bookingId, user: await getAuthenticatedUser(req) });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const searchAirportDriver = async (req, res, next) => {
  try {
    const result = await findAndAssignAirportDriver({ bookingId: req.params.bookingId, user: await getAuthenticatedUser(req) });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
