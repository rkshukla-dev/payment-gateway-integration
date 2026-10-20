import "dotenv/config";

const isProduction = process.env.EASEBUZZ_ENV === 'prod';

export const easebuzzConfig = {
    key: process.env.EASEBUZZ_KEY,
    salt: process.env.EASEBUZZ_SALT,

    // Confirm these base URLs against your merchant
    // dashboard and current Easebuzz documentation.
    paymentUrl: isProduction
        ? "https://pay.easebuzz.in/payment/initiateLink"
        : "https://testpay.easebuzz.in/payment/initiateLink",

    transactionUrl: isProduction
        ? "https://dashboard.easebuzz.in/transaction/v2/retrieve"
        : "https://testdashboard.easebuzz.in/transaction/v2/retrieve",

    isProduction
};

if (!easebuzzConfig.key || !easebuzzConfig.salt) {
  throw new Error("Missing Easebuzz merchant credentials");
}