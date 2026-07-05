import { Router } from "express";
import { enforceDriverSharing, postCustomerLocation, postDriverLocation, postDriverRidesLocation, postNearbyDrivers, readDriverLocation, readRideTracking } from "../controllers/driverLocation.controller.js";

const router = Router();

router.post("/drivers/:driverId", postDriverLocation);
router.post("/drivers/:driverId/rides", postDriverRidesLocation);
router.get("/drivers/:driverId", readDriverLocation);
router.post("/drivers/:driverId/enforce", enforceDriverSharing);
router.post("/bookings/:bookingId", postCustomerLocation);
router.get("/bookings/:bookingId", readRideTracking);
router.post("/nearby-drivers", postNearbyDrivers);

export default router;
