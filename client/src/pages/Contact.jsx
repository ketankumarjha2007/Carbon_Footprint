import "../styles/Contact.css";
import { useState } from "react";

function Contact() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [message,setMessage] = useState("");
  const [success,setSuccess] = useState(false);
  const [loading,setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();
    setLoading(true);

    const response = await fetch("http://localhost:5000/api/contact/send",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({name,email,message})
    });

    const data = await response.json();

    setLoading(false);
    setSuccess(true);

    setName("");
    setEmail("");
    setMessage("");

    window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

    setTimeout(()=>{
      setSuccess(false);
    },4000);

  };

  return (
    <section className="contact-section">

      <div className="contact-container">

        <div className="contact-info">
          <h2>Let's Talk 🌿</h2>
          <p>
            Have questions about CarbonTrack?
            Want to collaborate or share ideas about sustainability?
            We'd love to hear from you.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>

          <h3>Send a Message</h3>

          {success && (
            <div className="success-box">
            Message sent successfully! We'll get back to you soon.
            </div>
          )}
          

          <div className="input-group">
            <input
              type="text"
              required
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />
            <label>Name</label>
          </div>

          <div className="input-group">
            <input
              type="email"
              required
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />
            <label>Email</label>
          </div>

          <div className="input-group">
            <textarea
              rows="4"
              required
              value={message}
              onChange={(e)=>setMessage(e.target.value)}
            ></textarea>
            <label>Message</label>
          </div>

          <button type="submit">
            {loading ? "Sending..." : "Send Message"}
          </button>

        </form>

      </div>

    </section>
  );
}

export default Contact;