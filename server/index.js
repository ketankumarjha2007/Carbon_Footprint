import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import paymentRoutes from "./routes/payment.js";
import contactRoutes from "./routes/contact.js";
dotenv.config({ path: "./server/.env" });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);

app.get("/", (req, res) => {
  res.send("Backend running");
});
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});