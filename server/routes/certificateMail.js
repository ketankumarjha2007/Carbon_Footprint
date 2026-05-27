import express from "express";
import PDFDocument from "pdfkit";
import SibApiV3Sdk from "sib-api-v3-sdk";
import crypto from "crypto";
import Emission from "../models/emissionModel.js";

const router = express.Router();
const DEEP_FOREST = "#0B2818";
const FOREST = "#14532D";
const MID_GREEN = "#166534";
const LEAF = "#22C55E";
const GOLD = "#D4A853";
const GOLD_LIGHT = "#F5D78E";
const GOLD_DARK = "#A07830";
const CREAM = "#FDFBF4";
const WARM_GRAY = "#9CA3AF";
const OFF_WHITE = "#F0EDE4";

function fc(doc, hex, alpha = 1) { doc.fillColor(hex, alpha); }
function sc(doc, hex) { doc.strokeColor(hex); }

function diamond(doc, cx, cy, size = 4) {
  fc(doc, GOLD);
  doc.polygon([cx, cy - size], [cx + size, cy], [cx, cy + size], [cx - size, cy]).fill();
}

function cornerArc(doc, cx, cy, scaleX = 1, scaleY = 1) {
  doc.save();
  doc.translate(cx, cy).scale(scaleX, scaleY);
  sc(doc, GOLD); doc.lineWidth(1.2).path("M 0 22 A 22 22 0 0 1 22 0").stroke();
  sc(doc, GOLD_DARK); doc.lineWidth(0.5).path("M 0 14 A 14 14 0 0 1 14 0").stroke();
  doc.restore();
}

function statBox(doc, cx, cy, label, value, unit, highlight = false) {
  const bw = 134, bh = 58;
  const x = cx - bw / 2, y = cy - bh / 2;

  fc(doc, highlight ? MID_GREEN : FOREST);
  sc(doc, highlight ? GOLD : GOLD_DARK);
  doc.lineWidth(highlight ? 1.0 : 0.6).roundedRect(x, y, bw, bh, 6).fillAndStroke();

  fc(doc, highlight ? GOLD_LIGHT : WARM_GRAY);
  doc.font("Helvetica").fontSize(7.5).text(unit, x, y + 8, { width: bw, align: "center" });

  fc(doc, highlight ? GOLD_LIGHT : CREAM);
  doc.font("Helvetica-Bold").fontSize(21).text(value, x, y + 18, { width: bw, align: "center" });

  fc(doc, highlight ? LEAF : WARM_GRAY);
  doc.font("Helvetica").fontSize(7.5).text(label, x, y + bh - 16, { width: bw, align: "center" });
}
function drawCertificate(doc, { name, monthName, year, previousTotal, currentTotal, carbonSaved, reduction }) {
  const W = 841.89, H = 595.28;

  // 1. Background
  fc(doc, DEEP_FOREST);
  doc.rect(0, 0, W, H).fill();

  // 2. Center glow
  fc(doc, FOREST, 0.55);
  doc.ellipse(W / 2, H / 2, 300, 210).fill();
  fc(doc, MID_GREEN, 0.22);
  doc.ellipse(W / 2, H / 2, 180, 130).fill();

  // 3. Double gold border
  const mg = 18;
  sc(doc, GOLD); doc.lineWidth(2.5).roundedRect(mg, mg, W - 2 * mg, H - 2 * mg, 12).stroke();
  sc(doc, GOLD_LIGHT); doc.lineWidth(0.6).roundedRect(mg + 7, mg + 7, W - 2 * (mg + 7), H - 2 * (mg + 7), 8).stroke();

  // 4. Corner ornaments
  cornerArc(doc, mg + 4, mg + 4, 1, 1);
  cornerArc(doc, W - mg - 4, mg + 4, -1, 1);
  cornerArc(doc, mg + 4, H - mg - 4, 1, -1);
  cornerArc(doc, W - mg - 4, H - mg - 4, -1, -1);

  // 5. Logo + brand
  const logoTop = 44;
  fc(doc, LEAF);
  doc.save();
  doc.translate(W / 2, logoTop);
  doc.path("M0,0 C16,6 16,20 0,28 C-16,20 -16,6 0,0 Z").fill();
  sc(doc, MID_GREEN); doc.lineWidth(0.8).moveTo(0, 0).lineTo(0, 28).stroke();
  doc.restore();

  fc(doc, GOLD_LIGHT);
  doc.font("Helvetica-Bold").fontSize(12)
    .text("C A R B O N T R A C K", 0, logoTop + 34, { width: W, align: "center" });

  // 6. Divider #1
  const d1y = 104;
  sc(doc, GOLD); doc.lineWidth(0.8).moveTo(90, d1y).lineTo(W - 90, d1y).stroke();
  diamond(doc, W / 2, d1y);

  // 7. Title
  fc(doc, CREAM);
  doc.font("Times-Roman").fontSize(14)
    .text("C E R T I F I C A T E   O F   S U S T A I N A B I L I T Y", 0, d1y + 14, { width: W, align: "center" });

  // 8. Presented to
  fc(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(10)
    .text("This certificate is proudly presented to", 0, d1y + 38, { width: W, align: "center" });

  // 9. Name box
  const nameBoxTop = d1y + 60;
  const barW = Math.min(Math.max(name.length * 17, 200), 520);
  const barH = 46;
  fc(doc, FOREST); sc(doc, GOLD); doc.lineWidth(1)
    .roundedRect(W / 2 - barW / 2, nameBoxTop, barW, barH, 5).fillAndStroke();
  fc(doc, GOLD_LIGHT);
  doc.font("Times-BoldItalic").fontSize(30)
    .text(name, W / 2 - barW / 2, nameBoxTop + 8, { width: barW, align: "center" });

  // 10. Achievement text
  const achY = nameBoxTop + barH + 18;
  fc(doc, OFF_WHITE);
  doc.font("Helvetica").fontSize(10)
    .text("For demonstrating outstanding commitment to environmental responsibility during", 0, achY, { width: W, align: "center" })
    .text(`${monthName} ${year} — achieving measurable carbon reduction through sustainable lifestyle choices.`, 0, achY + 16, { width: W, align: "center" });

  // 11. Stat boxes
  const statsCY = achY + 72;
  statBox(doc, W / 2 - 200, statsCY, "PREVIOUS MONTH", previousTotal.toFixed(2), "kg CO2");
  statBox(doc, W / 2, statsCY, "CARBON REDUCED", carbonSaved.toFixed(2), "kg CO2", true);
  statBox(doc, W / 2 + 200, statsCY, "CURRENT MONTH", currentTotal.toFixed(2), "kg CO2");

  // % badge
  const bx = W / 2 + 318;
  fc(doc, LEAF);
  doc.circle(bx, statsCY, 30).fill();
  fc(doc, DEEP_FOREST);
  doc.font("Helvetica-Bold").fontSize(16)
    .text(`${Math.round(reduction)}%`, bx - 30, statsCY - 12, { width: 60, align: "center" });
  doc.font("Helvetica").fontSize(7.5)
    .text("REDUCED", bx - 30, statsCY + 8, { width: 60, align: "center" });

  // 12. Divider #2
  const d2y = statsCY + 46;
  sc(doc, GOLD); doc.lineWidth(0.7).moveTo(80, d2y).lineTo(W - 80, d2y).stroke();
  diamond(doc, W / 2, d2y);

  // 13. Footer
  const fy = d2y + 18;

  // Left — issued date
  fc(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("ISSUED ON", 90, fy);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();
  fc(doc, CREAM);
  doc.font("Helvetica-Bold").fontSize(11).text(dateStr, 90, fy + 13);
  sc(doc, GOLD_DARK); doc.lineWidth(0.5).moveTo(90, fy + 30).lineTo(245, fy + 30).stroke();

  // Center — certificate ID
  const certId = crypto.createHash("md5").update(`${name}${monthName}${year}`).digest("hex").slice(0, 12).toUpperCase();
  fc(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(7.5)
    .text(`CERTIFICATE ID: CT-${certId}`, 0, fy + 18, { width: W, align: "center" });

  // Right — authorized by
  fc(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("AUTHORIZED BY", W - 260, fy, { width: 170, align: "right" });
  fc(doc, GOLD_LIGHT);
  doc.font("Times-BoldItalic").fontSize(16).text("Ketan Kumar Jha", W - 260, fy + 12, { width: 170, align: "right" });
  fc(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("Founder, CarbonTrack", W - 260, fy + 30, { width: 170, align: "right" });
  sc(doc, GOLD_DARK); doc.lineWidth(0.5).moveTo(W - 255, fy + 42).lineTo(W - 90, fy + 42).stroke();

  // 14. Watermark
  doc.save();
  fc(doc, FOREST, 0.055);
  doc.font("Helvetica-Bold").fontSize(80)
    .text("CARBONTRACK", 0, H / 2 - 40, { width: W, align: "center" });
  doc.restore();
}
router.post("/send-certificate", async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    // Validate required fields
    if (!userId || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, email, or name",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address provided",
      });
    }

    // Fetch emission data
    const data = await Emission.find({ userId }).sort({ createdAt: -1 });
    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "No emission data found for this user",
      });
    }

    // Calculate monthly totals
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthTotal = 0, previousMonthTotal = 0;
    data.forEach(item => {
      const d = new Date(item.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) currentMonthTotal += Number(item.total);
      if (d.getMonth() === previousMonth && d.getFullYear() === previousYear) previousMonthTotal += Number(item.total);
    });

    const carbonSaved = Math.max(previousMonthTotal - currentMonthTotal, 0);
    const reduction = previousMonthTotal > 0 ? (carbonSaved / previousMonthTotal) * 100 : 0;
    const monthName = now.toLocaleString("default", { month: "long" });

    // Build PDF
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
    const buffers = [];
    doc.on("data", chunk => buffers.push(chunk));

    await new Promise((resolve, reject) => {
      doc.on("end", resolve);
      doc.on("error", reject);
      drawCertificate(doc, {
        name,
        monthName,
        year: currentYear,
        previousTotal: previousMonthTotal,
        currentTotal: currentMonthTotal,
        carbonSaved,
        reduction,
      });
      doc.end();
    });

    const pdfBuffer = Buffer.concat(buffers);
    const pdfBase64 = pdfBuffer.toString("base64");
    const defaultClient = SibApiV3Sdk.ApiClient.instance;

    const apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = { name: "CarbonTrack", email: process.env.SENDER_EMAIL }; // your verified Gmail in Brevo
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.subject = `Your ${monthName} CarbonTrack Sustainability Certificate 🌱`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #14532D;">Hi ${name}, 🌱</h2>
        <p>Congratulations on your commitment to sustainability!</p>
        <p>Your <strong>${monthName} ${currentYear}</strong> CarbonTrack Sustainability Certificate is attached.</p>
        ${carbonSaved > 0
        ? `<p>You reduced your carbon footprint by <strong>${carbonSaved.toFixed(2)} kg CO₂</strong> 
             compared to last month — a <strong>${Math.round(reduction)}% reduction</strong>. Excellent work!</p>`
        : `<p>Keep tracking your emissions to see your progress next month!</p>`
      }
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">— The CarbonTrack Team</p>
      </div>
    `;
    sendSmtpEmail.attachment = [{
      name: `CarbonTrack_${monthName}_${currentYear}.pdf`,
      content: pdfBase64,
    }];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    res.json({
      success: true,
      message: `Certificate emailed successfully to ${email}`,
    });

  } catch (err) {
    console.error("CERTIFICATE ERROR:", err);
    res.status(500).json({
      success: false,
      message: err?.message || "Certificate email failed",
    });
  }
});

export default router;