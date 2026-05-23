import express from "express";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import Emission from "../models/emissionModel.js";

const router = express.Router();

// ── PALETTE ──────────────────────────────────────────────────────────────────
const DEEP_FOREST  = "#0B2818";
const FOREST       = "#14532D";
const MID_GREEN    = "#166534";
const LEAF         = "#22C55E";
const GOLD         = "#D4A853";
const GOLD_LIGHT   = "#F5D78E";
const GOLD_DARK    = "#A07830";
const CREAM        = "#FDFBF4";
const WARM_GRAY    = "#9CA3AF";
const OFF_WHITE    = "#F0EDE4";

function hexToRGB(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function fillColor(doc, hex, alpha = 1) {
  const [r, g, b] = hexToRGB(hex);
  doc.fillColor([r, g, b], alpha);
}

function strokeColor(doc, hex) {
  const [r, g, b] = hexToRGB(hex);
  doc.strokeColor([r, g, b]);
}

function drawCertificate(doc, { name, monthName, year, previousTotal, currentTotal, carbonSaved, reduction }) {
  const W = 841.89;
  const H = 595.28;

  // 1. Deep background
  fillColor(doc, DEEP_FOREST);
  doc.rect(0, 0, W, H).fill();

  // 2. Radial glow
  fillColor(doc, FOREST, 0.35);
  doc.ellipse(W * 0.5, H * 0.5, 260, 180).fill();
  fillColor(doc, MID_GREEN, 0.15);
  doc.ellipse(W * 0.5, H * 0.5, 180, 130).fill();

  // 3. Outer gold frame
  const margin = 18;
  strokeColor(doc, GOLD);
  doc.lineWidth(2.5).roundedRect(margin, margin, W - 2*margin, H - 2*margin, 12).stroke();
  strokeColor(doc, GOLD_LIGHT);
  const m2 = margin + 7;
  doc.lineWidth(0.6).roundedRect(m2, m2, W - 2*m2, H - 2*m2, 8).stroke();

  // 4. Leaf logo group
  const badge_y = H - 90;
  fillColor(doc, LEAF);
  // Center leaf
  doc.save();
  doc.translate(W/2, badge_y + 18);
  doc.path("M0,14 C10,8 10,-4 0,-10 C-10,-4 -10,8 0,14 Z").fill();
  doc.restore();

  // Brand name
  fillColor(doc, GOLD_LIGHT);
  doc.font("Helvetica-Bold").fontSize(11)
    .text("C A R B O N T R A C K", 0, badge_y - 14, { align: "center", width: W });

  // 5. Horizontal divider
  const div_y = H - 116;
  strokeColor(doc, GOLD);
  doc.lineWidth(0.8).moveTo(80, div_y).lineTo(W - 80, div_y).stroke();
  // diamond
  fillColor(doc, GOLD);
  doc.polygon([W/2, div_y+5], [W/2+4, div_y], [W/2, div_y-5], [W/2-4, div_y]).fill();

  // 6. Title
  fillColor(doc, CREAM);
  doc.font("Times-Roman").fontSize(13)
    .text("C E R T I F I C A T E   O F   S U S T A I N A B I L I T Y", 0, div_y - 28, { align: "center", width: W });

  // 7. "Presented to"
  fillColor(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(10)
    .text("This certificate is proudly presented to", 0, div_y - 56, { align: "center", width: W });

  // 8. Recipient name
  const name_y = div_y - 100;
  const barW = Math.min(Math.max(name.length * 16, 180), 500);
  fillColor(doc, FOREST);
  strokeColor(doc, GOLD);
  doc.lineWidth(0.8).roundedRect(W/2 - barW/2, name_y - 8, barW, 44, 4).fillAndStroke();
  fillColor(doc, GOLD_LIGHT);
  doc.font("Times-BoldItalic").fontSize(34)
    .text(name, 0, name_y + 4, { align: "center", width: W });

  // 9. Achievement text
  const ach_y = name_y - 36;
  fillColor(doc, OFF_WHITE);
  doc.font("Helvetica").fontSize(10)
    .text(`For demonstrating outstanding commitment to environmental responsibility during`, 0, ach_y, { align: "center", width: W })
    .text(`${monthName} ${year} — achieving measurable carbon reduction through sustainable lifestyle choices.`, 0, ach_y - 16, { align: "center", width: W });

  // 10. Stat boxes
  const stats_y = ach_y - 58;
  function statBox(cx, cy, label, value, unit, highlight = false) {
    const bw = 130, bh = 52;
    fillColor(doc, highlight ? MID_GREEN : FOREST);
    strokeColor(doc, highlight ? GOLD : GOLD_DARK);
    doc.lineWidth(highlight ? 1.0 : 0.6)
      .roundedRect(cx - bw/2, cy - bh/2, bw, bh, 6).fillAndStroke();
    fillColor(doc, highlight ? GOLD_LIGHT : WARM_GRAY);
    doc.font("Helvetica").fontSize(7.5).text(label, cx - bw/2, cy + 10, { width: bw, align: "center" });
    fillColor(doc, highlight ? GOLD_LIGHT : CREAM);
    doc.font("Helvetica-Bold").fontSize(18).text(value, cx - bw/2, cy - 6, { width: bw, align: "center" });
    fillColor(doc, highlight ? LEAF : WARM_GRAY);
    doc.font("Helvetica").fontSize(8).text(unit, cx - bw/2, cy - 24, { width: bw, align: "center" });
  }

  statBox(W/2 - 200, stats_y, "PREVIOUS MONTH", `${previousTotal.toFixed(2)}`, "kg CO2");
  statBox(W/2,        stats_y, "CARBON REDUCED", `${carbonSaved.toFixed(2)}`, "kg CO2", true);
  statBox(W/2 + 200,  stats_y, "CURRENT MONTH",  `${currentTotal.toFixed(2)}`, "kg CO2");

  // Reduction badge
  const badge_cx = W/2 + 310, badge_cy = stats_y;
  fillColor(doc, LEAF);
  doc.circle(badge_cx, badge_cy, 28).fill();
  fillColor(doc, DEEP_FOREST);
  doc.font("Helvetica-Bold").fontSize(15).text(`${Math.round(reduction)}%`, badge_cx - 28, badge_cy - 2, { width: 56, align: "center" });
  doc.font("Helvetica").fontSize(7).text("REDUCED", badge_cx - 28, badge_cy - 14, { width: 56, align: "center" });

  // 11. Bottom divider
  const bot_div_y = stats_y - 44;
  strokeColor(doc, GOLD);
  doc.lineWidth(0.7).moveTo(80, bot_div_y).lineTo(W - 80, bot_div_y).stroke();

  // 12. Signature + date
  const sig_y = bot_div_y - 22;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();

  fillColor(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("ISSUED ON", 90, sig_y + 4);
  fillColor(doc, CREAM);
  doc.font("Helvetica-Bold").fontSize(10).text(dateStr, 90, sig_y - 10);
  strokeColor(doc, GOLD_DARK);
  doc.lineWidth(0.5).moveTo(90, sig_y - 15).lineTo(220, sig_y - 15).stroke();

  fillColor(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("AUTHORIZED BY", W - 260, sig_y + 4, { width: 170, align: "right" });
  fillColor(doc, GOLD_LIGHT);
  doc.font("Times-BoldItalic").fontSize(14).text("Ketan Kumar Jha", W - 260, sig_y - 10, { width: 170, align: "right" });
  fillColor(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(8).text("Founder, CarbonTrack", W - 260, sig_y - 22, { width: 170, align: "right" });
  strokeColor(doc, GOLD_DARK);
  doc.lineWidth(0.5).moveTo(W - 240, sig_y - 26).lineTo(W - 90, sig_y - 26).stroke();

  // Cert ID
  const certId = Buffer.from(`${name}${monthName}${year}`).toString("base64").slice(0, 12).toUpperCase();
  fillColor(doc, WARM_GRAY);
  doc.font("Helvetica").fontSize(7).text(`CERTIFICATE ID: CT-${certId}`, 0, sig_y - 18, { align: "center", width: W });
}

router.post("/send-certificate", async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    const data = await Emission.find({ userId }).sort({ createdAt: -1 });

    if (!data.length) return res.status(404).json({ success: false, message: "No emission data found" });

    const now = new Date();
    const currentMonth = now.getMonth(), currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear  = currentMonth === 0 ? currentYear - 1 : currentYear;

    let currentMonthTotal = 0, previousMonthTotal = 0;
    data.forEach(item => {
      const d = new Date(item.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear)   currentMonthTotal  += Number(item.total);
      if (d.getMonth() === previousMonth && d.getFullYear() === previousYear) previousMonthTotal += Number(item.total);
    });

    const carbonSaved = Math.max(previousMonthTotal - currentMonthTotal, 0);
    const reduction   = previousMonthTotal > 0 ? (carbonSaved / previousMonthTotal) * 100 : 0;
    const monthName   = now.toLocaleString("default", { month: "long" });

    // Build PDF
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
    const buffers = [];
    doc.on("data", chunk => buffers.push(chunk));

    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(buffers);
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "CarbonTrack <onboarding@resend.dev>",
        to: email,
        subject: `Your ${monthName} CarbonTrack Sustainability Certificate 🌱`,
        html: `<h2>Hi ${name},</h2><p>Congratulations! Your ${monthName} sustainability certificate is attached.</p>`,
        attachments: [{
          filename: `CarbonTrack_${monthName}_${currentYear}.pdf`,
          content: pdfBuffer.toString("base64"),
          encoding: "base64",
        }],
      });
      res.json({ success: true, message: "Certificate emailed successfully" });
    });

    drawCertificate(doc, {
      name, monthName, year: currentYear,
      previousTotal: previousMonthTotal,
      currentTotal: currentMonthTotal,
      carbonSaved, reduction,
    });
    doc.end();

  } catch (err) {
    console.error("CERTIFICATE ERROR:", err);
    res.status(500).json({ success: false, message: "Certificate email failed" });
  }
});

export default router;