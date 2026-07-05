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
    const result = await createOutstationBooking({ user, body: req.body || {} });
    return res.status(201).json({ success: true, message: "Outstation booking created successfully", ...result });
  } catch (error) {
    next(error);
  }
};
