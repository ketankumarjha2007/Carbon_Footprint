import "../styles/Donate.css";
import { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import { auth } from "../firebase";
import Confetti from "react-confetti";
import { generateInvoice } from "../utils/generateInvoice";
import { API_BASE_URL } from "../config/api";

function Donate({ user }) {
  const firebaseUser = auth.currentUser;

  const customerName  = firebaseUser?.displayName || "Carbon User";
  const customerEmail = firebaseUser?.email || "";

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
    const onMove = (e) => {
      if (glow) {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", onMove);

    // Clean up so listeners/observers don't pile up on re-mount
    return () => {
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
    };
  }, []);

  const handleDonate = async (amount) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/payment/order`,
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
        name: "VASUDHA",
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
          generateInvoice({
            amount,
            paymentId: response.razorpay_payment_id,
            customerName,
            customerEmail,
          });
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