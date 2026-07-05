import { Router } from "express";
import { submitOutstationInvoice } from "../controllers/outstationInvoice.controller.js";

const router = Router();

router.post("/", submitOutstationInvoice);

export default router;
