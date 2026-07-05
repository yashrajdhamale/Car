import { Router } from "express";
import { submitAirportPaymentConfirmation } from "../controllers/airportPayment.controller.js";

const router = Router();

router.post("/:bookingId/payment-confirmation", submitAirportPaymentConfirmation);

export default router;
