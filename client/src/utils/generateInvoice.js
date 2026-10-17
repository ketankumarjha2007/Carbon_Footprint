import { jsPDF } from "jspdf";

const C = {
  bg: [6, 18, 10],
  deep: [7, 24, 14],
  top: [14, 86, 44],
  panel: [11, 36, 19],
  card: [16, 50, 26],
  card2: [22, 66, 35],
  leaf: [22, 140, 64],
  leafLt: [74, 222, 128],
  gold: [212, 175, 85],
  goldLt: [245, 215, 142],
  goldDk: [150, 118, 45],
  white: [255, 255, 255],
  smoke: [160, 185, 160],
  dim: [105, 138, 110],
};

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const fill = (d, c) => d.setFillColor(c[0], c[1], c[2]);
const stroke = (d, c) => d.setDrawColor(c[0], c[1], c[2]);
const ink = (d, c) => d.setTextColor(c[0], c[1], c[2]);
const font = (d, style, size, color, face = "helvetica") => {
  d.setFont(face, style);
  d.setFontSize(size);
  ink(d, color);
};
const withAlpha = (d, opacity, fn) => {
  d.saveGraphicsState();
  d.setGState(new d.GState({ opacity }));
  fn();
  d.restoreGraphicsState();
};
const inr = (n) => `Rs. ${Number(n).toLocaleString("en-IN")}`;
const titleCase = (s) =>
  String(s).replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

/* ---------- text with reliable letter-spacing + alignment ---------- */
// jsPDF's charSpace breaks right/center alignment, so we space letters ourselves.
// Set the font BEFORE calling (widths are measured with the current font).
function spaced(d, txt, x, y, gap = 0.5, align = "left") {
  const chars = [...String(txt)];
  const widths = chars.map((c) => d.getTextWidth(c));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
  chars.forEach((c, i) => {
    d.text(c, cx, y);
    cx += widths[i] + gap;
  });
  return total;
}

function label(d, txt, x, y, align = "left") {
  font(d, "bold", 6.5, C.gold);
  spaced(d, txt, x, y, 0.5, align);
}

/* ---------- drawing primitives ---------- */

function leaf(d, x, y, s, color, vein) {
  fill(d, color);
  d.lines(
    [
      [s * 0.95, -s * 0.4, s * 0.8, -s * 1.3, 0, -s * 1.7],
      [-s * 0.8, s * 0.4, -s * 0.95, s * 1.3, 0, s * 1.7],
    ],
    x, y, [1, 1], "F", true
  );
  if (vein) {
    stroke(d, vein);
    d.setLineWidth(0.25);
    d.line(x, y, x, y - s * 1.5);
  }
}

function pine(d, x, base, h, color) {
  fill(d, [92, 62, 34]);
  d.rect(x - 0.5, base - h * 0.18, 1, h * 0.18, "F");
  fill(d, color);
  const w = h * 0.3;
  d.triangle(x, base - h, x - w * 0.7, base - h * 0.55, x + w * 0.7, base - h * 0.55, "F");
  d.triangle(x, base - h * 0.78, x - w * 0.9, base - h * 0.38, x + w * 0.9, base - h * 0.38, "F");
  d.triangle(x, base - h * 0.55, x - w * 1.1, base - h * 0.16, x + w * 1.1, base - h * 0.16, "F");
}

function star(d, cx, cy, r, color) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.42 : r;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  const segs = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
  fill(d, color);
  d.lines(segs, pts[0][0], pts[0][1], [1, 1], "F", true);
}

function diamond(d, cx, cy, r, color) {
  fill(d, color);
  d.lines([[r, r], [-r, r], [-r, -r], [r, -r]], cx, cy - r, [1, 1], "F", true);
}

function barcode(d, x, y, w, h, seed, color) {
  const bits = [];
  for (const ch of seed.slice(0, 24)) {
    const code = ch.charCodeAt(0);
    for (let b = 7; b >= 0; b--) bits.push((code >> b) & 1);
  }
  const u = w / bits.length;
  fill(d, color);
  bits.forEach((bit, i) => {
    if (bit) d.rect(x + i * u, y, u * 0.9, h, "F");
  });
}

function card(d, x, y, w, h, accent = true) {
  fill(d, C.card);
  stroke(d, mix(C.card, C.gold, 0.35));
  d.setLineWidth(0.25);
  d.roundedRect(x, y, w, h, 3, 3, "FD");
  if (accent) {
    fill(d, C.gold);
    d.roundedRect(x, y, 2.2, h, 1.1, 1.1, "F");
  }
}

function icon(d, kind, cx, cy) {
  fill(d, C.panel);
  stroke(d, C.leaf);
  d.setLineWidth(0.4);
  d.circle(cx, cy, 5.2, "FD");
  fill(d, C.leafLt);
  if (kind === "trees") pine(d, cx, cy + 3.6, 7.5, C.leafLt);
  if (kind === "co2") {
    fill(d, C.goldLt);
    d.circle(cx - 1.6, cy + 0.8, 1.4, "F");
    d.circle(cx + 0.2, cy - 0.4, 1.9, "F");
    d.circle(cx + 1.9, cy + 0.9, 1.3, "F");
    d.rect(cx - 1.6, cy + 0.8, 3.5, 1.4, "F");
  }
  if (kind === "water") {
    fill(d, [110, 200, 255]);
    d.circle(cx, cy + 0.9, 1.9, "F");
    d.triangle(cx, cy - 3, cx - 1.8, cy + 0.6, cx + 1.8, cy + 0.6, "F");
  }
  if (kind === "habitat") leaf(d, cx, cy + 2.8, 2.1, C.leafLt, C.panel);
}

// Clean, fully contained "PAID" seal
function seal(d, cx, cy) {
  stroke(d, C.leafLt);
  d.setLineWidth(0.9);
  d.circle(cx, cy, 11.5, "S");
  d.setLineWidth(0.25);
  d.circle(cx, cy, 9.6, "S");
  // top + bottom micro text, centered and inside the inner ring
  font(d, "bold", 4.6, C.leafLt);
  spaced(d, "VASUDHA", cx, cy - 4.6, 0.45, "center");
  font(d, "bold", 14, C.leafLt);
  d.text("PAID", cx, cy + 2.8, { align: "center" });
  font(d, "bold", 4.6, C.leafLt);
  spaced(d, "VERIFIED", cx, cy + 7, 0.45, "center");
  // tiny diamonds on the ring
  diamond(d, cx - 10.5, cy, 0.7, C.leafLt);
  diamond(d, cx + 10.5, cy, 0.7, C.leafLt);
}

/* ---------- main ---------- */

export function generateInvoice({ amount, paymentId = null, customerName = "Carbon User", customerEmail = "" }) {
  const d = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  d.setProperties({ title: "VASUDHA Donation Invoice", author: "VASUDHA" });

  const W = 210;
  const H = 297;
  const now = new Date();
  const txnId = paymentId || "TXN" + Date.now();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now
    .toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    .toUpperCase();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  const invNo = `INV-VSD-${ymd}-${txnId.slice(-5).toUpperCase()}`;
  const trees = Math.max(1, Math.round(amount / 100));
  const treeLabel = `${trees} ${trees > 1 ? "Trees" : "Tree"}`;
  const billName = titleCase(customerName);

  const donor =
    amount >= 1000
      ? { name: "Earth Hero", stars: 5 }
      : amount >= 500
      ? { name: "Forest Guardian", stars: 4 }
      : { name: "Green Sprout", stars: 3 };

  /* background */
  fill(d, C.bg);
  d.rect(0, 0, W, H, "F");
  withAlpha(d, 0.035, () => leaf(d, W / 2 + 8, 215, 58, C.leafLt));

  /* header gradient */
  for (let y = 0; y < 60; y += 1) {
    fill(d, mix(C.top, C.deep, y / 60));
    d.rect(0, y, W, 1.2, "F");
  }
  // decorative rings — radii capped so they stay inside the 60mm header
  withAlpha(d, 0.04, () => {
    stroke(d, C.white);
    d.setLineWidth(0.25);
    for (let r = 20; r <= 56; r += 9) d.circle(W - 4, -4, r, "S");
  });

  /* side rails */
  fill(d, C.leaf);
  d.rect(0, 0, 3, H, "F");
  d.rect(W - 3, 0, 3, H, "F");
  fill(d, C.gold);
  d.rect(3, 0, 0.5, H, "F");
  d.rect(W - 3.5, 0, 0.5, H, "F");

  /* logo + brand */
  stroke(d, C.gold);
  d.setLineWidth(0.8);
  fill(d, C.panel);
  d.circle(24, 24, 11, "FD");
  stroke(d, C.goldDk);
  d.setLineWidth(0.2);
  d.circle(24, 24, 9.2, "S");
  leaf(d, 24, 29.5, 5.2, C.leafLt, C.panel);

  font(d, "bold", 26, C.goldLt);
  spaced(d, "VASUDHA", 40, 23, 1.2);
  font(d, "normal", 6.5, C.smoke);
  spaced(d, "ENVIRONMENTAL SUSTAINABILITY PLATFORM", 40, 29, 0.45);
  font(d, "italic", 7.5, C.goldLt);
  d.text("Planting hope, one tree at a time.", 40, 35);

  /* invoice title */
  font(d, "bold", 30, C.white);
  d.text("INVOICE", W - 14, 24, { align: "right" });
  font(d, "bold", 7, C.goldLt);
  spaced(d, "DONATION RECEIPT", W - 14, 31, 0.9, "right");
  fill(d, C.gold);
  d.roundedRect(W - 86, 38, 72, 9, 4.5, 4.5, "F");
  font(d, "bold", 7, C.bg);
  d.text(invNo, W - 50, 43.9, { align: "center" });

  /* shimmering gold bar */
  for (let x = 0; x < W; x += 2) {
    const t = (Math.sin((x / W) * Math.PI * 3) + 1) / 2;
    fill(d, mix(C.goldDk, C.goldLt, t));
    d.rect(x, 60, 2.2, 1.6, "F");
  }

  /* billed-to + payment cards */
  const row1 = 70;
  card(d, 12, row1, 90, 40);
  label(d, "BILLED TO", 19, row1 + 8);
  font(d, "bold", 13, C.white);
  d.text(d.splitTextToSize(billName, 78)[0], 19, row1 + 17);
  font(d, "normal", 8, C.smoke);
  if (customerEmail) d.text(customerEmail, 19, row1 + 23.5);
  font(d, "normal", 7.5, C.dim);
  d.text("Carbon Offset Donor  |  VASUDHA Green Community", 19, row1 + 30);
  d.text("India", 19, row1 + 35);

  card(d, 108, row1, 90, 40);
  label(d, "PAYMENT DETAILS", 115, row1 + 8);
  [
    ["Date", dateStr],
    ["Time", timeStr],
    ["Status", "SUCCESS"],
    ["Method", "Razorpay / UPI"],
  ].forEach(([k, v], i) => {
    const y = row1 + 16 + i * 6.3;
    font(d, "normal", 7.5, C.dim);
    d.text(k, 115, y);
    font(d, "bold", 7.5, k === "Status" ? C.leafLt : C.white);
    d.text(v, 194, y, { align: "right" });
    if (k === "Status") {
      fill(d, C.leafLt);
      d.circle(194 - d.getTextWidth(v) - 2.5, y - 1.2, 0.9, "F");
    }
  });

  /* item table */
  const ty = 117;
  fill(d, C.card2);
  d.roundedRect(12, ty, 186, 8.5, 2, 2, "F");
  label(d, "SERVICE", 17, ty + 5.6);
  label(d, "QTY", 128, ty + 5.6);
  label(d, "RATE", 156, ty + 5.6);
  label(d, "AMOUNT", 194, ty + 5.6, "right");

  fill(d, mix(C.card, C.bg, 0.35));
  d.rect(12, ty + 8.5, 186, 18, "F");
  fill(d, C.panel);
  stroke(d, C.leaf);
  d.setLineWidth(0.4);
  d.circle(23, ty + 17.5, 5.5, "FD");
  leaf(d, 23, ty + 21, 3.2, C.leafLt, C.panel);

  font(d, "bold", 9.5, C.white);
  d.text("Tree Plantation Drive", 33, ty + 14.5);
  font(d, "normal", 7, C.smoke);
  d.text("Carbon-offset donation  |  Category: Environment", 33, ty + 19.5);
  font(d, "italic", 6.5, C.dim);
  d.text("Each tree absorbs ~21 kg CO2 per year (estimate)", 33, ty + 24);

  font(d, "bold", 8.5, C.white);
  d.text(treeLabel, 128, ty + 18);
  font(d, "normal", 8.5, C.smoke);
  d.text("Rs. 100", 156, ty + 18);
  font(d, "bold", 9.5, C.leafLt);
  d.text(inr(amount), 194, ty + 18, { align: "right" });

  fill(d, C.gold);
  d.rect(12, ty + 26.5, 186, 0.4, "F");

  /* grove panel + totals */
  const sy = 150;
  card(d, 12, sy, 100, 42, false);
  label(d, "YOUR GROVE", 18, sy + 8);
  const shown = Math.min(trees, 12);
  const gstep = shown > 1 ? 80 / (shown - 1) : 0;
  for (let i = 0; i < shown; i++) {
    const x = shown > 1 ? 22 + i * gstep : 62;
    pine(d, x, sy + 31, 17 - (i % 3) * 2, mix(C.leaf, C.leafLt, (i % 4) / 5));
  }
  fill(d, C.leaf);
  d.rect(16, sy + 31, 92, 0.5, "F");
  font(d, "italic", 6.8, C.smoke);
  d.text(`${treeLabel} will be planted in your name.`, 18, sy + 37.5);

  const tx = 120;
  [
    ["Subtotal", inr(amount)],
    ["Platform Fee", "Rs. 0"],
    ["GST / Tax", "Included"],
  ].forEach(([k, v], i) => {
    const y = sy + 5 + i * 7;
    font(d, "normal", 8.5, C.dim);
    d.text(k, tx, y);
    font(d, "normal", 8.5, C.smoke);
    d.text(v, 198, y, { align: "right" });
  });
  d.setLineDashPattern([0.8, 0.8], 0);
  stroke(d, C.goldDk);
  d.setLineWidth(0.25);
  d.line(tx, sy + 23, 198, sy + 23);
  d.setLineDashPattern([], 0);

  fill(d, C.leaf);
  stroke(d, C.gold);
  d.setLineWidth(0.5);
  d.roundedRect(tx, sy + 24.5, 78, 17.5, 3, 3, "FD");
  font(d, "bold", 8, C.white);
  spaced(d, "TOTAL PAID", tx + 5, sy + 31.5, 0.7);
  font(d, "normal", 6, C.goldLt);
  d.text("INR  |  Inclusive of all taxes", tx + 5, sy + 37);
  font(d, "bold", 17, C.white);
  d.text(inr(amount), 195, sy + 36.5, { align: "right" });

  /* impact tiles */
  const iy = 199;
  label(d, "YOUR ENVIRONMENTAL IMPACT  (ESTIMATED)", 12, iy);
  fill(d, C.goldDk);
  d.rect(12, iy + 1.5, 186, 0.25, "F");
  [
    ["trees", String(trees), "Trees planted"],
    ["co2", `~${trees * 21} kg`, "CO2 absorbed / year"],
    ["water", `~${trees * 450} L`, "Water retained"],
    ["habitat", `${trees} sq.m`, "Habitat restored"],
  ].forEach(([k, val, lab], i) => {
    const x = 12 + i * 47.5;
    card(d, x, iy + 4, 43.5, 24, false);
    icon(d, k, x + 21.75, iy + 11.5);
    font(d, "bold", 10, C.leafLt);
    d.text(val, x + 21.75, iy + 22, { align: "center" });
    font(d, "normal", 6, C.dim);
    d.text(lab, x + 21.75, iy + 26, { align: "center" });
  });

  /* donor status banner */
  const by = 233;
  fill(d, C.card2);
  stroke(d, C.gold);
  d.setLineWidth(0.4);
  d.roundedRect(12, by, 186, 18, 3, 3, "FD");
  label(d, "DONOR STATUS", 18, by + 6.5);
  font(d, "bold", 12, C.goldLt);
  d.text(donor.name, 18, by + 14);
  for (let i = 0; i < 5; i++) star(d, 86 + i * 7, by + 9, 2.7, i < donor.stars ? C.gold : C.panel);
  font(d, "italic", 7.5, C.smoke);
  d.text("Thank you for helping heal our planet.", 194, by + 8.5, { align: "right" });
  d.text("Every tree is a promise to the future.", 194, by + 13.5, { align: "right" });

  /* verification row */
  const vy = 257;
  label(d, "VERIFICATION", 12, vy + 3);
  barcode(d, 12, vy + 6, 70, 9, txnId, C.goldLt);
  font(d, "bold", 6.5, C.gold, "courier");
  d.text(txnId, 12, vy + 19);

  seal(d, 116, vy + 11);

  font(d, "bolditalic", 15, C.goldLt, "times");
  d.text("Ketan Kumar Jha", 198, vy + 9, { align: "right" });
  stroke(d, C.gold);
  d.setLineWidth(0.4);
  d.line(150, vy + 11.5, 198, vy + 11.5);
  font(d, "normal", 6.5, C.smoke);
  d.text("Founder, VASUDHA", 198, vy + 15.5, { align: "right" });
  font(d, "bold", 5, C.dim);
  spaced(d, "AUTHORIZED SIGNATORY", 198, vy + 19, 0.4, "right");

  /* footer */
  fill(d, C.panel);
  d.rect(0, 282, W, 15, "F");
  fill(d, C.gold);
  d.rect(0, 282, W, 0.5, "F");
  leaf(d, W / 2 - 17, 289.5, 2.3, C.leafLt);
  font(d, "bold", 8, C.leafLt);
  spaced(d, "VASUDHA", W / 2 + 3, 288.3, 2.2, "center");
  font(d, "normal", 6, C.dim);
  d.text(
    "System-generated receipt, no signature required  |  support@vasudha.in  |  vasudha.in",
    W / 2, 293.5, { align: "center" }
  );

  d.save(`VASUDHA_Invoice_${txnId}.pdf`);
}