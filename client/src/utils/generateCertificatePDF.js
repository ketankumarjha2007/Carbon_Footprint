import { jsPDF } from "jspdf";

const TIER_THEMES = {
  Platinum: {
    bg: [5, 11, 20],
    accent: [142, 202, 230],
    accentLt: [202, 240, 248],
    gold: [142, 202, 230],
    tag: "Extraordinary impact — you are actively healing the biosphere.",
    stars: 5,
    emoji: "💎",
  },
  Gold: {
    bg: [11, 40, 24],
    accent: [212, 168, 83],
    accentLt: [245, 215, 142],
    gold: [212, 168, 83],
    tag: "Outstanding achievement — you are a verified climate champion.",
    stars: 4,
    emoji: "🥇",
  },
  Silver: {
    bg: [13, 13, 20],
    accent: [192, 192, 200],
    accentLt: [232, 232, 240],
    gold: [192, 192, 200],
    tag: "Impressive progress — sustainability is becoming your nature.",
    stars: 3,
    emoji: "🥈",
  },
  Bronze: {
    bg: [26, 15, 0],
    accent: [205, 127, 50],
    accentLt: [240, 192, 128],
    gold: [205, 127, 50],
    tag: "Every step counts — your sustainability journey has begun.",
    stars: 2,
    emoji: "🥉",
  },
  Seedling: {
    bg: [6, 20, 11],
    accent: [74, 222, 128],
    accentLt: [187, 247, 208],
    gold: [74, 222, 128],
    tag: "Every journey begins with a single seed — keep growing.",
    stars: 1,
    emoji: "🌱",
  },
};

export function generateClientCertificatePDF({
  name = "Environmental Hero",
  tier = "Gold",
  reduction = 20,
  carbonSaved = "15.00",
  currentTotal = "45.00",
  previousTotal = "60.00",
  monthName = "October",
  year = 2026,
}) {
  const t = TIER_THEMES[tier] || TIER_THEMES.Gold;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = 297;
  const H = 210;

  // Background
  doc.setFillColor(...t.bg);
  doc.rect(0, 0, W, H, "F");

  // Radial / Glow simulation
  doc.setFillColor(t.bg[0] + 15, t.bg[1] + 25, t.bg[2] + 20);
  doc.circle(W / 2, H / 2, 70, "F");

  // Outer Border
  doc.setDrawColor(...t.accent);
  doc.setLineWidth(1.2);
  doc.roundedRect(10, 10, W - 20, H - 20, 6, 6, "S");

  // Inner Border
  doc.setDrawColor(...t.accentLt);
  doc.setLineWidth(0.3);
  doc.roundedRect(13, 13, W - 26, H - 26, 4, 4, "S");

  // Top Leaf Logo
  doc.setFillColor(...t.accent);
  doc.circle(W / 2, 28, 6, "F");
  doc.setFillColor(...t.bg);
  doc.circle(W / 2 + 1.5, 27, 4.5, "F");

  // Brand Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...t.accentLt);
  doc.text("V A S U D H A", W / 2, 40, { align: "center" });

  // Tier Pill
  doc.setFillColor(...t.bg);
  doc.setDrawColor(...t.accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(W / 2 - 40, 44, 80, 8, 4, 4, "FD");
  doc.setFontSize(8);
  doc.setTextColor(...t.accent);
  doc.text(`★  ${tier.toUpperCase()} TIER HONORS  ★`, W / 2, 49.5, { align: "center" });

  // Main Title
  doc.setFont("times", "normal");
  doc.setFontSize(18);
  doc.setTextColor(253, 251, 244);
  doc.text("CERTIFICATE OF SUSTAINABILITY", W / 2, 62, { align: "center" });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(156, 163, 175);
  doc.text("This prestigious credential is proudly conferred upon", W / 2, 70, { align: "center" });

  // Recipient Name Plate
  const nameBoxW = Math.min(Math.max(name.length * 6, 90), 180);
  doc.setFillColor(t.bg[0] + 10, t.bg[1] + 18, t.bg[2] + 15);
  doc.setDrawColor(...t.accent);
  doc.setLineWidth(0.6);
  doc.roundedRect(W / 2 - nameBoxW / 2, 75, nameBoxW, 16, 3, 3, "FD");

  doc.setFont("times", "bolditalic");
  doc.setFontSize(22);
  doc.setTextColor(...t.accentLt);
  doc.text(name, W / 2, 86, { align: "center" });

  // Tagline
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...t.accent);
  doc.text(`"${t.tag}"`, W / 2, 98, { align: "center" });

  // Achievement Description
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(230, 235, 240);
  doc.text(
    `For exemplary ecological commitment and climate leadership during ${monthName} ${year},`,
    W / 2,
    106,
    { align: "center" }
  );
  doc.text(
    "demonstrating verified carbon reduction and tangible stewardship for our planet.",
    W / 2,
    111,
    { align: "center" }
  );

  // Stats Row
  const statY = 122;
  const boxes = [
    { label: "PREVIOUS EMISSIONS", val: `${previousTotal} kg`, hi: false },
    { label: "CARBON REDUCED", val: `${carbonSaved} kg`, hi: true },
    { label: "CURRENT EMISSIONS", val: `${currentTotal} kg`, hi: false },
  ];

  boxes.forEach((b, i) => {
    const bx = W / 2 - 75 + i * 55;
    doc.setFillColor(b.hi ? t.bg[0] + 25 : t.bg[0] + 8, b.hi ? t.bg[1] + 45 : t.bg[1] + 15, b.hi ? t.bg[2] + 35 : t.bg[2] + 12);
    doc.setDrawColor(...(b.hi ? t.accent : [80, 95, 90]));
    doc.setLineWidth(b.hi ? 0.7 : 0.3);
    doc.roundedRect(bx - 22, statY, 44, 20, 2.5, 2.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...(b.hi ? t.accent : [160, 175, 170]));
    doc.text(b.label, bx, statY + 6, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...(b.hi ? t.accentLt : [240, 245, 240]));
    doc.text(b.val, bx, statY + 14, { align: "center" });
  });

  // Reduction Badge on the right
  doc.setFillColor(...t.accent);
  doc.circle(W / 2 + 105, statY + 10, 11, "F");
  doc.setTextColor(...t.bg);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text(`${reduction}%`, W / 2 + 105, statY + 9, { align: "center" });
  doc.setFontSize(5);
  doc.text("REDUCTION", W / 2 + 105, statY + 14, { align: "center" });

  // Stars
  const starsY = statY + 28;
  doc.setFontSize(12);
  doc.setTextColor(...t.accent);
  const starStr = Array.from({ length: t.stars }).map(() => "★").join("  ");
  doc.text(starStr, W / 2, starsY, { align: "center" });

  // Divider
  doc.setDrawColor(...t.accent);
  doc.setLineWidth(0.4);
  doc.line(30, starsY + 8, W - 30, starsY + 8);

  // Footer Row
  const footY = starsY + 18;

  // Left: Date
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text("DATE OF ISSUANCE", 32, footY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(245, 245, 245);
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase();
  doc.text(dateStr, 32, footY + 6);

  // Center: Certificate Hash
  const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
  doc.setFont("courier", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...t.accent);
  doc.text(`VERIFICATION ID: CT-${hash}`, W / 2, footY + 4, { align: "center" });

  // Right: Signature
  doc.setFont("times", "bolditalic");
  doc.setFontSize(14);
  doc.setTextColor(...t.accentLt);
  doc.text("Ketan Kumar Jha", W - 32, footY + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text("Founder, VASUDHA", W - 32, footY + 9, { align: "right" });

  doc.save(`VASUDHA_${tier}_Certificate_${monthName}_${year}.pdf`);
}
