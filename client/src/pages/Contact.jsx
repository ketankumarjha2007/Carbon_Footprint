import "../styles/Contact.css";

function Contact() {
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

          <div className="contact-details">
            <p>📧 support@carbontrack.com</p>
            <p>🌍 Helping build a greener future</p>
          </div>
        </div>

        <form className="contact-form">

          <h3>Send a Message</h3>

          <div className="input-group">
            <input type="text" required />
            <label>Name</label>
          </div>

          <div className="input-group">
            <input type="email" required />
            <label>Email</label>
          </div>

          <div className="input-group">
            <textarea rows="4" required></textarea>
            <label>Message</label>
          </div>

          <button type="submit">Send Message</button>

        </form>

      </div>

    </section>
  );
}

export default Contact;