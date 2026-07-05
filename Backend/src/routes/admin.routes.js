import { Router } from "express";
import { patchPackageById, readPackageById, readPackages, readSuperAdmin, removePackageById } from "../controllers/admin.controller.js";

const router = Router();

router.get("/super-admin", readSuperAdmin);
router.get("/packages", readPackages);
router.get("/packages/:packageId", readPackageById);
router.patch("/packages/:packageId", patchPackageById);
router.delete("/packages/:packageId", removePackageById);

export default router;
