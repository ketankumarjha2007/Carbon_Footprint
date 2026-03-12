import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";

import paymentRoutes from "./routes/payment.js";
import contactRoutes from "./routes/contact.js";
import emissionRoutes from "./routes/emission.js";
import trackerRoutes from "./routes/trackerRoutes.js";
import readBill from "./routes/readbill.js";

dotenv.config({ path: "./server/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------- Middleware ---------- */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Serve uploaded bill images */

app.use("/uploads", express.static("uploads"));

/* ---------- Routes ---------- */

app.get("/", (req, res) => {
  res.send("Backend running successfully ");
});

app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/emission", emissionRoutes);
app.use("/api/tracker", trackerRoutes);

/* OCR Electricity Bill Route */

app.use("/api", readBill);

/* ---------- Database Connection ---------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");

    app.listen(PORT, () => {
      console.log(`console.log Server running on port ${PORT};`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });