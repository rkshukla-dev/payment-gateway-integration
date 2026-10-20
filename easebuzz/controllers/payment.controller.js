import crypto from "node:crypto";
import Payment from "../models/Payment.js";
import { initiateEasebuzzPayment } from "../services/easebuzz.service.js";
import { verifyResponseHash } from "../utils/easebuzz-hash.js";

const frontendUrl = process.env.FRONTEND_URL;

export async function createPayment(req, res) {
  try {
    const { amount, firstname, email, phone, productinfo } = req.body;

    // Demo validation only. In a business application,
    // derive the amount and product from a trusted invoice.
    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 1 ||
      parsedAmount > 1000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    if (
      !firstname?.trim() ||
      !email?.trim() ||
      !/^\d{10}$/.test(phone ?? "") ||
      !productinfo?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid customer and product details are required",
      });
    }

    const txnid = `EB${Date.now()}${crypto
      .randomBytes(4)
      .toString("hex")}`;

    const payment = await Payment.create({
      txnid,
      amount: Number(parsedAmount.toFixed(2)),
      productinfo: productinfo.trim(),
      customer: {
        firstname: firstname.trim(),
        email: email.trim(),
        phone,
      },
      status: "created",
    });

    try {
      const checkout = await initiateEasebuzzPayment(payment);

      payment.status = "initiated";
      await payment.save();

      return res.status(201).json({
        success: true,
        txnid,
        access_key: checkout,
      });
    } catch (error) {
      payment.status = "verification_required";
      await payment.save();

      console.error(
        "Easebuzz initiation error:",
        error.response?.data ?? error.message
      );

      return res.status(502).json({
        success: false,
        txnid,
        message:
          "Could not confirm payment initiation. Check transaction status before retrying.",
      });
    }
  } catch (error) {
    console.error("Create payment error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment",
    });
  }
}

export async function paymentCallback(req, res) {
  try {
    const data = req.body;

    const payment = await Payment.findOne({ txnid: data.txnid });

    if (!payment) {
      return res.status(404).send("Unknown transaction");
    }

    // Reject tampered or unverifiable gateway responses.
    if (!verifyResponseHash(data)) {
      return res.status(400).send("Invalid payment response signature");
    }

    // Check the amount and transaction identity too.
    if (
      Number(data.amount) !== payment.amount ||
      String(data.txnid) !== payment.txnid
    ) {
      return res.status(400).send("Payment details do not match");
    }

    // Never downgrade an already verified successful payment.
    if (payment.status !== "success") {
      if (String(data.status).toLowerCase() === "success") {
        // This callback signature check is necessary, but for a
        // production implementation also retrieve and verify the
        // transaction status directly with Easebuzz before fulfillment.
        payment.status = "verification_required";
      } else {
        const status = String(data.status).toLowerCase();

        payment.status =
          status === "failure" || status === "failed"
            ? "failed"
            : "pending";
      }

      payment.gatewayPaymentId = data.easepayid
        ? String(data.easepayid)
        : undefined;

      // Store only selected non-sensitive fields, not the full payload.
      payment.gatewayResponse = {
        status: data.status,
        txnid: data.txnid,
        amount: data.amount,
        easepayid: data.easepayid,
      };

      await payment.save();
    }

    const resultUrl = new URL("/payment-result.html", frontendUrl);
    resultUrl.searchParams.set("txnid", payment.txnid);

    return res.redirect(303, resultUrl.toString());
  } catch (error) {
    console.error("Payment callback error:", error.message);
    return res.status(500).send("Unable to process payment response");
  }
}

export async function getPaymentStatus(req, res) {
  try {
    const payment = await Payment.findOne({
      txnid: req.params.txnid,
    }).select("txnid amount currency status createdAt verifiedAt");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.json({
      success: true,
      payment,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment status",
    });
  }
}