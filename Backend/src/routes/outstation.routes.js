import { Router } from "express";
import { submitOutstationBooking } from "../controllers/outstationBooking.controller.js";

const router = Router();

router.post("/", submitOutstationBooking);

export default router;
