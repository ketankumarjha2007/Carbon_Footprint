import express from "express";
import { Resend } from "resend";

const router = express.Router();

router.post("/send", async (req, res) => {

  const { name, email, message } = req.body;

  try {
    const resend = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;

    if (!resend) {
      return res.json({
        message: "Email disabled (API key missing)"
      });
    }
    await resend.emails.send({
      from: "CarbonTrack <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      subject: "New Contact Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
    });

    /* USER EMAIL */
    await resend.emails.send({
      from: "CarbonTrack <onboarding@resend.dev>",
      to: email,
      subject: "Thanks for contacting CarbonTrack 🌿",
      text: `Hello ${name},\n\nWe received your message.`
    });

    res.json({ message: "Email sent successfully" });

  } catch (error) {
    console.log("Email error:", error);
    res.status(500).json({ error: "Email failed" });
  }

});

export default router;