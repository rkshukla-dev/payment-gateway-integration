import axios from "axios";
import { easebuzzConfig } from "../config/easebuzz.js";
import { generatePaymentHash } from "../utils/easebuzz-hash.js";

export async function initiateEasebuzzPayment(payment) {
  const payload = {
    key: easebuzzConfig.key,
    txnid: payment.txnid,

    // Keep the amount format consistent with the value
    // used to calculate the hash.
    amount: payment.amount.toFixed(2),

    productinfo: payment.productinfo,
    firstname: payment.customer.firstname,
    email: payment.customer.email,
    phone: payment.customer.phone,

    surl: `${process.env.BACKEND_URL}/api/payments/callback`,
    furl: `${process.env.BACKEND_URL}/api/payments/callback`,

    udf1: "",
    udf2: "",
    udf3: "",
    udf4: "",
    udf5: "",
    udf6: "",
    udf7: "",
    udf8: "",
    udf9: "",
    udf10: "",
  };

  payload.hash = generatePaymentHash(payload);

  const body = new URLSearchParams(payload);

  const response = await axios.post(
    easebuzzConfig.paymentUrl,
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 15000,
    }
  );

  const result = response.data;

  if (Number(result.status) !== 1 || !result.data) {
    throw new Error(
      result.error_desc || result.data || "Easebuzz initiation failed"
    );
  }

  return result.data;
}