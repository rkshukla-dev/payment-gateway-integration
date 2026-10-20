import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    txnid: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    amount: {
        type: Number,
        requied: true,
        min: 1,
    },
    currency: {
        type: String,
        default: "INR",
    },
    productinfo: {
        type: String,
        required: true,
    },
    customer: {
        firstName: String,
        email: String,
        phone: String,
    },
    status: {
        type: String,
        enum: ["created", "initiated", "pending", "success", "failed", "verification_required"],
        default: "created",
    },
    gateway: {
        type: String,
        default: "easebuzz",
    },
    gatewayPaymentId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,

    verifiedAt: Date,
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);