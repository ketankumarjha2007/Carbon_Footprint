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
      day: "2-digit", month: "long", year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const darkBg      = [10, 18, 12];      
    const midBg       = [18, 34, 22];       
    const accentGreen = [34, 197, 94];      
    const gold        = [212, 175, 55]; 
    const goldLight   = [255, 223, 100];   
    const white       = [255, 255, 255];
    const lightGray   = [200, 210, 200];
    const dimGray     = [120, 140, 120];
    const cardBg      = [20, 40, 26];     

    doc.setFillColor(...darkBg);
    doc.rect(0, 0, W, H, "F");
    doc.setDrawColor(...accentGreen);
    doc.setLineWidth(0.15);
    for (let i = 0; i < 18; i++) {
      const x = 150 + i * 5;
      doc.line(x, 0, x - 40, 40);
    }
    doc.setFillColor(...accentGreen);
    doc.rect(0, 0, 4, H, "F");
    doc.setFillColor(...midBg);
    doc.rect(0, 0, W, 52, "F");
    doc.setFillColor(...gold);
    doc.rect(0, 52, W, 0.8, "F");

    const lx = 18, ly = 22;
    doc.setFillColor(...accentGreen);
    doc.circle(lx, ly, 7, "F");
    doc.setFillColor(...darkBg);
    doc.circle(lx + 2, ly + 2, 5, "F");

    // Brand name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...accentGreen);
    doc.text("Carbon", 30, 20);
    doc.setTextColor(...gold);
    doc.text("Track", 64, 20);

    // Tagline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...dimGray);
    doc.text("ENVIRONMENTAL SUSTAINABILITY PLATFORM", 30, 26);

    // Right side — INVOICE label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...white);
    doc.text("INVOICE", W - 15, 22, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...dimGray);
    doc.text("OFFICIAL PAYMENT RECEIPT", W - 15, 29, { align: "right" });

    // Invoice number pill
    doc.setFillColor(...accentGreen);
    doc.roundedRect(W - 68, 33, 53, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...darkBg);
    doc.text(`# ${txnId}`, W - 41.5, 39.5, { align: "center" });

    const cardY = 62;
    doc.setFillColor(...cardBg);
    doc.roundedRect(10, cardY, 88, 42, 3, 3, "F");

    // Gold left strip on card
    doc.setFillColor(...gold);
    doc.roundedRect(10, cardY, 3, 42, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("BILLED TO", 17, cardY + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...white);
    doc.text(customerName, 17, cardY + 17);

    if (customerEmail) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...dimGray);
      doc.text(customerEmail, 17, cardY + 24);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...lightGray);
    doc.text("Carbon Offset Donor", 17, cardY + 32);
    doc.text("India", 17, cardY + 38);
    doc.setFillColor(...cardBg);
    doc.roundedRect(108, cardY, 92, 42, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("PAYMENT DETAILS", 116, cardY + 8);

    const details = [
      ["Date", dateStr],
      ["Time", timeStr],
      ["Status", "SUCCESS ✓"],
      ["Method", "Razorpay / UPI"],
    ];

    details.forEach(([label, val], i) => {
      const ry = cardY + 17 + i * 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...dimGray);
      doc.text(label, 116, ry);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(label === "Status" ? accentGreen : white);
      doc.text(val, 198, ry, { align: "right" });
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("DESCRIPTION OF SERVICE", 10, 118);

    // Divider
    doc.setFillColor(...gold);
    doc.rect(10, 120, W - 20, 0.4, "F");
    doc.setFillColor(25, 50, 32);
    doc.rect(10, 122, W - 20, 10, "F");

    const cols = [10, 75, 120, 155, 180];
    const heads = ["SERVICE", "DESCRIPTION", "CATEGORY", "QTY", "AMOUNT"];
    heads.forEach((h, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...gold);
      doc.text(h, cols[i] + 3, 128.5);
    });
    doc.setFillColor(16, 30, 20);
    doc.rect(10, 132, W - 20, 14, "F");

    const treesCount = amount === 100 ? "1 Tree" : amount === 500 ? "5 Trees" : "10 Trees";
    const rowData = [
      "Tree Plantation",
      "Carbon Offset Donation",
      "Environment",
      treesCount,
      `Rs. ${amount}`,
    ];
    rowData.forEach((cell, i) => {
      doc.setFont("helvetica", i === 4 ? "bold" : "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(i === 4 ? accentGreen : white);
      doc.text(cell, cols[i] + 3, 141);
    });

    // sub-row: impact line
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...dimGray);
    doc.text(`Absorbs ~21 kg CO₂/year per tree`, cols[1] + 3, 143.5);

    // Bottom border of items table
    doc.setFillColor(...gold);
    doc.rect(10, 146, W - 20, 0.3, "F");

    const stY = 152;
    const subRows = [
      ["Subtotal", `Rs. ${amount}`],
      ["Platform Fee", "Rs. 0"],
      ["GST / Tax", "Included"],
    ];
    subRows.forEach(([label, val], i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...dimGray);
      doc.text(label, 120, stY + i * 8);
      doc.setTextColor(...lightGray);
      doc.text(val, W - 10, stY + i * 8, { align: "right" });
    });

  
    const totalY = 180;
    doc.setFillColor(...accentGreen);
    doc.roundedRect(100, totalY, W - 110, 22, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...darkBg);
    doc.text("TOTAL PAID", 106, totalY + 9);

    doc.setFontSize(18);
    doc.text(`Rs. ${amount}`, W - 10, totalY + 15.5, { align: "right" });

    doc.setFillColor(20, 45, 28);
    doc.roundedRect(10, 210, W - 20, 14, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("TRANSACTION ID", 17, 218);
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...accentGreen);
    doc.text(txnId, 55, 218);

    const qrX = 10, qrY = 232;
    doc.setFillColor(...cardBg);
    doc.rect(qrX, qrY, 30, 30, "F");
    doc.setFillColor(...accentGreen);
    // Corner squares
    [[0,0],[20,0],[0,20]].forEach(([ox, oy]) => {
      doc.rect(qrX + 2 + ox, qrY + 2 + oy, 8, 8, "F");
      doc.setFillColor(...darkBg);
      doc.rect(qrX + 3.5 + ox, qrY + 3.5 + oy, 5, 5, "F");
      doc.setFillColor(...accentGreen);
    });
    // Random dots for QR feel
    const dots = [[12,12],[14,10],[16,14],[10,16],[14,16],[18,10],[12,18],[16,18]];
    dots.forEach(([dx, dy]) => {
      doc.rect(qrX + dx, qrY + dy, 2, 2, "F");
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...dimGray);
    doc.text("Scan to verify", qrX + 15, qrY + 35, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("YOUR IMPACT", 50, 238);

    const impacts = [
      ["🌿", "CO₂ Offset", `~${amount / 100 * 21} kg/yr`],
      ["💧", "Water Saved", `~${amount / 100 * 450} L`],
      ["🐦", "Habitat Created", `${amount / 100} sq.m`],
    ];
    impacts.forEach(([icon, label, val], i) => {
      const ix = 50 + i * 52;
      doc.setFillColor(22, 46, 30);
      doc.roundedRect(ix, 241, 46, 18, 2, 2, "F");
      doc.setFontSize(14);
      doc.text(icon, ix + 5, 253);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...accentGreen);
      doc.text(val, ix + 18, 249);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...dimGray);
      doc.text(label, ix + 18, 254);
    });
    doc.setFillColor(...midBg);
    doc.rect(0, H - 22, W, 22, "F");
    doc.setFillColor(...accentGreen);
    doc.rect(0, H - 22, W, 0.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...accentGreen);
    doc.text("CarbonTrack", W / 2, H - 14, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...dimGray);
    doc.text(
      "Thank you for your contribution to a greener planet  •  support@carbontrack.in  •  carbontrack.in",
      W / 2, H - 8, { align: "center" }
    );
    doc.setFillColor(...accentGreen);
    doc.rect(W - 4, 0, 4, H, "F");
    doc.save(`CarbonTrack_Invoice_${txnId}.pdf`);
  };

  const handleDonate = async (amount) => {
    try {
      const res = await fetch("https://carbon-footprint-1-a5ae.onrender.com/api/payment/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount * 100 }),
      });
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
          Every tree planted absorbs carbon, restores ecosystems,
          and protects our future. Your contribution creates real impact.
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