import "../styles/Donate.css";
import { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import Confetti from "react-confetti";
import { jsPDF } from "jspdf";

function Donate() {

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {

    const reveals = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, { threshold: 0.2 });

    reveals.forEach(el => observer.observe(el));

    const glow = document.querySelector(".cursor-glow");

    window.addEventListener("mousemove", (e) => {
      if (glow) {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      }
    });

  }, []);
  const generateBill = (amount, paymentId = null) => {
    const doc = new jsPDF();

    const transactionId = paymentId || "TXN" + Date.now();
    const date = new Date().toLocaleString();

    /* ========= HEADER ========= */
    doc.setFillColor(34, 139, 34);
    doc.rect(0, 0, 210, 30, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("CarbonTrack", 15, 18);

    doc.setFontSize(10);
    doc.text("Official Payment Receipt", 140, 18);

    /* ========= TITLE ========= */
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("INVOICE", 85, 45);

    /* ========= TABLE ========= */
    const startY = 60;

    const rows = [
      ["Transaction ID", transactionId],
      ["Date", date],
      ["Donor Name", "Carbon User"],
      ["Amount Paid", "Rs. " + amount],
      ["Purpose", "Tree Plantation Donation"],
      ["Payment Status", "SUCCESS"]
    ];

    let y = startY;

    rows.forEach((row, index) => {
      // alternate row color
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 6, 180, 10, "F");
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(row[0], 20, y);
      doc.text(row[1], 100, y);

      y += 12;
    });

    /* ========= TOTAL BOX ========= */
    doc.setDrawColor(0);
    doc.rect(120, y + 5, 75, 20);

    doc.setFontSize(12);
    doc.text("Total Paid", 125, y + 15);

    doc.setFontSize(14);
    doc.setTextColor(34, 139, 34);
    doc.text("Rs. " + amount, 125, y + 23);

    /* ========= FOOTER ========= */
    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(
      "Thank you for supporting environmental sustainability.",
      40,
      280
    );
    doc.save(`CarbonTrack_Invoice_${transactionId}.pdf`);
  };

  const handleDonate = async (amount) => {

    try {

      const res = await fetch("https://carbon-footprint-1-a5ae.onrender.com/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: amount * 100 })
      });

      const order = await res.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "CarbonTrack",
        description: "Tree Plantation Donation",
        order_id: order.id,

        handler: function () {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          alert(`🌱 Thank you for donating ₹${amount}!`);

          generateBill(amount);
        },

        theme: { color: "#2e7d32" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      alert("Payment failed");
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
            color: { value: ["#2E7D32", "#66bb6a"] }
          }
        }}
      />

      <div className="cursor-glow"></div>

      <div className="donate-hero reveal">
        <h1>Help Restore Our Planet </h1>

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
  )
}

export default Donate;