import "../styles/Donate.css";

function Donate() {

  const handleDonate = async (amount) => {

    try {

      const res = await fetch("http://localhost:5000/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: amount * 100
        })
      });

      const order = await res.json();

      const options = {
        key:import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "CarbonTrack",
        description: "Tree Plantation Donation",
        order_id: order.id,

        handler: function () {
          alert(` Thank you for donating ₹${amount}!`);
        },

        theme: {
          color: "#2e7d32"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.log(error);
      alert("Payment failed");
    }

  };

  return (

    <section className="donate-page">

      <div className="donate-hero">
        <h1>Help Restore Our Planet</h1>

        <p>
          Every tree planted helps absorb carbon dioxide, protect wildlife,
          and restore ecosystems. Your small contribution today can make a
          lasting impact for generations.
        </p>

        <button className="hero-btn" onClick={() => handleDonate(100)}>
          Donate Now
        </button>

      </div>

      <div className="donation-plans">

        <div className="plan">
          <div className="icon">🌱</div>
          <h3>Plant 1 Tree</h3>
          <p>Perfect for starting your eco journey.</p>
          <span className="price">₹100</span>
          <button onClick={() => handleDonate(100)}>Donate</button>
        </div>

        <div className="plan highlight">
          <div className="icon">🌿</div>
          <h3>Plant 5 Trees</h3>
          <p>Offset more carbon emissions and support forests.</p>
          <span className="price">₹500</span>
          <button onClick={() => handleDonate(500)}>Donate</button>
        </div>

        <div className="plan">
          <div className="icon">🌳</div>
          <h3>Plant 10 Trees</h3>
          <p>Become an Earth hero and restore nature faster.</p>
          <span className="price">₹1000</span>
          <button onClick={() => handleDonate(1000)}>Donate</button>
        </div>

      </div>
    </section>
  )
}

export default Donate;