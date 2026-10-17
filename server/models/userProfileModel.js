import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, default: "User" },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("UserProfile", userProfileSchema);
