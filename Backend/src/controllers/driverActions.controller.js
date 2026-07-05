import { proxyCloudFunctionJson } from "../services/cloudFunctionProxy.service.js";

export const sendScheduledConfirmation = async (req, res, next) => {
  try {
    return res.status(200).json(await proxyCloudFunctionJson("sendScheduledConfirmation", req.body || {}));
  } catch (error) {
    if (error?.status) return res.status(error.status).json(error.data || { success: false, error: error.message });
    next(error);
  }
};

export const acceptLocalRide = async (req, res, next) => {
  try {
    return res.status(200).json(await proxyCloudFunctionJson("acceptLocalRide", req.body || {}));
  } catch (error) {
    if (error?.status) return res.status(error.status).json(error.data || { success: false, error: error.message });
    next(error);
  }
};
