import { sendEmailThroughBackend } from "../services/emailProxy.service.js";

export const submitSendEmail = async (req, res, next) => {
  try {
    const result = await sendEmailThroughBackend(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json(error.data || { success: false, error: error.message });
    }
    next(error);
  }
};
