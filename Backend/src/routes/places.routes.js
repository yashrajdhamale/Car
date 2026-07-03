import { Router } from "express";
import { searchPlaces } from "../controllers/places.controller.js";

const router = Router();

router.get("/", searchPlaces);

export default router;
