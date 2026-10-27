import "../styles/Contact.css";
import { useState } from "react";
import {
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lightbulb,
  HelpCircle,
  Users,
  ArrowRight,
} from "lucide-react";
import { API_BASE_URL } from "../config/api";

const MAX_CHARS = 500;

const TOPICS = [
  { id: "General", label: "General", icon: HelpCircle },
  { id: "Collaboration", label: "Collaboration", icon: Users },
  { id: "Idea", label: "Idea", icon: Lightbulb },
];

const HIGHLIGHTS = [
  {
    icon: HelpCircle,
    title: "Ask anything",
    text: "Questions about how VASUDHA works? We're happy to help.",
  },
  {
    icon: Users,
    title: "Collaborate with us",
    text: "Want to team up on something around sustainability? Let's talk.",
  },
  {
    icon: Lightbulb,
    title: "Share your ideas",
    text: "Your thoughts help us build a greener product.",
  },
];

function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [topic, setTopic] = useState("General");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* soft spotlight that follows the cursor over the form card */
  const handleMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // the topic is added in front of the message so the backend needs no change
        body: JSON.stringify({ name, email, message: `[${topic}] ${message}` }),
      });

      if (!response.ok) throw new Error("Request failed");
      await response.json().catch(() => null);

      setSuccess(true);
      setName("");
      setEmail("");
      setMessage("");
      setTopic("General");
    } catch {
      setError("Something went wrong while sending. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ct">
      <div className="ct-grid-bg" aria-hidden="true" />

      <div className="ct-wrap">
        {/* ---------- left: pitch ---------- */}
        <div className="ct-info">
          <span className="ct-eyebrow">
            <Sparkles size={14} /> Contact VASUDHA
          </span>

          <h1 className="ct-title">
            Let&apos;s talk,
            <br />
            <em>greener.</em>
          </h1>

          <p className="ct-lead">
            Have questions about VASUDHA? Want to collaborate or share ideas about
            sustainability? We&apos;d love to hear from you.
          </p>

          <ul className="ct-cards">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <li className="ct-card" key={title} style={{ "--i": i }}>
                <span className="ct-card-ico">
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- right: form ---------- */}
        <div className="ct-panel" onMouseMove={handleMove}>
          <span className="ct-panel-glow" aria-hidden="true" />

          {success ? (
            <div className="ct-done" role="status" aria-live="polite">
              <span className="ct-done-ico">
                <CheckCircle2 size={44} strokeWidth={2} />
              </span>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We&apos;ll get back to you soon.</p>
              <button type="button" className="ct-ghost" onClick={() => setSuccess(false)}>
                Send another message <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form className="ct-form" onSubmit={handleSubmit}>
              <div className="ct-form-head">
                <h3>Send a message</h3>
                <p>We usually read every note personally.</p>
              </div>

              {error && (
                <div className="ct-alert" role="alert">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="ct-topics" role="radiogroup" aria-label="Topic">
                {TOPICS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={topic === id}
                    className={`ct-chip ${topic === id ? "is-on" : ""}`}
                    onClick={() => setTopic(id)}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>

              <div className="ct-field">
                <User size={18} className="ct-field-ico" />
                <input
                  id="ct-name"
                  className="ct-input"
                  type="text"
                  placeholder=" "
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <label className="ct-label" htmlFor="ct-name">
                  Name
                </label>
              </div>

              <div className="ct-field">
                <Mail size={18} className="ct-field-ico" />
                <input
                  id="ct-email"
                  className="ct-input"
                  type="email"
                  placeholder=" "
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label className="ct-label" htmlFor="ct-email">
                  Email
                </label>
              </div>

              <div className="ct-field ct-field-area">
                <MessageSquare size={18} className="ct-field-ico" />
                <textarea
                  id="ct-message"
                  className="ct-input"
                  rows="5"
                  placeholder=" "
                  required
                  maxLength={MAX_CHARS}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <label className="ct-label" htmlFor="ct-message">
                  Message
                </label>
                <span className={`ct-count ${message.length > MAX_CHARS - 40 ? "is-near" : ""}`}>
                  {message.length}/{MAX_CHARS}
                </span>
              </div>

              <button type="submit" className={`ct-submit ${loading ? "is-loading" : ""}`} disabled={loading}>
                <span className="ct-submit-text">{loading ? "Sending..." : "Send Message"}</span>
                {loading ? (
                  <span className="ct-spin" aria-hidden="true" />
                ) : (
                  <Send size={18} className="ct-submit-ico" />
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default Contact;