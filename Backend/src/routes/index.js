import { Router } from "express";
import placesRoutes from "./places.routes.js";
import nominatimRoutes from "./nominatim.routes.js";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import holidayRoutes from "./holiday.routes.js";
import airportRoutes from "./airport.routes.js";
import outstationRoutes from "./outstation.routes.js";
import localPickupRoutes from "./localPickup.routes.js";
import driverOtpRoutes from "./driverOtp.routes.js";
import driverActionsRoutes from "./driverActions.routes.js";
import emailRoutes from "./email.routes.js";
import routesRoutes from "./routes.routes.js";
import driverStatusRoutes from "./driverStatus.routes.js";
import driverLocationRoutes from "./driverLocation.routes.js";
import outstationInvoiceRoutes from "./outstationInvoice.routes.js";
import adminRoutes from "./admin.routes.js";
import adminStorageRoutes from "./adminStorage.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/places", placesRoutes);
router.use("/nominatim", nominatimRoutes);
router.use("/auth", authRoutes);
router.use("/holiday-bookings", holidayRoutes);
router.use("/airport-bookings", airportRoutes);
router.use("/outstation-bookings", outstationRoutes);
router.use("/local-pickups", localPickupRoutes);
router.use("/driver-otp", driverOtpRoutes);
router.use("/driver-actions", driverActionsRoutes);
router.use("/email", emailRoutes);
router.use("/routes", routesRoutes);
router.use("/driver-status", driverStatusRoutes);
router.use("/driver-location", driverLocationRoutes);
router.use("/outstation-invoice", outstationInvoiceRoutes);
router.use("/admin", adminRoutes);
router.use("/admin-storage", adminStorageRoutes);

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "API is up",
  });
});

export default router;
