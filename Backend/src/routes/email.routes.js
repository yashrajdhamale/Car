import { Router } from "express";
import { submitSendEmail } from "../controllers/email.controller.js";

const router = Router();

router.post("/", submitSendEmail);

export default router;
