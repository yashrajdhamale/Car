import { firebaseAdmin } from "../services/firebase.js";
import { confirmAirportPaymentAndSendInvoice, updateAirportBookingLocation } from "../services/airportPayment.service.js";

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

export const submitAirportPaymentConfirmation = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await confirmAirportPaymentAndSendInvoice({
      user,
      bookingId: req.params.bookingId,
      body: req.body || {},
    });

    return res.status(200).json({
      success: true,
      message: "Airport payment confirmed and invoice sent",
      ...result,
    });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message, error: error.message });
    }
    next(error);
  }
};

export const submitAirportLocationUpdate = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await updateAirportBookingLocation({
      user,
      bookingId: req.params.bookingId,
      body: req.body || {},
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message, error: error.message });
    }
    next(error);
  }
};
