import { Router } from "express";
import { getDriverIncomingRequests } from "../controllers/debug.controller.js";

const router = Router();

router.get("/driver-incoming-requests/:driverId", getDriverIncomingRequests);

export default router;
