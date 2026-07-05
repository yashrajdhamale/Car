import { Router } from "express";
import { getAirportBooking, searchAirportDriver, submitAirportBooking } from "../controllers/airportBooking.controller.js";
import { submitAirportLocationUpdate, submitAirportPaymentConfirmation } from "../controllers/airportPayment.controller.js";

const router = Router();

router.post("/", submitAirportBooking);
router.get("/:bookingId", getAirportBooking);
router.post("/:bookingId/search-driver", searchAirportDriver);
router.post("/:bookingId/payment-confirmation", submitAirportPaymentConfirmation);
router.post("/:bookingId/location", submitAirportLocationUpdate);

export default router;
