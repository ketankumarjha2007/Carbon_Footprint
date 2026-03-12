import express from "express";
import Emission from "../models/emissionModel.js";

const router = express.Router();

router.post("/save", async (req, res) => {

  try {

    const { userId, transport, electricity, food, total } = req.body;

    const newEmission = new Emission({
      userId,
      transport,
      electricity,
      food,
      total
    });

    await newEmission.save();

    res.status(201).json({
      success: true,
      message: "Emission saved successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }

});


// GET USER EMISSIONS
router.get("/:userId", async (req, res) => {

  try {

    const data = await Emission
      .find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Error fetching emissions"
    });

  }

});

export default router;