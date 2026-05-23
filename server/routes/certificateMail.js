import express from "express";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

import Emission from "../models/emissionModel.js";

const router = express.Router();

router.post("/send-certificate", async (req, res) => {

  try {

    const { userId, email, name } = req.body;

    // GET USER DATA
    const data = await Emission
      .find({ userId })
      .sort({ createdAt: -1 });

    if (!data.length) {

      return res.status(404).json({
        success: false,
        message: "No emission data found"
      });

    }

    const current = data[0];

    const previous = data[1] || {
      total: current.total + 5
    };

    /* ---------- CALCULATIONS ---------- */

    let carbonSaved =
      previous.total - current.total;

    if (carbonSaved < 0) {
      carbonSaved = 0;
    }

    const reduction =
      (carbonSaved / previous.total) * 100;

    /* ---------- CREATE PDF ---------- */

    const doc = new PDFDocument();

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {

      const pdfBuffer =
        Buffer.concat(buffers);

      /* ---------- RESEND ---------- */

      const resend =
        new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({

        from:
          "CarbonTrack <onboarding@resend.dev>",

        to: email,

        subject:
          "Your Monthly CarbonTrack Certificate 🌱",

        html: `

          <h2>Hello ${name}</h2>

          <p>
            Congratulations on reducing your carbon footprint.
          </p>

          <p>
            Your sustainability certificate is attached below.
          </p>

        `,

        attachments: [

          {
            filename:
              "CarbonTrack_Certificate.pdf",

            content:
              pdfBuffer.toString("base64")
          }

        ]

      });

      res.json({

        success: true,

        message:
          "Certificate emailed successfully"

      });

    });

    /* ---------- PDF DESIGN ---------- */

    // BORDER
    doc
      .rect(20, 20, 555, 800)
      .stroke("#16a34a");

    // TITLE
    doc
      .fontSize(26)
      .fillColor("green")
      .text(
        "CarbonTrack Sustainability Certificate",
        {
          align: "center"
        }
      );

    doc.moveDown(2);

    // USER NAME
    doc
      .fillColor("black")
      .fontSize(18)
      .text(
        `Presented To: ${name}`,
        {
          align: "center"
        }
      );

    doc.moveDown(2);

    // DETAILS
    doc
      .fontSize(16)
      .text(
        `Carbon Saved: ${carbonSaved.toFixed(2)} kg CO2`
      );

    doc.moveDown();

    doc.text(
      `Reduction Percentage: ${reduction.toFixed(1)}%`
    );

    doc.moveDown();

    doc.text(
      `Points Earned: ${current.points}`
    );

    doc.moveDown();

    doc.text(
      `Level Achieved: ${current.level}`
    );

    doc.moveDown(3);

    // MESSAGE
    doc
      .fontSize(14)
      .text(
        "Thank you for contributing towards a greener future 🌱",
        {
          align: "center"
        }
      );

    doc.moveDown(4);

    // DATE
    doc
      .fontSize(12)
      .text(
        `Issued on: ${new Date().toDateString()}`,
        {
          align: "center"
        }
      );

    doc.end();

  }
  catch (err) {

    console.log("CERTIFICATE ERROR:", err);

    res.status(500).json({

      success: false,

      message:
        "Certificate email failed"

    });

  }

});

export default router;