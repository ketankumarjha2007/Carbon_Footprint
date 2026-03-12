import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/send", async (req, res) => {

  const { name, email, message } = req.body;

  try {

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: "New Contact Message",
      text: `
Name: ${name}
Email: ${email}
Message: ${message}
`
    };

    await transporter.sendMail(mailOptions);

    const autoReply = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thanks for contacting CarbonTrack 🌿",
      text: `Hello ${name},

Thank you for contacting CarbonTrack.
We received your message and will reply soon.

Best regards,
CarbonTrack Team`
    };

    await transporter.sendMail(autoReply);

    res.json({ message: "Email sent successfully" });

  } catch (error) {

    console.log("Email error:", error);

    res.status(500).json({ error: error.message });

  }

});

export default router;