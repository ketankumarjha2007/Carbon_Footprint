import express from "express";
import Razorpay from "razorpay";

const router = express.Router();

router.post("/order", async (req, res) => {
  try {

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_key_id,
      key_secret: process.env.RAZORPAY_key_secret
    });
    const options = {
      amount: req.body.amount, 
      currency: "INR",
      receipt: "receipt_" + Date.now()
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).send("Order creation failed");
    }

    res.json(order);

  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

export default router;