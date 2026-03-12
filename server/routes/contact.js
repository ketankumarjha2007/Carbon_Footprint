import express from "express";
import { Resend } from "resend";

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post("/send", async (req, res) => {

  const { name, email, message } = req.body;

  try {

    await resend.emails.send({
      from: "CarbonTrack <onboarding@resend.dev>",
      to: process.env.EMAIL_USER,
      subject: "New Contact Message",
      text: `
Name: ${name}
Email: ${email}
Message: ${message}
`
    });

    await resend.emails.send({
      from: "CarbonTrack <onboarding@resend.dev>",
      to: email,
      subject: "Thanks for contacting CarbonTrack 🌿",
      text: `Hello ${name},

Thank you for contacting CarbonTrack.
We received your message and will reply soon.

Best regards,
CarbonTrack Team`
    });

    res.json({ message: "Email sent successfully" });

  } catch (error) {

    console.log(error);
    res.status(500).json({ error: "Email failed" });

  }

});

export default router;