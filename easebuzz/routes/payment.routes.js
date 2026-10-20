import { Router } from "express";
import {
  createPayment,
  paymentCallback,
  getPaymentStatus,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/create", createPayment);

// Easebuzz posts its result as form-encoded fields.
router.post("/callback", paymentCallback);

router.get("/status/:txnid", getPaymentStatus);

export default router;