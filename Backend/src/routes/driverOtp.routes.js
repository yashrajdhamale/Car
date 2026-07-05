import { Router } from "express";
import {
  submitGenerateRideOtp,
  submitVerifyRideOtp,
} from "../controllers/driverOtp.controller.js";

const router = Router();

router.post("/generate", submitGenerateRideOtp);
router.post("/verify", submitVerifyRideOtp);

export default router;
