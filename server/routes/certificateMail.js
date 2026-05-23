import express from "express";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

import Emission from "../models/emissionModel.js";

const router = express.Router();

router.post("/send-certificate", async (req, res) => {

  try {

    const { userId, email, name } = req.body;

    // FETCH USER DATA
    const data = await Emission
      .find({ userId })
      .sort({ createdAt: -1 });

    if (!data.length) {

      return res.status(404).json({
        success: false,
        message: "No emission data found"
      });

    }

    /* ---------- MONTHLY CALCULATION ---------- */

    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const previousMonth =
      currentMonth === 0 ? 11 : currentMonth - 1;

    const previousYear =
      currentMonth === 0
        ? currentYear - 1
        : currentYear;

    let currentMonthTotal = 0;
    let previousMonthTotal = 0;

    data.forEach((item) => {

      const date = new Date(item.createdAt);

      const month = date.getMonth();
      const year = date.getFullYear();

      if (
        month === currentMonth &&
        year === currentYear
      ) {

        currentMonthTotal += Number(item.total);

      }

      if (
        month === previousMonth &&
        year === previousYear
      ) {

        previousMonthTotal += Number(item.total);

      }

    });

    let carbonSaved =
      previousMonthTotal - currentMonthTotal;

    if (carbonSaved < 0) {
      carbonSaved = 0;
    }

    const reduction =
      previousMonthTotal > 0
        ? (
            (carbonSaved / previousMonthTotal) * 100
          )
        : 0;

    const monthName =
      now.toLocaleString("default", {
        month: "long"
      });

    /* ---------- PDF ---------- */

    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4"
    });

    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));

    doc.on("end", async () => {

      const pdfBuffer = Buffer.concat(buffers);

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
            Your CarbonTrack sustainability certificate
            is attached below.
          </p>

        `,

        attachments: [

          {
            filename:
              "CarbonTrack_Certificate.pdf",

            content:
              pdfBuffer.toString("base64"),

            encoding: "base64"
          }

        ]

      });

      res.json({

        success: true,

        message:
          "Certificate emailed successfully"

      });

    });

    /* ---------- CERTIFICATE DESIGN ---------- */

    // BACKGROUND BORDER
    doc
      .roundedRect(20, 20, 800, 550, 20)
      .stroke("#d1d5db");

    // LOGO TEXT
    doc
      .fontSize(18)
      .fillColor("#166534")
      .text(
        "🌱 CarbonTrack",
        0,
        60,
        {
          align: "center"
        }
      );

    // MAIN TITLE
    doc
      .fontSize(36)
      .fillColor("black")
      .text(
        "Certificate of Sustainability",
        0,
        130,
        {
          align: "center"
        }
      );

    // RIBBON
    doc
      .rect(250, 210, 340, 45)
      .fill("#111827");

    doc
      .fillColor("white")
      .fontSize(18)
      .text(
        "Monthly Carbon Reduction Achievement",
        0,
        224,
        {
          align: "center"
        }
      );

    // PRESENTED TO
    doc
      .fillColor("#6b7280")
      .fontSize(16)
      .text(
        "PRESENTED TO",
        0,
        310,
        {
          align: "center"
        }
      );

    // USER NAME
    doc
      .fillColor("#166534")
      .fontSize(34)
      .text(
        name,
        0,
        355,
        {
          align: "center"
        }
      );

    // LINE
    doc
      .moveTo(180, 410)
      .lineTo(660, 410)
      .stroke("#9ca3af");

    // DESCRIPTION
    doc
      .fillColor("black")
      .fontSize(15)
      .text(
        `This certificate is proudly awarded for reducing carbon emissions during ${monthName} ${currentYear} through sustainable lifestyle choices and environmental responsibility.`,
        170,
        440,
        {
          align: "center",
          width: 500
        }
      );

    // STATS
    doc
      .fontSize(16)
      .text(
        `Previous Month Consumption: ${previousMonthTotal.toFixed(2)} kg CO2`,
        250,
        520
      );

    doc.text(
      `Current Month Consumption: ${currentMonthTotal.toFixed(2)} kg CO2`,
      250,
      550
    );

    doc
      .fillColor("#15803d")
      .fontSize(18)
      .text(
        `Carbon Reduced: ${carbonSaved.toFixed(2)} kg CO2`,
        250,
        580
      );

    // DATE
    doc
      .fillColor("black")
      .fontSize(13)
      .text(
        `Issued on: ${new Date().toDateString()}`,
        70,
        690
      );

    // SIGNATURE
    doc
      .fontSize(24)
      .text(
        "Ketan Kumar Jha",
        620,
        650
      );

    doc
      .fontSize(13)
      .text(
        "Founder, CarbonTrack",
        650,
        685
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