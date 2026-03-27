import "../styles/Donate.css";
import { useEffect, useState } from "react";
import Particles from "react-tsparticles";
import Confetti from "react-confetti";

function Donate() {

  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {

    // SCROLL REVEAL
    const reveals = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add("active");
        }
      });
    },{threshold:0.2});

    reveals.forEach(el=>observer.observe(el));

    // CURSOR GLOW
    const glow = document.querySelector(".cursor-glow");

    window.addEventListener("mousemove",(e)=>{
      if(glow){
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
      }
    });

  },[]);

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
          setTimeout(()=>setShowConfetti(false),5000);
          alert(`🌱 Thank you for donating ₹${amount}!`);
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

      {/* CONFETTI */}
      {showConfetti && <Confetti />}

      {/* PARTICLES */}
      <Particles
        className="particles-bg"
        options={{
          particles:{
            number:{ value:60 },
            size:{ value:2 },
            move:{ speed:1 },
            opacity:{ value:0.3 },
            color:{ value:["#2E7D32","#66bb6a"] }
          }
        }}
      />

      {/* CURSOR GLOW */}
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