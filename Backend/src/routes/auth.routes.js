import { Router } from "express";
import multer from "multer";
import { loginUser, registerUser, registerDriver, registerAgency, sendPasswordReset, startPhoneLogin, verifyPhoneLogin } from "../controllers/auth.controller.js";
import { handleGoogleCallback, startGoogleAuth } from "../controllers/googleAuth.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


router.post("/register-user", registerUser);
router.post(
  "/register-driver",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "rcBook", maxCount: 1 },
    { name: "signature", maxCount: 1 },
    { name: "vehiclePhotos", maxCount: 6 },
  ]),
  registerDriver
);
router.post(
  "/register-agency",
  upload.fields([
    { name: "selfieFile", maxCount: 1 },
    { name: "profilePhotoFile", maxCount: 1 },
    { name: "companyRegistrationFile", maxCount: 1 },
    { name: "companyPanFile", maxCount: 1 },
  ]),
  registerAgency
);
router.post("/login", loginUser);
router.post("/password-reset", sendPasswordReset);
router.post("/phone/start", startPhoneLogin);
router.post("/phone/verify", verifyPhoneLogin);
router.get("/google/start", startGoogleAuth);
router.get("/google/callback", handleGoogleCallback);

export default router;
