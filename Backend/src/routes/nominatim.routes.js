import { Router } from "express";
import { reverseGeocode, search } from "../controllers/nominatim.controller.js";

const router = Router();

router.get("/reverse", reverseGeocode);
router.get("/search", search);

export default router;
