import "../styles/Donate.css";
import { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import Confetti from "react-confetti";
import { jsPDF } from "jspdf";

function Donate({ user }) {
  const customerName = user?.name || "Carbon User";
  const customerEmail = user?.email || "";

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.2 }
    );
    reveals.forEach((el) => observer.observe(el));

    const glow = document.querySelector(".cursor-glow");
    window.addEventListener("mousemove", (e) => {
      if (glow) {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      }
    });
  }, []);

  const generateBill = (amount, paymentId = null) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210;
    const H = 297;
    const txnId = paymentId || "TXN" + Date.now();

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // ── Colour Palette ──────────────────────────────────────────────
    const BG    = [8, 20, 10];
    const PANEL = [12, 38, 18];
    const LEAF  = [22, 120, 55];
    const GOLD  = [200, 168, 75];
    const WHITE = [255, 255, 255];
    const SMOKE = [120, 145, 120];
    const DIM   = [70, 95, 70];
    const GREEN = [74, 222, 128];
    const CARD  = [18, 50, 24];

    // ── Background ──────────────────────────────────────────────────
    doc.setFillColor(...BG);
    doc.rect(0, 0, W, H, "F");

    // Left + right accent bars
    doc.setFillColor(...LEAF);
    doc.rect(0, 0, 3, H, "F");
    doc.rect(W - 3, 0, 3, H, "F");

    // ── Header Panel ────────────────────────────────────────────────
    doc.setFillColor(...PANEL);
    doc.rect(0, 0, W, 54, "F");

    // Subtle circle decorations (top-right)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.2);
    for (let i = 0; i < 4; i++) {
      doc.circle(W - 18, -8, 28 + i * 10, "S");
    }

    // Gold separator bar
    doc.setFillColor(...GOLD);
    doc.rect(0, 54, W, 2.5, "F");

    // Logo circle
    doc.setFillColor(...LEAF);
    doc.circle(16, 18, 7, "F");
    doc.setFillColor(...PANEL);
    doc.circle(18, 20, 5, "F");

    // Brand name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...WHITE);
    doc.text("Carbon", 28, 20);
    doc.setTextColor(...GOLD);
    doc.text("Track", 62, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...DIM);
    doc.text("ENVIRONMENTAL SUSTAINABILITY PLATFORM", 28, 26);

    // Invoice title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...WHITE);
    doc.text("INVOICE", W - 14, 21, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...SMOKE);
    doc.text("OFFICIAL PAYMENT RECEIPT", W - 14, 27, { align: "right" });

    // Transaction ID pill (header)
    doc.setFillColor(...GOLD);
    doc.roundedRect(W - 78, 32, 64, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...BG);
    doc.text(txnId, W - 46, 38.5, { align: "center" });

    // ── Info Cards Row ───────────────────────────────────────────────
    const ROW1 = 62;
    const COL_L = 10;
    const COL_R = 110;
    const CW = 88;

    const drawCard = (x, y, w, h) => {
      doc.setFillColor(...CARD);
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      // Gold left accent strip
      doc.setFillColor(...GOLD);
      doc.roundedRect(x, y, 3, h, 1.5, 1.5, "F");
    };

    // Billed To card
    drawCard(COL_L, ROW1, CW, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text("BILLED TO", COL_L + 7, ROW1 + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.text(customerName, COL_L + 7, ROW1 + 17);

    if (customerEmail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...SMOKE);
      doc.text(customerEmail, COL_L + 7, ROW1 + 24);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...DIM);
    doc.text("Carbon Offset Donor", COL_L + 7, customerEmail ? ROW1 + 30 : ROW1 + 24);
    doc.text("India", COL_L + 7, customerEmail ? ROW1 + 36 : ROW1 + 30);

    // Payment Details card
    drawCard(COL_R, ROW1, CW, 38);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text("PAYMENT DETAILS", COL_R + 7, ROW1 + 8);

    const details = [
      ["Date",   dateStr],
      ["Time",   timeStr],
      ["Status", "SUCCESS"],
      ["Method", "Razorpay / UPI"],
    ];
    details.forEach(([label, val], i) => {
      const ry = ROW1 + 16 + i * 6.5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...DIM);
      doc.text(label, COL_R + 7, ry);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const color = label === "Status" ? GREEN : WHITE;
      doc.setTextColor(...color);
      doc.text(val, COL_R + CW - 3, ry, { align: "right" });
    });

    // ── Line Items Table ─────────────────────────────────────────────
    const TY = ROW1 + 44;

    doc.setFillColor(...GOLD);
    doc.rect(COL_L, TY, W - 20, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text("DESCRIPTION OF SERVICE", COL_L, TY + 7);

    // Table header row
    doc.setFillColor(20, 55, 28);
    doc.rect(COL_L, TY + 10, W - 20, 10, "F");

    const cols = [10, 60, 115, 155, 180];
    const heads = ["SERVICE", "DESCRIPTION", "CATEGORY", "QTY", "AMOUNT"];
    heads.forEach((h, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...GOLD);
      doc.text(h, cols[i] + 2, TY + 16.5);
    });

    // Table data row
    doc.setFillColor(14, 34, 18);
    doc.rect(COL_L, TY + 20, W - 20, 14, "F");

    const trees =
      amount === 100 ? "1 Tree" : amount === 500 ? "5 Trees" : "10 Trees";
    const rowData = [
      "Tree Plantation",
      "Carbon Offset Donation",
      "Environment",
      trees,
      `Rs. ${amount}`,
    ];
    rowData.forEach((cell, i) => {
      doc.setFont("helvetica", i === 4 ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...(i === 4 ? GREEN : WHITE));
      doc.text(cell, cols[i] + 2, TY + 29);
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...DIM);
    doc.text("Absorbs ~21 kg CO2/year per tree planted", 62, TY + 32);

    doc.setFillColor(...GOLD);
    doc.rect(COL_L, TY + 34, W - 20, 0.3, "F");

    // ── Subtotals ────────────────────────────────────────────────────
    const SY = TY + 42;
    [
      ["Subtotal",     `Rs. ${amount}`],
      ["Platform Fee", "Rs. 0"],
      ["GST / Tax",    "Included"],
    ].forEach(([label, val], i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...DIM);
      doc.text(label, 115, SY + i * 8);
      doc.setTextColor(...SMOKE);
      doc.text(val, W - 10, SY + i * 8, { align: "right" });
    });

    // ── Total Bar ────────────────────────────────────────────────────
    const TOT_Y = SY + 28;
    doc.setFillColor(...LEAF);
    doc.roundedRect(100, TOT_Y, W - 110, 22, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...WHITE);
    doc.text("TOTAL PAID", 106, TOT_Y + 9);

    doc.setFontSize(17);
    doc.text(`Rs. ${amount}`, W - 10, TOT_Y + 16, { align: "right" });

    // ── Impact Section ───────────────────────────────────────────────
    const IMP_Y = TOT_Y + 28;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GOLD);
    doc.text("YOUR ENVIRONMENTAL IMPACT", COL_L, IMP_Y);

    const co2     = (amount / 100) * 21;
    const water   = (amount / 100) * 450;
    const habitat = amount / 100;

    const impacts = [
      ["CO2 Offset",       `~${co2} kg/yr`],
      ["Water Saved",      `~${water} L`],
      ["Habitat Created",  `${habitat} sq.m`],
    ];
    impacts.forEach(([label, val], i) => {
      const ix = COL_L + i * 64;
      doc.setFillColor(...CARD);
      doc.roundedRect(ix, IMP_Y + 5, 60, 18, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GREEN);
      doc.text(val, ix + 30, IMP_Y + 15, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...DIM);
      doc.text(label, ix + 30, IMP_Y + 20, { align: "center" });
    });

    // ── Transaction ID Row ───────────────────────────────────────────
    const TXN_Y = IMP_Y + 30;
    doc.setFillColor(...CARD);
    doc.roundedRect(COL_L, TXN_Y, W - 20, 12, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...SMOKE);
    doc.text("TRANSACTION ID", COL_L + 4, TXN_Y + 5.5);

    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...GOLD);
    doc.text(txnId, COL_L + 4, TXN_Y + 10);

    // ── Footer ───────────────────────────────────────────────────────
    doc.setFillColor(...PANEL);
    doc.rect(0, H - 20, W, 20, "F");

    doc.setFillColor(...LEAF);
    doc.rect(0, H - 20, W, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...GREEN);
    doc.text("CarbonTrack", W / 2, H - 11, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...DIM);
    doc.text(
      "Thank you for your contribution to a greener planet  |  support@carbontrack.in  |  carbontrack.in",
      W / 2,
      H - 5,
      { align: "center" }
    );

    doc.save(`CarbonTrack_Invoice_${txnId}.pdf`);
  };

  const handleDonate = async (amount) => {
    try {
      const res = await fetch(
        "https://carbon-footprint-1-a5ae.onrender.com/api/payment/order",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amount * 100 }),
        }
      );
      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "CarbonTrack",
        description: "Tree Plantation Donation",
        order_id: order.id,
        prefill: {
          name: customerName,
          email: customerEmail,
        },
        handler: function (response) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          alert(`🌱 Thank you for donating ₹${amount}, ${customerName}!`);
          generateBill(amount, response.razorpay_payment_id);
        },
        theme: { color: "#22c55e" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert("Payment failed. Please try again.");
    }
  };

  return (
    <section className="donate-page">
      {showConfetti && <Confetti />}

      <Particles
        className="particles-bg"
        options={{
          particles: {
            number: { value: 60 },
            size: { value: 2 },
            move: { speed: 1 },
            opacity: { value: 0.3 },
            color: { value: ["#2E7D32", "#66bb6a"] },
          },
        }}
      />

      <div className="cursor-glow"></div>

      <div className="donate-hero reveal">
        <h1>Help Restore Our Planet</h1>
        <p>
          Every tree planted absorbs carbon, restores ecosystems, and protects
          our future. Your contribution creates real impact.
        </p>
        <button className="hero-btn" onClick={() => handleDonate(100)}>
          Donate Now
        </button>
      </div>

      <div className="donation-plans">
        <div className="plan reveal">
          <div className="icon">🌱</div>
          <h3>Plant 1 Tree</h3>
          <p>Start your eco journey.</p>
          <span className="price">₹100</span>
          <button onClick={() => handleDonate(100)}>Donate</button>
        </div>

        <div className="plan highlight reveal">
          <div className="icon">🌿</div>
          <h3>Plant 5 Trees</h3>
          <p>Offset more emissions.</p>
          <span className="price">₹500</span>
          <button onClick={() => handleDonate(500)}>Donate</button>
        </div>

        <div className="plan reveal">
          <div className="icon">🌳</div>
          <h3>Plant 10 Trees</h3>
          <p>Become an Earth hero.</p>
          <span className="price">₹1000</span>
          <button onClick={() => handleDonate(1000)}>Donate</button>
        </div>
      </div>
    </section>
  );
}

export default Donate;