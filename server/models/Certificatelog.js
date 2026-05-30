import mongoose from "mongoose";

const certificateLogSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  month:  { type: Number, required: true }, // 0–11
  year:   { type: Number, required: true },
  tier:   { type: String },
  sentAt: { type: Date, default: Date.now },
});

// One auto-cert per user per month — prevents duplicate sends
certificateLogSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model("CertificateLog", certificateLogSchema);