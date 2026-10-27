import "../styles/Donate.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";
import {
  Leaf,
  Sprout,
  TreePine,
  Trees,
  ShieldCheck,
  ArrowRight,
  Loader2,
  X,
  Check,
  Minus,
  Plus,
  Download,
  Lock,
  AlertTriangle,
  CreditCard,
  Wind,
  FileText,
} from "lucide-react";
import { auth } from "../firebase";
import { generateInvoice } from "../utils/generateInvoice";
import { API_BASE_URL } from "../config/api";

/* ---------- config ---------- */
const PRICE_PER_TREE = 100;
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100000;
const STEP = 100;
const MAX_VISIBLE_TREES = 28;
const CO2_KG_PER_TREE_YEAR = 21; // rough estimate for a mature tree

const TIERS = [
  { trees: 1, title: "Seedling", line: "Start small, start today", Icon: Sprout },
  { trees: 5, title: "Sapling", line: "A tiny grove of your own", Icon: Leaf },
  { trees: 10, title: "Young grove", line: "Best place to begin", Icon: TreePine, pick: true },
  { trees: 25, title: "Small forest", line: "A real, lasting impact", Icon: Trees },
];

const STEPS = [
  { title: "Choose your grove", text: "Pick a tier or type any amount. Every ₹100 plants one tree." },
  { title: "Pay securely", text: "Razorpay handles checkout. Your card details never touch our servers." },
  { title: "Get your invoice", text: "Your donation invoice downloads the moment the payment succeeds." },
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/* fixed firefly positions, so no math is needed in CSS */
const FLIES = Array.from({ length: 10 }, (_, i) => ({
  left: `${6 + i * 9.4}%`,
  top: `${30 + ((i * 37) % 38)}%`,
}));

/* ---------- the living grove ---------- */
function Tree({ i, x, y, s }) {
  const round = i % 2 === 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className={`dn-tree dn-t${i % 3}`} style={{ animationDelay: `${(i % 8) * 0.06}s` }}>
        <ellipse cx="0" cy="1" rx="20" ry="4" className="dn-shadow" />
        <rect x="-3.5" y="-18" width="7" height="18" rx="2" className="dn-trunk" />
        {round ? (
          <g className="dn-canopy">
            <circle cx="0" cy="-48" r="24" />
            <circle cx="-15" cy="-34" r="16" />
            <circle cx="16" cy="-35" r="17" />
            <circle cx="-6" cy="-58" r="9" className="dn-hi" />
          </g>
        ) : (
          <g className="dn-canopy">
            <path d="M0 -84 L21 -44 H10 L28 -18 H-28 L-10 -44 H-21 Z" />
            <path d="M0 -84 L9 -62 H-2 Z" className="dn-hi" />
          </g>
        )}
      </g>
    </g>
  );
}

function Grove({ count }) {
  const shown = Math.min(count, MAX_VISIBLE_TREES);
  const trees = useMemo(() => {
    const list = Array.from({ length: shown }, (_, i) => {
      // first tree sits dead centre; the rest spread with the golden ratio
      // inside x = 70..530, which is always visible even when the SVG is cropped
      const t = i === 0 ? 0.5 : (i * 0.618034) % 1;
      const x = 300 + (t - 0.5) * 460;
      const y = 298 + ((i * 53) % 52);
      const s = 0.8 + ((y - 298) / 52) * 0.4;
      return { i, x, y, s };
    });
    return list.sort((a, b) => a.y - b.y);
  }, [shown]);

  return (
    <svg
      className="dn-grove"
      viewBox="0 0 600 380"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label={`A grove of ${count} ${count === 1 ? "tree" : "trees"}`}
    >
      <path className="dn-hill dn-hill-back" d="M0 290 Q140 240 300 276 T600 262 V380 H0Z" />
      <path className="dn-hill dn-hill-mid" d="M0 316 Q180 276 360 308 T600 296 V380 H0Z" />
      <path className="dn-hill dn-hill-front" d="M0 346 Q220 312 420 340 T600 332 V380 H0Z" />
      {count === 0 && (
        <g transform="translate(300 330)">
          <g className="dn-sprout">
            <path d="M0 0 V-22" className="dn-stem" />
            <path d="M0 -20 Q-18 -26 -20 -42 Q-4 -40 0 -22Z" className="dn-leaf" />
            <path d="M0 -24 Q16 -30 18 -46 Q4 -44 0 -26Z" className="dn-leaf" />
          </g>
        </g>
      )}
      {trees.map((t) => (
        <Tree key={t.i} {...t} />
      ))}
    </svg>
  );
}

/* ---------- page ---------- */
export default function Donate() {
  const firebaseUser = auth.currentUser;
  const customerName = firebaseUser?.displayName || "Carbon User";
  const customerEmail = firebaseUser?.email || "";

  const [raw, setRaw] = useState("1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [ctaSeen, setCtaSeen] = useState(true);
  const ctaRef = useRef(null);

  const amount = parseInt(raw, 10) || 0;
  const valid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;
  const trees = Math.floor(amount / PRICE_PER_TREE);
  const co2 = trees * CO2_KG_PER_TREE_YEAR;
  const growth = Math.min(trees / MAX_VISIBLE_TREES, 1);

  useEffect(() => {
    const set = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  /* show the sticky mobile bar only while the main button is off screen */
  useEffect(() => {
    const el = ctaRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => setCtaSeen(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll(".dn-reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!success) return;
    const onKey = (e) => e.key === "Escape" && setSuccess(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [success]);

  const spot = useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  }, []);

  const setAmount = (n) => setRaw(String(Math.max(0, Math.min(MAX_AMOUNT, n))));
  const bump = (d) => setAmount((amount || 0) + d);

  /* ---------- payment (unchanged logic) ---------- */
  const handleDonate = async () => {
    if (!valid || loading) return;
    setError("");
    setLoading(true);

    const paying = amount;
    const treesPlanted = Math.floor(paying / PRICE_PER_TREE);

    try {
      if (!window.Razorpay) {
        throw new Error("The payment gateway didn't load. Please refresh the page and try again.");
      }

      const res = await fetch(`${API_BASE_URL}/api/payment/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paying * 100 }),
      });
      if (!res.ok) throw new Error("We couldn't start the payment. Please try again.");
      const order = await res.json();
      if (!order?.id) throw new Error("We couldn't start the payment. Please try again.");

      const rzp = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "VASUDHA",
        description: "Tree Plantation Donation",
        order_id: order.id,
        prefill: { name: customerName, email: customerEmail },
        theme: { color: "#22c55e" },
        modal: { ondismiss: () => setLoading(false) },
        handler: (response) => {
          const paymentId = response.razorpay_payment_id;
          setSuccess({ amount: paying, trees: treesPlanted, paymentId });
          setConfetti(true);
          setTimeout(() => setConfetti(false), 6000);
          try {
            generateInvoice({ amount: paying, paymentId, customerName, customerEmail });
          } catch (e) {
            /* invoice can be re-downloaded from the thank-you card */
          }
        },
      });

      rzp.on("payment.failed", () => {
        setError("The payment didn't go through. You haven't been charged. Please try again.");
        setLoading(false);
      });

      rzp.open();
      setLoading(false);
    } catch (err) {
      setError(err?.message || "Payment failed. Please try again.");
      setLoading(false);
    }
  };

  const redownload = () => {
    if (!success) return;
    try {
      generateInvoice({
        amount: success.amount,
        paymentId: success.paymentId,
        customerName,
        customerEmail,
      });
    } catch (e) {
      /* ignore */
    }
  };

  const ctaLabel = valid ? `Plant ${trees} ${trees === 1 ? "tree" : "trees"} for ${formatINR(amount)}` : "Enter an amount";

  return (
    <section className="dn-page" style={{ "--growth": growth }}>
      {confetti && vp.w > 0 && (
        <Confetti
          width={vp.w}
          height={vp.h}
          recycle={false}
          numberOfPieces={420}
          gravity={0.22}
          colors={["#4ade80", "#bef264", "#fbbf24", "#fde68a", "#22d3ee"]}
          style={{ position: "fixed", zIndex: 90, pointerEvents: "none" }}
        />
      )}

      <div className="dn-aurora dn-aurora-1" aria-hidden="true" />
      <div className="dn-aurora dn-aurora-2" aria-hidden="true" />
      <div className="dn-noise" aria-hidden="true" />

      <div className="dn-wrap">
        <header className="dn-head">
          <h1 className="dn-title">Give ₹100. Watch a tree take root.</h1>
          <p className="dn-lead">
            Every tree you fund cleans the air, shelters wildlife and steadies the soil. Slide the
            amount and see your grove grow before you pay a rupee.
          </p>
        </header>

        <div className="dn-main">
          {/* ---- living stage ---- */}
          <div className="dn-stage" aria-live="polite">
            <div className="dn-sky" aria-hidden="true">
              <span className="dn-sun" />
              {FLIES.map((f, i) => (
                <span key={i} className="dn-fly" style={{ left: f.left, top: f.top, "--i": i }} />
              ))}
            </div>

            <div className="dn-stage-top">
              <div className="dn-count" key={trees}>
                <b>{trees}</b>
                <span>{trees === 1 ? "tree" : "trees"}</span>
              </div>
              {trees > MAX_VISIBLE_TREES && (
                <span className="dn-more">+{trees - MAX_VISIBLE_TREES} more beyond view</span>
              )}
            </div>

            <Grove count={trees} />

            <div className="dn-impact">
              <div>
                <Wind size={16} />
                <span>
                  <b>≈ {co2.toLocaleString("en-IN")} kg</b> CO₂ absorbed per year
                </span>
              </div>
              <small>Estimate for mature trees. Actual figures vary by species and site.</small>
            </div>
          </div>

          {/* ---- donate panel ---- */}
          <div className="dn-panel" onMouseMove={spot}>
            <div className="dn-panel-glow" aria-hidden="true" />

            <div className="dn-panel-head">
              <h2>Choose your impact</h2>
              <span className="dn-as">
                Donating as <strong>{customerName}</strong>
              </span>
            </div>

            <div className="dn-tiers" role="radiogroup" aria-label="Quick pick">
              {TIERS.map(({ trees: t, title, line, Icon, pick }) => {
                const price = t * PRICE_PER_TREE;
                const active = amount === price;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`dn-tier ${active ? "active" : ""}`}
                    onMouseMove={spot}
                    onClick={() => setAmount(price)}
                  >
                    {pick && <span className="dn-tier-tag">Recommended</span>}
                    <span className="dn-tier-ico">
                      <Icon size={18} />
                    </span>
                    <strong>{title}</strong>
                    <small>{line}</small>
                    <span className="dn-tier-price">
                      {formatINR(price)}
                      <i>
                        {t} {t === 1 ? "tree" : "trees"}
                      </i>
                    </span>
                    <span className="dn-tier-check" aria-hidden="true">
                      <Check size={13} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="dn-label" htmlFor="dn-amount">
              Or enter your own amount
            </label>
            <div className={`dn-amount ${raw && !valid ? "bad" : ""}`}>
              <button
                type="button"
                className="dn-step"
                onClick={() => bump(-STEP)}
                disabled={amount <= MIN_AMOUNT}
                aria-label="Decrease amount"
              >
                <Minus size={18} />
              </button>
              <div className="dn-amount-field">
                <span className="dn-rupee">₹</span>
                <input
                  id="dn-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="1000"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <button
                type="button"
                className="dn-step"
                onClick={() => bump(STEP)}
                disabled={amount >= MAX_AMOUNT}
                aria-label="Increase amount"
              >
                <Plus size={18} />
              </button>
            </div>
            <p className={`dn-hint ${raw && !valid ? "bad" : ""}`}>
              {raw && !valid
                ? `Enter an amount between ${formatINR(MIN_AMOUNT)} and ${formatINR(MAX_AMOUNT)}.`
                : `Every ${formatINR(PRICE_PER_TREE)} plants one tree.`}
            </p>

            <dl className="dn-summary">
              <div>
                <dt>Trees planted</dt>
                <dd>{valid ? trees : "—"}</dd>
              </div>
              <div>
                <dt>Invoice</dt>
                <dd>Instant, after payment</dd>
              </div>
              <div className="dn-total">
                <dt>Total</dt>
                <dd>{valid ? formatINR(amount) : "—"}</dd>
              </div>
            </dl>

            {error && (
              <div className="dn-error" role="alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              ref={ctaRef}
              type="button"
              className="dn-cta"
              onClick={handleDonate}
              disabled={!valid || loading}
              onMouseMove={spot}
            >
              <span className="dn-cta-in">
                {loading ? (
                  <>
                    <Loader2 size={18} className="dn-spin" /> Opening secure checkout…
                  </>
                ) : (
                  <>
                    {ctaLabel}
                    <ArrowRight size={18} />
                  </>
                )}
              </span>
            </button>

            <div className="dn-secure">
              <span>
                <Lock size={13} /> Secure checkout by Razorpay
              </span>
              <span>
                <CreditCard size={13} /> Cards, UPI &amp; netbanking
              </span>
            </div>
          </div>
        </div>

        <section className="dn-how dn-reveal">
          <h2 className="dn-how-title">Three steps, about a minute</h2>
          <ol className="dn-steps">
            {STEPS.map((s, i) => (
              <li key={s.title} onMouseMove={spot}>
                <span className="dn-step-n">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="dn-foot">
            <ShieldCheck size={14} /> Payments are processed by Razorpay.
            <FileText size={14} /> Your invoice downloads automatically after a successful donation.
          </p>
        </section>
      </div>

      {/* sticky bar for phones and tablets */}
      <div className={`dn-sticky ${!ctaSeen && !success ? "show" : ""}`}>
        <div>
          <b>{valid ? formatINR(amount) : "—"}</b>
          <span>{valid ? `${trees} ${trees === 1 ? "tree" : "trees"}` : "Pick an amount"}</span>
        </div>
        <button type="button" onClick={handleDonate} disabled={!valid || loading}>
          {loading ? <Loader2 size={16} className="dn-spin" /> : "Donate now"}
        </button>
      </div>

      {success && (
        <div className="dn-modal" role="dialog" aria-modal="true" aria-labelledby="dn-ty-title">
          <div className="dn-modal-bg" onClick={() => setSuccess(null)} />
          <div className="dn-modal-card">
            <button type="button" className="dn-modal-x" onClick={() => setSuccess(null)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="dn-ty-badge">
              <Check size={30} strokeWidth={3} />
            </div>
            <h3 id="dn-ty-title">Thank you, {customerName.split(" ")[0]}!</h3>
            <p className="dn-ty-text">
              Your donation of <strong>{formatINR(success.amount)}</strong> will plant{" "}
              <strong>
                {success.trees} {success.trees === 1 ? "tree" : "trees"}
              </strong>
              .
            </p>
            <div className="dn-ty-id">
              <small>Payment ID</small>
              <code>{success.paymentId}</code>
            </div>
            <div className="dn-ty-actions">
              <button type="button" className="dn-btn-solid" onClick={redownload}>
                <Download size={16} /> Download invoice
              </button>
              <button type="button" className="dn-btn-ghost" onClick={() => setSuccess(null)}>
                Plant more
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}