import express from "express";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import crypto from "crypto";
import Emission from "../models/emissionModel.js";
import CertificateLog from "../models/certificateLogModel.js";
import UserProfile from "../models/userProfileModel.js";

const router = express.Router();

const TIERS = {
  seedling: {
    name: "Seedling",
    minReduction: 0,
    maxReduction: 1,
    emoji: "🌱",
    pdfMedal: "SEEDLING",
    tagline: "Every journey begins with a single seed — keep growing.",
    bg: "#06140B",
    glow1: "#0F2E1A",
    glow2: "#14532D",
    border1: "#4ADE80",
    border2: "#BBF7D0",
    borderDark: "#166534",
    accent: "#4ADE80",
    accentLight: "#BBF7D0",
    statBg: "#0F2E1A",
    statBorder: "#166534",
    statHighBg: "#14532D",
    statHighBorder: "#4ADE80",
    leafColor: "#4ADE80",
    badgeColor: "#4ADE80",
    badgeBg: "#0F2E1A",
    starCount: 1,
  },
  bronze: {
    name: "Bronze",
    minReduction: 1,
    maxReduction: 10,
    emoji: "🥉",
    pdfMedal: "BRONZE",
    tagline: "Every step counts — your sustainability journey has begun.",
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
    tagline: "Impressive progress — sustainability is becoming your nature.",
    bg: "#0D0D14",
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
    tagline: "Outstanding achievement — you are a verified climate champion.",
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
    tagline: "Extraordinary impact — you are actively healing the biosphere.",
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
  if (reduction >= 1) return TIERS.bronze;
  return null;
}

function fc(doc, hex, alpha = 1) {
  doc.fillColor(hex, alpha);
}
function sc(doc, hex) {
  doc.strokeColor(hex);
}

function diamond(doc, cx, cy, color, size = 4) {
  fc(doc, color);
  doc
    .polygon([cx, cy - size], [cx + size, cy], [cx, cy + size], [cx - size, cy])
    .fill();
}

function cornerArc(doc, cx, cy, scaleX, scaleY, t) {
  doc.save();
  doc.translate(cx, cy).scale(scaleX, scaleY);
  sc(doc, t.border1);
  doc.lineWidth(1.5).path("M 0 28 A 28 28 0 0 1 28 0").stroke();
  sc(doc, t.borderDark);
  doc.lineWidth(0.6).path("M 0 18 A 18 18 0 0 1 18 0").stroke();
  doc.restore();
}

function drawStar(doc, cx, cy, r, color) {
  const points = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push([cx + r * Math.cos(outerAngle), cy + r * Math.sin(outerAngle)]);
    points.push([
      cx + r * 0.4 * Math.cos(innerAngle),
      cy + r * 0.4 * Math.sin(innerAngle),
    ]);
  }
  fc(doc, color);
  doc.polygon(...points).fill();
}

function tierStars(doc, cx, cy, t) {
  const count = t.starCount;
  const spacing = 22;
  const startX = cx - ((count - 1) * spacing) / 2;
  for (let i = 0; i < count; i++) {
    drawStar(doc, startX + i * spacing, cy, 7, t.accent);
  }
}

function statBox(doc, cx, cy, label, value, highlight, t) {
  const bw = 138,
    bh = 62;
  const x = cx - bw / 2,
    y = cy - bh / 2;

  fc(doc, highlight ? t.statHighBg : t.statBg);
  sc(doc, highlight ? t.statHighBorder : t.statBorder);
  doc
    .lineWidth(highlight ? 1.4 : 0.7)
    .roundedRect(x, y, bw, bh, 8)
    .fillAndStroke();

  fc(doc, t.accentLight, 0.75);
  doc.font("Helvetica").fontSize(7.5).text("kg CO2", x, y + 8, {
    width: bw,
    align: "center",
  });

  fc(doc, highlight ? t.accentLight : "#F0EDE4");
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .text(value, x, y + 19, { width: bw, align: "center" });

  fc(doc, highlight ? t.accent : "#9CA3AF");
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text(label, x, y + bh - 16, { width: bw, align: "center" });
}

function drawCertificate(
  doc,
  {
    name,
    monthName,
    year,
    previousTotal,
    currentTotal,
    carbonSaved,
    reduction,
    tier,
  }
) {
  const W = 841.89,
    H = 595.28;
  const t = tier;

  // Background
  fc(doc, t.bg);
  doc.rect(0, 0, W, H).fill();

  // Ambient glows
  fc(doc, t.glow1, 0.55);
  doc.ellipse(W / 2, H / 2, 340, 240).fill();
  fc(doc, t.glow2, 0.35);
  doc.ellipse(W / 2, H / 2, 210, 150).fill();

  if (t.name === "Platinum") {
    fc(doc, "#0A2444", 0.45);
    doc.ellipse(W * 0.25, H * 0.25, 200, 130).fill();
    fc(doc, "#0A2444", 0.35);
    doc.ellipse(W * 0.75, H * 0.75, 200, 130).fill();
  }

  // Double Border with luxury styling
  const mg = 18;
  sc(doc, t.border1);
  doc
    .lineWidth(2.5)
    .roundedRect(mg, mg, W - 2 * mg, H - 2 * mg, 14)
    .stroke();
  sc(doc, t.border2);
  doc
    .lineWidth(0.7)
    .roundedRect(mg + 7, mg + 7, W - 2 * (mg + 7), H - 2 * (mg + 7), 9)
    .stroke();

  // Corner ornaments
  cornerArc(doc, mg + 4, mg + 4, 1, 1, t);
  cornerArc(doc, W - mg - 4, mg + 4, -1, 1, t);
  cornerArc(doc, mg + 4, H - mg - 4, 1, -1, t);
  cornerArc(doc, W - mg - 4, H - mg - 4, -1, -1, t);

  // Logo leaf
  const logoTop = 40;
  fc(doc, t.leafColor);
  doc.save();
  doc.translate(W / 2, logoTop);
  doc.path("M0,0 C18,7 18,24 0,32 C-18,24 -18,7 0,0 Z").fill();
  sc(doc, t.glow2);
  doc.lineWidth(1).moveTo(0, 0).lineTo(0, 32).stroke();
  doc.restore();

  // Brand Name
  fc(doc, t.accentLight);
  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("V A S U D H A", 0, logoTop + 38, { width: W, align: "center" });

  // Tier Badge Pill
  const tierBadgeY = logoTop + 58;
  const tierLabel = `★  ${t.pdfMedal} TIER HONORS  ★`;
  const pillW = 180,
    pillH = 22;
  fc(doc, t.badgeBg);
  sc(doc, t.border1);
  doc
    .lineWidth(1)
    .roundedRect(W / 2 - pillW / 2, tierBadgeY, pillW, pillH, 11)
    .fillAndStroke();
  fc(doc, t.accent);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(tierLabel, W / 2 - pillW / 2, tierBadgeY + 7, {
      width: pillW,
      align: "center",
    });

  // Divider 1
  const d1y = tierBadgeY + 34;
  sc(doc, t.border1);
  doc.lineWidth(0.8).moveTo(80, d1y).lineTo(W - 80, d1y).stroke();
  diamond(doc, W / 2, d1y, t.accent, 5);

  // Title
  fc(doc, "#FDFBF4");
  doc
    .font("Times-Roman")
    .fontSize(14)
    .text("C E R T I F I C A T E   O F   S U S T A I N A B I L I T Y", 0, d1y + 11, {
      width: W,
      align: "center",
    });

  // Subtitle
  fc(doc, "#9CA3AF");
  doc
    .font("Helvetica")
    .fontSize(10)
    .text("This prestigious credential is proudly conferred upon", 0, d1y + 33, {
      width: W,
      align: "center",
    });

  // Recipient Name
  const nameBoxTop = d1y + 52;
  const barW = Math.min(Math.max(name.length * 17, 240), 520);
  const barH = 46;
  fc(doc, t.statBg);
  sc(doc, t.border1);
  doc
    .lineWidth(1.2)
    .roundedRect(W / 2 - barW / 2, nameBoxTop, barW, barH, 6)
    .fillAndStroke();
  fc(doc, t.accentLight);
  doc
    .font("Times-BoldItalic")
    .fontSize(28)
    .text(name, W / 2 - barW / 2, nameBoxTop + 8, {
      width: barW,
      align: "center",
    });

  // Tagline
  const tagY = nameBoxTop + barH + 9;
  fc(doc, t.accent, 0.9);
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .text(`"${t.tagline}"`, 0, tagY, { width: W, align: "center" });

  // Citation text
  const achY = tagY + 20;
  fc(doc, "#F0EDE4");
  const achLine1 =
    t.name === "Seedling"
      ? "For taking proactive action to measure, understand, and reduce environmental impact during"
      : "For exemplary dedication to climate leadership and achieving verified carbon reduction during";
  const achLine2 =
    t.name === "Seedling"
      ? `${monthName} ${year} — taking crucial first steps towards a resilient planet.`
      : `${monthName} ${year} — demonstrating tangible ecological stewardship for our shared Earth.`;
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .text(achLine1, 0, achY, { width: W, align: "center" })
    .text(achLine2, 0, achY + 14, { width: W, align: "center" });

  // Stat boxes
  const statsCY = achY + 62;
  statBox(
    doc,
    W / 2 - 200,
    statsCY,
    "PREVIOUS MONTH",
    previousTotal.toFixed(2),
    false,
    t
  );
  statBox(
    doc,
    W / 2,
    statsCY,
    "CARBON REDUCED",
    carbonSaved.toFixed(2),
    true,
    t
  );
  statBox(
    doc,
    W / 2 + 200,
    statsCY,
    "CURRENT MONTH",
    currentTotal.toFixed(2),
    false,
    t
  );

  // Reduction % Badge
  const bx = W / 2 + 325;
  fc(doc, t.accent);
  doc.circle(bx, statsCY, 32).fill();
  fc(doc, t.bg);
  doc
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(`${Math.round(reduction)}%`, bx - 32, statsCY - 13, {
      width: 64,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .text("REDUCED", bx - 32, statsCY + 8, { width: 64, align: "center" });

  // Stars
  const starsY = statsCY + 42;
  tierStars(doc, W / 2, starsY, t);

  // Divider 2
  const d2y = starsY + 18;
  sc(doc, t.border1);
  doc.lineWidth(0.8).moveTo(80, d2y).lineTo(W - 80, d2y).stroke();
  diamond(doc, W / 2, d2y, t.accent, 5);

  // Footer Section
  const fy = d2y + 15;

  // Left - Issue Date
  fc(doc, "#9CA3AF");
  doc.font("Helvetica").fontSize(8).text("DATE OF ISSUANCE", 90, fy);
  const dateStr = new Date()
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    .toUpperCase();
  fc(doc, "#FDFBF4");
  doc.font("Helvetica-Bold").fontSize(10.5).text(dateStr, 90, fy + 13);
  sc(doc, t.borderDark);
  doc.lineWidth(0.5).moveTo(90, fy + 30).lineTo(250, fy + 30).stroke();

  // Center - Certificate Hash ID
  const certId = crypto
    .createHash("md5")
    .update(`${name}${monthName}${year}${t.name}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  fc(doc, "#9CA3AF");
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`VERIFICATION ID: CT-${certId}`, 0, fy + 16, {
      width: W,
      align: "center",
    });

  // Right - Authorized Signatory
  fc(doc, "#9CA3AF");
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("AUTHORIZED BY", W - 260, fy, { width: 170, align: "right" });
  fc(doc, t.accentLight);
  doc
    .font("Times-BoldItalic")
    .fontSize(15)
    .text("Ketan Kumar Jha", W - 260, fy + 12, { width: 170, align: "right" });
  fc(doc, "#9CA3AF");
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("Founder, VASUDHA", W - 260, fy + 28, { width: 170, align: "right" });
  sc(doc, t.borderDark);
  doc.lineWidth(0.5).moveTo(W - 255, fy + 42).lineTo(W - 90, fy + 42).stroke();

  // Ambient Watermark
  doc.save();
  fc(doc, t.glow1, 0.08);
  doc
    .font("Helvetica-Bold")
    .fontSize(84)
    .text("VASUDHA", 0, H / 2 - 40, { width: W, align: "center" });
  doc.restore();
}

function buildEmailHtml({ name, monthName, year, carbonSaved, reduction, tier }) {
  const tierColors = {
    Seedling: { bg: "#06140B", header: "#4ADE80", accent: "#BBF7D0", badge: "#4ADE80", badgeText: "#06140B" },
    Bronze:   { bg: "#1A0F00", header: "#CD7F32", accent: "#F0C080", badge: "#CD7F32", badgeText: "#3D1F00" },
    Silver:   { bg: "#0D0D14", header: "#C0C0C8", accent: "#E8E8F0", badge: "#C0C0C8", badgeText: "#0D0D14" },
    Gold:     { bg: "#0B2818", header: "#D4A853", accent: "#F5D78E", badge: "#D4A853", badgeText: "#0B2818" },
    Platinum: { bg: "#050B14", header: "#8ECAE6", accent: "#CAF0F8", badge: "#8ECAE6", badgeText: "#050B14" },
  };
  const c = tierColors[tier.name] || tierColors.Gold;
  const intro =
    tier.name === "Seedling"
      ? `Thank you for actively tracking and managing your emissions with VASUDHA! You've earned the <strong style="color:${c.accent}">Seedling</strong> Certificate. Reduce your carbon footprint this upcoming month to achieve Bronze, Silver, Gold and Platinum honors!`
      : `Congratulations on earning the prestigious <strong style="color:${c.accent}">${tier.name} Tier</strong> VASUDHA Certificate! Your dedication to sustainable choices has produced measurable impact.`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#060b08;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060b08;padding:36px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:${c.bg};border-radius:18px;border:1px solid ${c.header}40;overflow:hidden;max-width:600px;width:100%;box-shadow:0 24px 60px rgba(0,0,0,0.6)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${c.bg} 0%,${c.header}25 100%);padding:44px 40px 32px;text-align:center;border-bottom:1px solid ${c.header}30">
            <div style="display:inline-block;background:${c.header}20;border:1px solid ${c.header}60;border-radius:50px;padding:8px 24px;margin-bottom:18px">
              <span style="color:${c.header};font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">${tier.emoji} ${tier.name} Tier Honors ${tier.emoji}</span>
            </div>
            <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 8px;letter-spacing:-0.5px">Official Certificate of Sustainability</h1>
            <p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0">${monthName} ${year} Achievement Award</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px">
            <p style="color:rgba(255,255,255,0.9);font-size:16px;line-height:1.7;margin:0 0 20px">
              Dear <strong style="color:${c.accent}">${name}</strong>,
            </p>
            <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 28px">
              ${intro}
            </p>

            <!-- Stats Block -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td width="50%" style="padding-right:8px">
                  <div style="background:rgba(255,255,255,0.04);border:1px solid ${c.header}35;border-radius:12px;padding:20px;text-align:center">
                    <div style="color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">CO₂ Reduced</div>
                    <div style="color:${c.accent};font-size:26px;font-weight:800;letter-spacing:-0.5px">${carbonSaved.toFixed(2)}</div>
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:4px">kg CO₂ saved</div>
                  </div>
                </td>
                <td width="50%" style="padding-left:8px">
                  <div style="background:${c.header}18;border:1px solid ${c.header}55;border-radius:12px;padding:20px;text-align:center">
                    <div style="color:rgba(255,255,255,0.45);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px">Monthly Reduction</div>
                    <div style="color:${c.accent};font-size:26px;font-weight:800;letter-spacing:-0.5px">${Math.round(reduction)}%</div>
                    <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:4px">vs previous month</div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Tagline Quote -->
            <div style="border-left:4px solid ${c.header};padding:14px 20px;background:${c.header}12;border-radius:0 10px 10px 0;margin-bottom:28px">
              <p style="color:${c.accent};font-size:14px;font-style:italic;margin:0;line-height:1.5">"${tier.tagline}"</p>
            </div>

            <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6;margin:0 0 24px">
              Your high-resolution PDF certificate is attached to this email. You can download, print, or share it on LinkedIn and social media to inspire your friends and community!
            </p>

            <div style="text-align:center;padding:12px 0 6px">
              <a href="https://carbon-footprint-three-psi.vercel.app/dashboard" style="display:inline-block;background:${c.header};color:${c.badgeText};font-size:15px;font-weight:700;padding:14px 38px;border-radius:10px;text-decoration:none;box-shadow:0 8px 24px ${c.header}40">View Dashboard & Credentials</a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center">
            <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0 0 6px">&copy; ${year} VASUDHA &middot; Environmental Sustainability Platform</p>
            <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0">Making carbon tracking and climate action measurable, verifiable, and inspiring.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Resilient Email Sender (Resend + Fallback)
async function sendEmailNotification({ email, name, monthName, currentYear, tier, carbonSaved, reduction, pdfBase64 }) {
  let emailSent = false;
  let emailError = null;

  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const emailPayload = {
        from: "VASUDHA <onboarding@resend.dev>",
        to: email,
        subject: `${tier.emoji} Your ${tier.name} Tier Certificate — ${monthName} ${currentYear}`,
        html: buildEmailHtml({
          name,
          monthName,
          year: currentYear,
          carbonSaved,
          reduction,
          tier,
        }),
        attachments: [
          {
            filename: `VASUDHA_${tier.name}_Certificate_${monthName}_${currentYear}.pdf`,
            content: pdfBase64,
          },
        ],
      };

      const result = await resend.emails.send(emailPayload);
      if (result.error) {
        console.warn("Resend direct send warning:", result.error);
        // If domain restriction on free tier, send a copy to the registered account owner
        if (result.error.statusCode === 403 && process.env.EMAIL_USER && email !== process.env.EMAIL_USER) {
          console.log("Sending certificate delivery copy to registered account owner...");
          const adminResult = await resend.emails.send({
            ...emailPayload,
            to: process.env.EMAIL_USER,
            subject: `[For ${name} <${email}>] ${tier.emoji} Your ${tier.name} Tier Certificate — ${monthName} ${currentYear}`,
          });
          if (!adminResult.error) {
            emailSent = true;
          }
        }
      } else {
        emailSent = true;
      }
    }
  } catch (err) {
    console.error("Email delivery exception:", err?.message || err);
    emailError = err?.message;
  }

  return { emailSent, emailError };
}

// Core Certificate Pipeline
export async function buildAndSendCertificate({ userId, email, name, autoCheck = false }) {
  // Update or record user profile for monthly automation
  if (userId && email) {
    try {
      await UserProfile.findOneAndUpdate(
        { userId },
        { email, name: name || "User", lastActiveAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (profileErr) {
      console.warn("UserProfile update warning:", profileErr);
    }
  }

  const data = await Emission.find({ userId }).sort({ createdAt: -1 });
  if (!data.length) {
    return {
      success: false,
      eligible: false,
      message: "No emission activities found yet. Please record some activities in the calculator or tracker first!",
    };
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  let currentTotal = 0,
    previousTotal = 0;
  data.forEach((item) => {
    const d = new Date(item.createdAt);
    const val = Number(item.total) || 0;
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) currentTotal += val;
    if (d.getMonth() === previousMonth && d.getFullYear() === previousYear) previousTotal += val;
  });

  const carbonSaved = Math.max(previousTotal - currentTotal, 0);
  const reduction = previousTotal > 0 ? (carbonSaved / previousTotal) * 100 : 0;
  let tier = getTier(reduction);

  if (!tier) {
    if (autoCheck) {
      return {
        success: false,
        eligible: false,
        message: "No reduction detected this month — no certificate issued.",
      };
    }
    tier = TIERS.seedling;
  }

  if (autoCheck) {
    const alreadySent = await CertificateLog.findOne({
      userId,
      month: currentMonth,
      year: currentYear,
    });
    if (alreadySent) {
      return {
        success: false,
        eligible: false,
        message: "Monthly certificate has already been issued for this period.",
      };
    }
  }

  const monthName = now.toLocaleString("default", { month: "long" });

  // Generate luxury PDF certificate
  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });
  const buffers = [];
  doc.on("data", (chunk) => buffers.push(chunk));

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

  const pdfBuffer = Buffer.concat(buffers);
  const pdfBase64 = pdfBuffer.toString("base64");

  // Attempt Email Delivery via Resend
  const { emailSent } = await sendEmailNotification({
    email,
    name,
    monthName,
    currentYear,
    tier,
    carbonSaved,
    reduction,
    pdfBase64,
  });

  if (autoCheck) {
    await CertificateLog.create({
      userId,
      month: currentMonth,
      year: currentYear,
      tier: tier.name,
    });
  }

  return {
    success: true,
    eligible: true,
    participation: tier.name === "Seedling",
    tier: tier.name,
    emoji: tier.emoji,
    stars: tier.starCount,
    reduction: Math.round(reduction),
    carbonSaved: carbonSaved.toFixed(2),
    currentTotal: currentTotal.toFixed(2),
    previousTotal: previousTotal.toFixed(2),
    monthName,
    year: currentYear,
    pdfBase64,
    emailSent,
    message: emailSent
      ? `${tier.emoji} ${tier.name} Tier Certificate mailed to ${email}!`
      : `${tier.emoji} ${tier.name} Tier Certificate generated successfully! Ready to download.`,
  };
}

// Manual Click Endpoint
router.post("/send-certificate", async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required user identity or email address.",
      });
    }

    const safeName = (name && name.trim()) ? name.trim() : "Environmental Hero";
    const result = await buildAndSendCertificate({
      userId,
      email,
      name: safeName,
      autoCheck: false,
    });

    res.json(result);
  } catch (err) {
    console.error("CERTIFICATE GENERATION ERROR:", err);
    res.status(500).json({
      success: false,
      message: err?.message || "Failed to generate certificate",
    });
  }
});

// Month-End Automatic Check Endpoint
router.post("/check-and-send", async (req, res) => {
  try {
    const { userId, email, name } = req.body;
    if (!userId || !email) {
      return res.status(400).json({ success: false, message: "Missing user parameters" });
    }

    const safeName = (name && name.trim()) ? name.trim() : "Environmental Hero";
    const result = await buildAndSendCertificate({
      userId,
      email,
      name: safeName,
      autoCheck: true,
    });

    res.json(result);
  } catch (err) {
    console.error("AUTO CERTIFICATE CHECK ERROR:", err);
    res.status(500).json({
      success: false,
      message: err?.message || "Automatic check failed",
    });
  }
});

// Manual trigger for month-end cron job (for tests or webhook triggers)
router.post("/trigger-monthly-cron", async (req, res) => {
  try {
    const report = await runMonthlyCertificateJob();
    res.json({ success: true, report });
  } catch (err) {
    console.error("CRON TRIGGER ERROR:", err);
    res.status(500).json({ success: false, message: err?.message });
  }
});

// Automated Month-End Batch Pipeline
export async function runMonthlyCertificateJob() {
  console.log("=== RUNNING MONTH-END AUTOMATED CERTIFICATE JOB ===");
  const profiles = await UserProfile.find({});
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const results = {
    processed: 0,
    certificatesSent: 0,
    skipped: 0,
    errors: 0,
  };

  for (const user of profiles) {
    try {
      results.processed++;
      // Check if certificate already sent
      const alreadySent = await CertificateLog.findOne({
        userId: user.userId,
        month: currentMonth,
        year: currentYear,
      });

      if (alreadySent) {
        results.skipped++;
        continue;
      }

      const res = await buildAndSendCertificate({
        userId: user.userId,
        email: user.email,
        name: user.name || "User",
        autoCheck: true,
      });

      if (res.success && res.eligible) {
        results.certificatesSent++;
        console.log(`Automated certificate sent to ${user.email} (${res.tier} tier)`);
      } else {
        results.skipped++;
      }
    } catch (err) {
      results.errors++;
      console.error(`Error processing user ${user.userId}:`, err?.message);
    }
  }

  console.log("=== MONTH-END CERTIFICATE JOB COMPLETE ===", results);
  return results;
}

export default router;