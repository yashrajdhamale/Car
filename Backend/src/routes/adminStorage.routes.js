import { Router } from "express";
import multer from "multer";
import { removePackageImage, uploadPackageImages } from "../controllers/adminStorage.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/packages/:packageId/images", upload.array("images", 10), uploadPackageImages);
router.delete("/packages/images", removePackageImage);

export default router;
