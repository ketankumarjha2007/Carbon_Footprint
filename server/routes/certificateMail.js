import express from "express";
import PDFDocument from "pdfkit";
import SibApiV3Sdk from "sib-api-v3-sdk";
import crypto from "crypto";
import Emission from "../models/emissionModel.js";
import CertificateLog from "../models/certificateLogModel.js";

const router = express.Router();
const TIERS = {
  bronze: {
    name: "Bronze",
    minReduction: 1,
    maxReduction: 10,
    emoji: "🥉",  
    pdfMedal: "BRONZE",
    tagline: "Every step counts — your journey has begun.",
    bg: "#1A0F00",
    glow1: "#3D1F00",
    glow2: "#5C2E00",
    border1: "#CD7F32",
    border2: "#E8A96E",
    borderDark: "#8B4513",
    accent: "#CD7F32",
    accentLight: "#F0C080",
    statBg: "#3D1F00",
    statBorder: "#8B4513",
    statHighBg: "#5C2E00",
    statHighBorder: "#CD7F32",
    leafColor: "#E8A96E",
    badgeColor: "#CD7F32",
    badgeBg: "#3D1F00",
    starCount: 2,
  },
  silver: {
    name: "Silver",
    minReduction: 10,
    maxReduction: 25,
    emoji: "🥈",
    pdfMedal: "SILVER",
    tagline: "Impressive progress — sustainability is your habit.",
    bg: "#0D0D0F",
    glow1: "#1A1A2E",
    glow2: "#16213E",
    border1: "#A8A8B3",
    border2: "#D4D4DC",
    borderDark: "#6B6B78",
    accent: "#C0C0C8",
    accentLight: "#E8E8F0",
    statBg: "#1A1A2E",
    statBorder: "#6B6B78",
    statHighBg: "#16213E",
    statHighBorder: "#A8A8B3",
    leafColor: "#D4D4DC",
    badgeColor: "#C0C0C8",
    badgeBg: "#1A1A2E",
    starCount: 3,
  },
  gold: {
    name: "Gold",
    minReduction: 25,
    maxReduction: 50,
    emoji: "🥇",
    pdfMedal: "GOLD",
    tagline: "Outstanding achievement — you are a climate champion.",
    bg: "#0B2818",
    glow1: "#14532D",
    glow2: "#166534",
    border1: "#D4A853",
    border2: "#F5D78E",
    borderDark: "#A07830",
    accent: "#D4A853",
    accentLight: "#F5D78E",
    statBg: "#14532D",
    statBorder: "#A07830",
    statHighBg: "#166534",
    statHighBorder: "#D4A853",
    leafColor: "#22C55E",
    badgeColor: "#D4A853",
    badgeBg: "#14532D",
    starCount: 4,
  },
  platinum: {
    name: "Platinum",
    minReduction: 50,
    maxReduction: Infinity,
    emoji: "💎",
    pdfMedal: "PLATINUM",
    tagline: "Extraordinary — you are redefining what's possible.",
    bg: "#050B14",
    glow1: "#0A1628",
    glow2: "#0D1F3C",
    border1: "#8ECAE6",
    border2: "#CAF0F8",
    borderDark: "#4A90B8",
    accent: "#8ECAE6",
    accentLight: "#CAF0F8",
    statBg: "#0A1628",
    statBorder: "#4A90B8",
    statHighBg: "#0D1F3C",
    statHighBorder: "#8ECAE6",
    leafColor: "#90E0EF",
    badgeColor: "#8ECAE6",
    badgeBg: "#0A1628",
    starCount: 5,
  },
};
function getTier(reduction) {
  if (reduction >= 50) return TIERS.platinum;
  if (reduction >= 25) return TIERS.gold;
  if (reduction >= 10) return TIERS.silver;
  if (reduction >= 1)  return TIERS.bronze;
  return null;
}
function fc(doc, hex, alpha = 1) { doc.fillColor(hex, alpha); }
function sc(doc, hex) { doc.strokeColor(hex); }

function diamond(doc, cx, cy, color, size = 4) {
  fc(doc, color);
  doc.polygon([cx, cy - size], [cx + size, cy], [cx, cy + size], [cx - size, cy]).fill();
}

function cornerArc(doc, cx, cy, scaleX, scaleY, t) {
  doc.save();
  doc.translate(cx, cy).scale(scaleX, scaleY);
  sc(doc, t.border1); doc.lineWidth(1.5).path("M 0 26 A 26 26 0 0 1 26 0").stroke();
  sc(doc, t.borderDark); doc.lineWidth(0.6).path("M 0 16 A 16 16 0 0 1 16 0").stroke();
  doc.restore();
}

// Stars drawn as filled polygons — no emoji needed
function drawStar(doc, cx, cy, r, color) {
  const points = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push([cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle)]);
    points.push([cx + (r * 0.4) * Math.cos(innerAngle), cy + (r * 0.4) * Math.sin(innerAngle)]);
  }
  fc(doc, color);
  doc.polygon(...points).fill();
}

function tierStars(doc, cx, cy, t) {
  const count = t.starCount;
  const spacing = 20;
  const startX = cx - ((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    drawStar(doc, startX + i * spacing, cy, 6, t.accent);
  }
}

// Stat box with "CO2" text (no Unicode subscript — Helvetica can't render it)
function statBox(doc, cx, cy, label, value, highlight, t) {
  const bw = 134, bh = 60;
  const x = cx - bw / 2, y = cy - bh / 2;

  fc(doc, highlight ? t.statHighBg : t.statBg);
  sc(doc, highlight ? t.statHighBorder : t.statBorder);
  doc.lineWidth(highlight ? 1.2 : 0.6).roundedRect(x, y, bw, bh, 6).fillAndStroke();

  // "kg CO2" — plain ASCII, no Unicode subscript
  fc(doc, t.accentLight, 0.7);
  doc.font("Helvetica").fontSize(7.5).text("kg CO2", x, y + 9, { width: bw, align: "center" });

  fc(doc, highlight ? t.accentLight : "#F0EDE4");
  doc.font("Helvetica-Bold").fontSize(21).text(value, x, y + 20, { width: bw, align: "center" });

  fc(doc, highlight ? t.accent : "#9CA3AF");
  doc.font("Helvetica").fontSize(7.5).text(label, x, y + bh - 15, { width: bw, align: "center" });
}

function drawCertificate(doc, { name, monthName, year, previousTotal, currentTotal, carbonSaved, reduction, tier }) {
  const W = 841.89, H = 595.28;
  const t = tier;

  // 1. Background
  fc(doc, t.bg);
  doc.rect(0, 0, W, H).fill();

  // 2. Center glow layers
  fc(doc, t.glow1, 0.6);
  doc.ellipse(W / 2, H / 2, 320, 230).fill();
  fc(doc, t.glow2, 0.3);
  doc.ellipse(W / 2, H / 2, 200, 145).fill();

  // 3. Platinum shimmer
  if (t.name === "Platinum") {
    fc(doc, "#0A2444", 0.4);
    doc.ellipse(W * 0.25, H * 0.25, 180, 120).fill();
    fc(doc, "#0A2444", 0.3);
    doc.ellipse(W * 0.75, H * 0.75, 180, 120).fill();
  }

  // 4. Double border
  const mg = 18;
  sc(doc, t.border1); doc.lineWidth(2.5).roundedRect(mg, mg, W - 2 * mg, H - 2 * mg, 12).stroke();
  sc(doc, t.border2); doc.lineWidth(0.6).roundedRect(mg + 7, mg + 7, W - 2 * (mg + 7), H - 2 * (mg + 7), 8).stroke();

  // 5. Corner ornaments
  cornerArc(doc, mg + 4, mg + 4, 1, 1, t);
  cornerArc(doc, W - mg - 4, mg + 4, -1, 1, t);
  cornerArc(doc, mg + 4, H - mg - 4, 1, -1, t);
  cornerArc(doc, W - mg - 4, H - mg - 4, -1, -1, t);

  // 6. Logo leaf (drawn as path — no emoji)
  const logoTop = 42;
  fc(doc, t.leafColor);
  doc.save();
  doc.translate(W / 2, logoTop);
  doc.path("M0,0 C16,6 16,22 0,30 C-16,22 -16,6 0,0 Z").fill();
  sc(doc, t.glow2); doc.lineWidth(0.8).moveTo(0, 0).lineTo(0, 30).stroke();
  doc.restore();

  // 7. Brand name
  fc(doc, t.accentLight);
  doc.font("Helvetica-Bold").fontSize(12)
    .text("C A R B O N T R A C K", 0, logoTop + 36, { width: W, align: "center" });

  // 8. Tier badge pill — uses pdfMedal (text only, no emoji)
  const tierBadgeY = logoTop + 56;
  const tierLabel = `* ${t.pdfMedal} TIER *`;
  const pillW = 160, pillH = 22;
  fc(doc, t.badgeBg);
  sc(doc, t.border1); doc.lineWidth(1).roundedRect(W / 2 - pillW / 2, tierBadgeY, pillW, pillH, 11).fillAndStroke();
  fc(doc, t.accent);
  doc.font("Helvetica-Bold").fontSize(9)
    .text(tierLabel, W / 2 - pillW / 2, tierBadgeY + 7, { width: pillW, align: "center" });

  // 9. Divider 1
  const d1y = tierBadgeY + 34;
  sc(doc, t.border1); doc.lineWidth(0.8).moveTo(90, d1y).lineTo(W - 90, d1y).stroke();
  diamond(doc, W / 2, d1y, t.accent);

  // 10. Certificate title
  fc(doc, "#FDFBF4");
  doc.font("Times-Roman").fontSize(13.5)
    .text("C E R T I F I C A T E   O F   S U S T A I N A B I L I T Y", 0, d1y + 12, { width: W, align: "center" });

  // 11. Presented to
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(10)
    .text("This certificate is proudly presented to", 0, d1y + 34, { width: W, align: "center" });

  // 12. Name box
  const nameBoxTop = d1y + 54;
  const barW = Math.min(Math.max(name.length * 16, 200), 500);
  const barH = 44;
  fc(doc, t.statBg); sc(doc, t.border1); doc.lineWidth(1)
    .roundedRect(W / 2 - barW / 2, nameBoxTop, barW, barH, 5).fillAndStroke();
  fc(doc, t.accentLight);
  doc.font("Times-BoldItalic").fontSize(28)
    .text(name, W / 2 - barW / 2, nameBoxTop + 8, { width: barW, align: "center" });

  // 13. Tagline
  const tagY = nameBoxTop + barH + 10;
  fc(doc, t.accent, 0.85);
  doc.font("Helvetica").fontSize(9.5).text(`"${t.tagline}"`, 0, tagY, { width: W, align: "center" });

  // 14. Achievement text
  const achY = tagY + 20;
  fc(doc, "#F0EDE4");
  doc.font("Helvetica").fontSize(9.5)
    .text(`For demonstrating outstanding commitment to environmental responsibility during`, 0, achY, { width: W, align: "center" })
    .text(`${monthName} ${year} — achieving measurable carbon reduction through sustainable choices.`, 0, achY + 14, { width: W, align: "center" });

  // 15. Stat boxes (no Unicode subscript in unit label)
  const statsCY = achY + 62;
  statBox(doc, W / 2 - 200, statsCY, "PREVIOUS MONTH", previousTotal.toFixed(2), false, t);
  statBox(doc, W / 2,        statsCY, "CARBON REDUCED",  carbonSaved.toFixed(2),   true,  t);
  statBox(doc, W / 2 + 200, statsCY, "CURRENT MONTH",  currentTotal.toFixed(2),  false, t);

  // 16. Reduction % badge (circle with text — no emoji)
  const bx = W / 2 + 320;
  fc(doc, t.accent);
  doc.circle(bx, statsCY, 30).fill();
  fc(doc, t.bg);
  doc.font("Helvetica-Bold").fontSize(16)
    .text(`${Math.round(reduction)}%`, bx - 30, statsCY - 12, { width: 60, align: "center" });
  doc.font("Helvetica").fontSize(7)
    .text("REDUCED", bx - 30, statsCY + 8, { width: 60, align: "center" });

  // 17. Stars row — drawn as polygons, not Unicode stars
  const starsY = statsCY + 42;
  tierStars(doc, W / 2, starsY, t);

  // 18. Divider 2
  const d2y = starsY + 18;
  sc(doc, t.border1); doc.lineWidth(0.7).moveTo(80, d2y).lineTo(W - 80, d2y).stroke();
  diamond(doc, W / 2, d2y, t.accent);

  // 19. Footer section
  const fy = d2y + 16;

  // Left — issued date
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(8).text("ISSUED ON", 90, fy);
  const dateStr = new Date()
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    .toUpperCase();
  fc(doc, "#FDFBF4");
  doc.font("Helvetica-Bold").fontSize(10.5).text(dateStr, 90, fy + 13);
  sc(doc, t.borderDark); doc.lineWidth(0.5).moveTo(90, fy + 30).lineTo(248, fy + 30).stroke();

  // Center — certificate ID
  const certId = crypto
    .createHash("md5")
    .update(`${name}${monthName}${year}${t.name}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(7.5)
    .text(`CERTIFICATE ID: CT-${certId}`, 0, fy + 18, { width: W, align: "center" });

  // Right — authorized by
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(8).text("AUTHORIZED BY", W - 258, fy, { width: 168, align: "right" });
  fc(doc, t.accentLight);
  doc.font("Times-BoldItalic").fontSize(15).text("Ketan Kumar Jha", W - 258, fy + 12, { width: 168, align: "right" });
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(8).text("Founder, CarbonTrack", W - 258, fy + 28, { width: 168, align: "right" });
  sc(doc, t.borderDark); doc.lineWidth(0.5).moveTo(W - 253, fy + 42).lineTo(W - 90, fy + 42).stroke();

  // 20. Watermark
  doc.save();
  fc(doc, t.glow1, 0.07);
  doc.font("Helvetica-Bold").fontSize(78)
    .text("CARBONTRACK", 0, H / 2 - 38, { width: W, align: "center" });
  doc.restore();
}

function buildEmailHtml({ name, monthName, year, carbonSaved, reduction, tier }) {
  const tierColors = {
    Bronze:   { bg: "#1A0F00", header: "#CD7F32", accent: "#F0C080", badge: "#CD7F32", badgeText: "#3D1F00" },
    Silver:   { bg: "#0D0D14", header: "#C0C0C8", accent: "#E8E8F0", badge: "#C0C0C8", badgeText: "#0D0D14" },
    Gold:     { bg: "#0B2818", header: "#D4A853", accent: "#F5D78E", badge: "#D4A853", badgeText: "#0B2818" },
    Platinum: { bg: "#050B14", header: "#8ECAE6", accent: "#CAF0F8", badge: "#8ECAE6", badgeText: "#050B14" },
  };
  const c = tierColors[tier.name];
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${c.bg};border-radius:16px;border:1px solid ${c.header}40;overflow:hidden;max-width:600px;width:100%">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${c.bg} 0%,${c.header}22 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid ${c.header}30">
            <div style="display:inline-block;background:${c.header}20;border:1px solid ${c.header}50;border-radius:50px;padding:8px 24px;margin-bottom:20px">
              <span style="color:${c.header};font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase">${tier.emoji} ${tier.name} Tier ${tier.emoji}</span>
            </div>
            <h1 style="color:${c.accent};font-size:28px;font-weight:700;margin:0 0 8px;letter-spacing:-0.5px">Your Certificate is Here</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:15px;margin:0">${monthName} ${year} Sustainability Award</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.7;margin:0 0 24px">
              Hi <strong style="color:${c.accent}">${name}</strong>,
            </p>
            <p style="color:rgba(255,255,255,0.65);font-size:15px;line-height:1.7;margin:0 0 28px">
              Congratulations on earning your <strong style="color:${c.accent}">${tier.name} Tier</strong> CarbonTrack certificate!
              Your dedication to reducing your environmental impact is making a real difference.
            </p>

            <!-- Stats block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td width="50%" style="padding-right:8px">
                  <div style="background:rgba(255,255,255,0.04);border:1px solid ${c.header}30;border-radius:12px;padding:20px;text-align:center">
                    <div style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Carbon Saved</div>
                    <div style="color:${c.accent};font-size:26px;font-weight:700;letter-spacing:-0.5px">${carbonSaved.toFixed(2)}</div>
                    <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:4px">kg CO₂</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px">
                  <div style="background:${c.header}18;border:1px solid ${c.header}50;border-radius:12px;padding:20px;text-align:center">
                    <div style="color:rgba(255,255,255,0.4);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Reduction</div>
                    <div style="color:${c.accent};font-size:26px;font-weight:700;letter-spacing:-0.5px">${Math.round(reduction)}%</div>
                    <div style="color:rgba(255,255,255,0.35);font-size:12px;margin-top:4px">vs last month</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Tagline -->
            <div style="border-left:3px solid ${c.header};padding:12px 20px;background:${c.header}10;border-radius:0 8px 8px 0;margin-bottom:28px">
              <p style="color:${c.accent};font-size:14px;font-style:italic;margin:0">"${tier.tagline}"</p>
            </div>

            <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 8px">
              Your official certificate is attached as a PDF. You can download and share it to inspire others in your network.
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 40px 36px;text-align:center">
            <a href="https://carbon-footprint-three-psi.vercel.app/dashboard" style="display:inline-block;background:${c.header};color:${c.badgeText};font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px">View Dashboard</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center">
            <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:0 0 6px">&copy; ${year} CarbonTrack &middot; Making sustainability measurable</p>
            <p style="color:rgba(255,255,255,0.15);font-size:11px;margin:0">You received this because you reduced your carbon footprint this month.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
router.post("/send-certificate", async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({ success: false, message: "Missing required fields: userId, email, or name" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    // autoCheck: false → skips deduplication, always sends immediately
    const result = await buildAndSendCertificate({ userId, email, name, autoCheck: false });
    res.json(result);
  } catch (err) {
    console.error("CERTIFICATE ERROR:", err);
    res.status(500).json({ success: false, message: err?.message || "Certificate email failed" });
  }
});

router.post("/check-and-send", async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    if (!userId || !email || !name) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // autoCheck: true → deduplication enabled
    const result = await buildAndSendCertificate({ userId, email, name, autoCheck: true });
    res.json(result);
  } catch (err) {
    console.error("AUTO CERTIFICATE ERROR:", err);
    res.status(500).json({ success: false, message: err?.message || "Auto certificate check failed" });
  }
});
async function buildAndSendCertificate({ userId, email, name, autoCheck = false }) {
  const data = await Emission.find({ userId }).sort({ createdAt: -1 });
  if (!data.length) {
    return { success: false, message: "No emission data found" };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear  = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear  = currentMonth === 0 ? currentYear - 1 : currentYear;

  let currentTotal = 0, previousTotal = 0;
  data.forEach(item => {
    const d = new Date(item.createdAt);
    const val = Number(item.total) || 0;
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear)   currentTotal  += val;
    if (d.getMonth() === previousMonth && d.getFullYear() === previousYear) previousTotal += val;
  });

  const carbonSaved = Math.max(previousTotal - currentTotal, 0);
  const reduction   = previousTotal > 0 ? (carbonSaved / previousTotal) * 100 : 0;
  const tier        = getTier(reduction);

  if (!tier) {
    return {
      success: false,
      eligible: false,
      message: autoCheck
        ? "No reduction this month — no certificate issued."
        : "You haven't reduced your carbon footprint enough yet. Keep tracking!",
    };
  }
  if (autoCheck) {
    const alreadySent = await CertificateLog.findOne({
      userId,
      month: currentMonth,
      year:  currentYear,
    });
    if (alreadySent) {
      return {
        success: false,
        eligible: false,
        message: "Certificate already sent this month.",
      };
    }
  }

  const monthName = now.toLocaleString("default", { month: "long" });

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
      previousTotal,
      currentTotal,
      carbonSaved,
      reduction,
      tier,
    });
    doc.end();
  });

  const pdfBase64 = Buffer.concat(buffers).toString("base64");

  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const mail = new SibApiV3Sdk.SendSmtpEmail();

  mail.sender     = { name: "CarbonTrack", email: process.env.SENDER_EMAIL };
  mail.to         = [{ email, name }];
  mail.subject    = `${tier.emoji} Your ${tier.name} Tier Certificate — ${monthName} ${currentYear}`;
  mail.htmlContent = buildEmailHtml({ name, monthName, year: currentYear, carbonSaved, reduction, tier });
  mail.attachment  = [{
    name:    `CarbonTrack_${tier.name}_${monthName}_${currentYear}.pdf`,
    content: pdfBase64,
  }];

  await apiInstance.sendTransacEmail(mail);
  if (autoCheck) {
    await CertificateLog.create({
      userId,
      month: currentMonth,
      year:  currentYear,
      tier:  tier.name,
    });
  }

  return {
    success:     true,
    eligible:    true,
    tier:        tier.name,
    reduction:   Math.round(reduction),
    carbonSaved: carbonSaved.toFixed(2),
    message:     `${tier.emoji} ${tier.name} tier certificate sent to ${email}!`,
  };
}

export default router;