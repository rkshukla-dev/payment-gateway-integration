import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";

import paymentRoutes from "./routes/payment.routes.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/api/payments", paymentRoutes);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();