import {
  generateDriverRideOtp,
  verifyDriverRideOtp,
} from "../services/driverOtp.service.js";

export const submitGenerateRideOtp = async (req, res, next) => {
  try {
    const result = await generateDriverRideOtp(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json(error.data || { success: false, error: error.message });
    }
    next(error);
  }
};

export const submitVerifyRideOtp = async (req, res, next) => {
  try {
    const result = await verifyDriverRideOtp(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json(error.data || { success: false, error: error.message });
    }
    next(error);
  }
};
