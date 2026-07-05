import { sendOutstationInvoice } from "../services/outstationInvoice.service.js";

export const submitOutstationInvoice = async (req, res, next) => {
  try {
    const result = await sendOutstationInvoice({ body: req.body || {} });
    return res.status(200).json({
      success: true,
      message: "Outstation invoice sent successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
