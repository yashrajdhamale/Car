import { Router } from "express";
import {
  patchDriverRoute,
  readCities,
  readDriverRoutes,
  removeDriverRoute,
  submitDriverRoute,
} from "../controllers/routes.controller.js";

const router = Router();

router.get("/", readDriverRoutes);
router.get("/cities", readCities);
router.post("/", submitDriverRoute);
router.patch("/:routeId", patchDriverRoute);
router.delete("/:routeId", removeDriverRoute);

export default router;
