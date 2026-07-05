import { setDriverOnlineStatus } from "../services/driverStatus.service.js";

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

export const updateDriverStatus = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req);
    const result = await setDriverOnlineStatus({ user, status: req.body?.status });
    return res.status(200).json(result);
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
