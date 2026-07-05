import { Router } from "express";
import { autosuggest, reverseGeocode, searchPlaces } from "../controllers/places.controller.js";

const router = Router();

router.get("/", searchPlaces);
router.get("/reverse-geocode", reverseGeocode);
router.get("/autosuggest", autosuggest);

export default router;
