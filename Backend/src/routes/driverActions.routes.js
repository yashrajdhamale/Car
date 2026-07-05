import { Router } from "express";
import { acceptLocalRide, sendScheduledConfirmation } from "../controllers/driverActions.controller.js";

const router = Router();
router.post("/scheduled-confirmation", sendScheduledConfirmation);
router.post("/accept-local-ride", acceptLocalRide);

export default router;
