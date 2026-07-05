import { Router } from "express";
import {
  patchLocalPickupRide,
  proxyCalculateDistance,
  proxyResolveELoc,
  proxyReverseGeocode,
  proxySearchPlaces,
  readLocalPickupRide,
  submitLocalPickupInvoice,
  submitLocalPickupRide,
} from "../controllers/localPickup.controller.js";

const router = Router();

router.get("/search", proxySearchPlaces);
router.get("/reverse-geocode", proxyReverseGeocode);
router.post("/resolve-eloc", proxyResolveELoc);
router.post("/distance", proxyCalculateDistance);
router.post("/rides", submitLocalPickupRide);
router.get("/rides/:rideId", readLocalPickupRide);
router.patch("/rides/:rideId", patchLocalPickupRide);
router.post("/rides/:rideId/invoice", submitLocalPickupInvoice);

export default router;
