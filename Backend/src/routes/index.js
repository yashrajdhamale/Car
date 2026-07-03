import { Router } from "express";
import placesRoutes from "./places.routes.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/places", placesRoutes);
router.use("/auth", authRoutes);

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "API is up",
  });
});

export default router;
