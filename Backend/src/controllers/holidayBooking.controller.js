import { firebaseAdmin } from "../services/firebase.js";
import { approveHolidayBooking, createHolidayBooking, getHolidayBookingById, markHolidayBookingPaymentCompleted, sendHolidayInvoiceForBooking } from "../services/holidayBooking.service.js";

const getBearerToken = (req) => {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
};

const getAuthenticatedUser = async (req) => {
  const token = getBearerToken(req);
  if (!token) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  try {
    return await firebaseAdmin.auth().verifyIdToken(token);
  } catch (error) {
    const authError = new Error("Invalid or expired authentication token");
    authError.statusCode = 401;
    throw authError;
  }
};

export const submitHolidayBooking = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await createHolidayBooking({ user, body: req.body || {} });

    return res.status(201).json({
      success: true,
      message: "Holiday booking created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const readHolidayBooking = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const booking = await getHolidayBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Holiday booking not found",
      });
    }

    if (booking.userId && booking.userId !== user.uid) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this holiday booking",
      });
    }

    return res.status(200).json({
      success: true,
      booking: {
        id: booking.id,
        ...booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendHolidayInvoice = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { bookingId } = req.params;
    const result = await sendHolidayInvoiceForBooking({
      user,
      bookingId,
      body: req.body || {},
    });

    return res.status(200).json({
      success: true,
      message: "Holiday invoice sent successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const approveHolidayBookingRecord = async (req, res, next) => {
  try {
    const result = await approveHolidayBooking({ bookingId: req.params.bookingId, body: req.body || {} });
    return res.status(200).json({
      success: true,
      message: "Holiday booking approved successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

export const completeHolidayPayment = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const { bookingId } = req.params;
    const result = await markHolidayBookingPaymentCompleted({ bookingId, user, body: req.body || {} });
    return res.status(200).json({
      success: true,
      message: "Holiday booking payment updated successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
