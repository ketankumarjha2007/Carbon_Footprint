import express from "express";
import Emission from "../models/emissionModel.js";

const router = express.Router();

/* ================= SAVE EMISSION (FINAL FIXED) ================= */

router.post("/save", async (req, res) => {
  try {
    let { userId, transport, electricity, food, total, aqi } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID required"
      });
    }

    /* ---------------- SAFE NUMBER CONVERSION ---------------- */
    transport = Number(transport) || 0;
    electricity = Number(electricity) || 0;
    food = Number(food) || 0;
    total = Number(total) || 0;

    aqi = Number(aqi);
    if (isNaN(aqi)) aqi = null;

    /* ---------------- REWARD LOGIC ---------------- */

    const avg = 20;

    let carbonSaved = total < avg ? (avg - total) : 0;
    let points = Math.round(carbonSaved * 10);

    // minimum reward safeguard
    if (points <= 0) {
      points = 5;
      carbonSaved = 1;
    }

    let level = "Beginner";
    if (points > 150) level = "Earth Saver";
    else if (points > 80) level = "Green Warrior";
    else if (points > 30) level = "Eco Starter";

    /* ---------------- 🔥 ALWAYS CREATE NEW ENTRY ---------------- */

    const newEmission = new Emission({
      userId,
      transport,
      electricity,
      food,
      total,
      aqi,
      carbonSaved,
      points,
      level
    });

    await newEmission.save();

    /* ---------------- RESPONSE ---------------- */

    res.status(201).json({
      success: true,
      data: {
        carbonSaved,
        points,
        level
      }
    });

  } catch (err) {
    console.error("SAVE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

/* ================= USER TOTAL STATS ================= */

router.get("/stats/:userId", async (req, res) => {
  try {
    const data = await Emission.find({ userId: req.params.userId });

    let totalPoints = 0;
    let totalCarbonSaved = 0;

    data.forEach(item => {
      totalPoints += Number(item.points) || 0;
      totalCarbonSaved += Number(item.carbonSaved) || 0;
    });

    let level = "Beginner";
    if (totalPoints > 2000) level = "Earth Saver";
    else if (totalPoints > 1000) level = "Green Warrior";
    else if (totalPoints > 300) level = "Eco Starter";

    res.status(200).json({
      success: true,
      totalPoints,
      totalCarbonSaved,
      level
    });

  } catch (err) {
    console.error("STATS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching stats"
    });
  }
});

/* ================= GET USER EMISSIONS ================= */

router.get("/:userId", async (req, res) => {
  try {
    const data = await Emission
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching emissions"
    });
  }
});

export default router;