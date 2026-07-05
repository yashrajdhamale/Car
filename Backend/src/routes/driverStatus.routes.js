import { Router } from "express";
import { updateDriverStatus } from "../controllers/driverStatus.controller.js";

const router = Router();

router.post("/", updateDriverStatus);

export default router;
