import { Router } from "express";
import { approveHolidayBookingRecord, completeHolidayPayment, readHolidayBooking, sendHolidayInvoice, submitHolidayBooking } from "../controllers/holidayBooking.controller.js";

const router = Router();

router.post("/", submitHolidayBooking);
router.get("/:bookingId", readHolidayBooking);
router.post("/:bookingId/payment", completeHolidayPayment);
router.post("/:bookingId/invoice", sendHolidayInvoice);
router.patch("/:bookingId/approve", approveHolidayBookingRecord);

export default router;
