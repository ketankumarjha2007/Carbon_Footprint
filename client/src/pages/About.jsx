import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  Globe2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  TreePine,
  Calculator,
  Activity,
  CheckCircle2,
  Layers,
  ChevronRight,
  TrendingDown,
  Compass,
} from "lucide-react";
import "../styles/About.css";

/* ================= DATA ================= */

const GLOBAL_STATS = [
  { value: 37.2, decimals: 1, unit: "Gt", label: "Global fossil CO₂ emissions released each year into our atmosphere." },
  { value: 4.7, decimals: 1, unit: "Tons", label: "Average yearly carbon footprint per human on Earth." },
  { value: 1.5, decimals: 1, unit: "°C", label: "Critical climate boundary threshold we must work together to avoid." },
];

const PILLARS = [
  {
    icon: "🔬",
    tag: "AWARENESS",
    title: "Precision Carbon Science",
    desc: "Calculate your commute, home electricity, and dietary emissions with standard scientific conversion factors and live regional AQI telemetry.",
  },
  {
    icon: "🏅",
    tag: "RECOGNITION",
    title: "Automated Monthly Honors",
    desc: "Reduce your footprint month-over-month to unlock Seedling, Bronze, Silver, Gold, and Platinum Certificates automatically mailed to your inbox on the last day of each month.",
  },
  {
    icon: "🌱",
    tag: "RESTORATION",
    title: "Tangible Environmental Offsets",
    desc: "Plant verified trees through partnered afforestation drives and receive digital invoices with official serial tracking and environmental impact metrics.",
  },
];

const BREAKDOWN_CATEGORIES = [
  {
    id: "transport",
    name: "Transport & Commute",
    share: 27,
    color: "#22c55e",
    tip: "Taking public transit or carpooling just 2 days a week cuts personal vehicle emissions by up to 40%.",
    savings: "~400 kg CO₂ / year",
  },
  {
    id: "energy",
    name: "Home Electricity",
    share: 24,
    color: "#06b6d4",
    tip: "Switching to LED lighting and eliminating vampire standby draw reduces home electric footprint by 15-20%.",
    savings: "~220 kg CO₂ / year",
  },
  {
    id: "food",
    name: "Diet & Food Waste",
    share: 22,
    color: "#eab308",
    tip: "Incorporating Meatless Mondays and minimizing food spoilage drastically cuts agricultural methane and nitrous oxide.",
    savings: "~180 kg CO₂ / year",
  },
  {
    id: "goods",
    name: "Consumption & Goods",
    share: 13,
    color: "#a855f7",
    tip: "Choosing second-hand electronics, repairing clothing, and buying durable goods reduces embodied manufacturing carbon.",
    savings: "~150 kg CO₂ / year",
  },
  {
    id: "waste",
    name: "Waste & Landfills",
    share: 8,
    color: "#3b82f6",
    tip: "Composting organic scraps prevents anaerobic decomposition in landfills, reducing direct methane emissions.",
    savings: "~90 kg CO₂ / year",
  },
  {
    id: "water",
    name: "Hot Water & Utilities",
    share: 6,
    color: "#ec4899",
    tip: "Installing aerated showerheads and lowering water heater thermostat by 5°C saves substantial electricity.",
    savings: "~70 kg CO₂ / year",
  },
];

const FEATURES_LIST = [
  {
    to: "/calculator",
    icon: <Calculator className="feat-ico" />,
    badge: "CALCULATOR",
    title: "Scientific Carbon Calculator",
    desc: "Input your travel, power, and food habits to see your carbon total and air quality index in under 60 seconds.",
    cta: "Calculate Footprint",
  },
  {
    to: "/tracker",
    icon: <Activity className="feat-ico" />,
    badge: "TRACKER",
    title: "Daily Activity & Habit Log",
    desc: "Log daily sustainable choices and watch your cumulative emission reduction curve climb with interactive charts.",
    cta: "Start Tracking",
  },
  {
    to: "/dashboard",
    icon: <Award className="feat-ico" />,
    badge: "CERTIFICATES",
    title: "Monthly Honor Certificates",
    desc: "Earn prestige honors from Seedling to Platinum. Certificates are automatically generated and emailed on month-end.",
    cta: "View Credentials",
  },
  {
    to: "/donate",
    icon: <TreePine className="feat-ico" />,
    badge: "AFFORESTATION",
    title: "Verified Tree Plantation",
    desc: "Contribute to afforestation projects with instant Razorpay payments and receive verifiable PDF donation invoices.",
    cta: "Plant Trees",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Calculate Footprint",
    desc: "Quantify your daily transport, power consumption, and diet into verified kilograms of CO₂.",
  },
  {
    num: "02",
    title: "Track Activity",
    desc: "Log sustainable actions every day to accumulate green reward points and monitor your reduction trajectory.",
  },
  {
    num: "03",
    title: "Heal the Earth",
    desc: "Sponsor native saplings to offset non-avoidable emissions and receive verified tax-compliant receipts.",
  },
  {
    num: "04",
    title: "Receive Honors",
    desc: "On the final day of each month, your official Certificate of Sustainability is automatically generated and emailed.",
  },
];

const PLEDGE_ITEMS = [
  { id: "transit", title: "Carpool or transit 2 days/wk", kg: 400, icon: "🚌" },
  { id: "walk", title: "Walk or cycle short errands", kg: 250, icon: "🚶" },
  { id: "foodwaste", title: "Zero food waste at home", kg: 200, icon: "🍃" },
  { id: "meatless", title: "Plant-based meal days", kg: 160, icon: "🥗" },
  { id: "led", title: "LEDs & zero standby power", kg: 140, icon: "💡" },
  { id: "thrift", title: "Buy refurbished / second-hand", kg: 120, icon: "♻️" },
  { id: "coldwash", title: "Cold wash & air-dry clothes", kg: 100, icon: "👕" },
  { id: "shower", title: "Shorter water-efficient showers", kg: 70, icon: "🚿" },
];

/* ================= 3D PARTICLE EARTH CANVAS ================= */

function EarthCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let width = 0;
    let height = 0;
    let rotation = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Generate sphere points
    const points = [];
    const count = 420;
    for (let i = 0; i < count; i++) {
      const lat = Math.acos(2 * Math.random() - 1) - Math.PI / 2;
      const lon = 2 * Math.PI * Math.random();
      points.push({ lat, lon });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.min(width, height) * 0.42;

      // Atmospheric outer glow
      const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius * 1.35);
      glowGrad.addColorStop(0, "rgba(34, 197, 94, 0.2)");
      glowGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.1)");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Base globe sphere
      const sphereGrad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
      sphereGrad.addColorStop(0, "#0f2e22");
      sphereGrad.addColorStop(0.6, "#061814");
      sphereGrad.addColorStop(1, "#020a08");
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Sphere border ring
      ctx.strokeStyle = "rgba(74, 222, 128, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating particle constellation
      rotation += 0.007;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const lon = p.lon + rotation;
        const x = radius * Math.cos(p.lat) * Math.sin(lon);
        const y = radius * Math.sin(p.lat);
        const z = radius * Math.cos(p.lat) * Math.cos(lon);

        // Only draw front-facing particles
        if (z > -radius * 0.15) {
          const depth = (z + radius) / (radius * 2);
          const alpha = Math.max(0.15, depth);
          const size = 1.2 + depth * 1.6;

          ctx.fillStyle = `rgba(74, 222, 128, ${alpha})`;
          ctx.beginPath();
          ctx.arc(cx + x, cy + y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Orbital Rings
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.35);
      ctx.scale(1, 0.32);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
      ctx.stroke();

      // Satellite on ring
      const satAngle = -rotation * 2;
      const sx = radius * 1.3 * Math.cos(satAngle);
      const sy = radius * 1.3 * Math.sin(satAngle);
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="earth-canvas-element" aria-hidden="true" />;
}

/* ================= MAIN COMPONENT ================= */

export default function About() {
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [pledges, setPledges] = useState(new Set(["transit", "meatless", "led"]));
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const togglePledge = (id) => {
    setPledges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPledgeKg = PLEDGE_ITEMS.reduce((sum, p) => (pledges.has(p.id) ? sum + p.kg : sum), 0);
  const equivalentTrees = (totalPledgeKg / 21).toFixed(1);
  const activeBreakdown = BREAKDOWN_CATEGORIES[activeCategory];

  return (
    <div className="about-v2-page">
      {/* Dynamic Ambient Glows */}
      <div className="ab2-glow ab2-glow-top" />
      <div className="ab2-glow ab2-glow-mid" />
      <div className="ab2-glow ab2-glow-bottom" />

      {/* ========================================================
          1. HERO SECTION (Planet Telemetry & Vision)
          ======================================================== */}
      <section className="ab2-hero">
        <div className="ab2-hero-content">
          <div className="ab2-hero-badge">
            <span className="badge-pulse" />
            <span className="badge-text">PLANETARY SUSTAINABILITY INTELLIGENCE</span>
          </div>

          <h1 className="ab2-hero-title">
            Making Personal Climate Action <em>Measurable, Visible & Honored.</em>
          </h1>

          <p className="ab2-hero-sub">
            Vasudha translates your daily habits into actionable carbon data, certifies your month-over-month reductions with official credentials, and funds verified tree plantations to restore our biosphere.
          </p>

          <div className="ab2-hero-actions">
            <Link to={user ? "/calculator" : "/login"} className="ab2-btn-primary">
              <span>{user ? "Open Calculator" : "Start Tracking Free"}</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="ab2-btn-secondary">
              <span>Explore How It Works</span>
            </a>
          </div>

          <div className="ab2-hero-metrics">
            <div className="hero-metric-pill">
              <span className="h-val">100%</span>
              <span className="h-lbl">Scientific Formulas</span>
            </div>
            <div className="hero-metric-pill">
              <span className="h-val">5 Tiers</span>
              <span className="h-lbl">Monthly Certificates</span>
            </div>
            <div className="hero-metric-pill">
              <span className="h-val">Razorpay</span>
              <span className="h-lbl">Verified Afforestation</span>
            </div>
          </div>
        </div>

        {/* 3D Earth Canvas Hub */}
        <div className="ab2-hero-visual">
          <EarthCanvas />
          <div className="orbit-chip chip-top">
            <span className="chip-ico">📊</span>
            <span>Live Emission Telemetry</span>
          </div>
          <div className="orbit-chip chip-right">
            <span className="chip-ico">🎖️</span>
            <span>Automated End-of-Month Honors</span>
          </div>
          <div className="orbit-chip chip-bottom">
            <span className="chip-ico">🌲</span>
            <span>Afforestation Receipts</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. GLOBAL CLIMATE CONTEXT (Counters)
          ======================================================== */}
      <section className="ab2-section ab2-stats-section">
        <div className="ab2-section-head center">
          <span className="ab2-eyebrow">THE GLOBAL CHALLENGE</span>
          <h2>The Numbers That Define Our Generation</h2>
          <p>Understanding the scale of global greenhouse emissions makes individual action urgently meaningful.</p>
        </div>

        <div className="ab2-stats-grid">
          {GLOBAL_STATS.map((st, i) => (
            <div key={i} className="ab2-stat-card">
              <div className="stat-card-glow" />
              <div className="stat-card-number">
                <span className="num-val">{st.value}</span>
                <span className="num-unit">{st.unit}</span>
              </div>
              <p className="stat-card-label">{st.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. THE THREE PILLARS
          ======================================================== */}
      <section className="ab2-section">
        <div className="ab2-section-head">
          <span className="ab2-eyebrow">WHY VASUDHA</span>
          <h2>The Three Pillars of Conscious Stewardship</h2>
          <p>We combine personal telemetry, motivational recognition, and direct ecological restoration into one cohesive platform.</p>
        </div>

        <div className="ab2-pillars-grid">
          {PILLARS.map((p, i) => (
            <div key={i} className="ab2-pillar-card">
              <div className="pillar-header">
                <span className="pillar-icon">{p.icon}</span>
                <span className="pillar-tag">{p.tag}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          4. INTERACTIVE FOOTPRINT BREAKDOWN
          ======================================================== */}
      <section className="ab2-section">
        <div className="ab2-section-head center">
          <span className="ab2-eyebrow">SOURCE INTELLIGENCE</span>
          <h2>Where Does an Individual's Footprint Come From?</h2>
          <p>Click any sector below to inspect typical lifestyle share and high-impact mitigation swaps.</p>
        </div>

        <div className="ab2-breakdown-card">
          <div className="breakdown-nav">
            {BREAKDOWN_CATEGORIES.map((cat, i) => (
              <button
                key={cat.id}
                type="button"
                className={`breakdown-tab ${i === activeCategory ? "active" : ""}`}
                onClick={() => setActiveCategory(i)}
                style={{ "--cat-color": cat.color }}
              >
                <span className="tab-dot" />
                <span className="tab-name">{cat.name}</span>
                <span className="tab-share">{cat.share}%</span>
              </button>
            ))}
          </div>

          <div className="breakdown-details-panel">
            <div className="details-header">
              <div className="dh-left">
                <span className="dh-title">{activeBreakdown.name}</span>
                <span className="dh-badge" style={{ backgroundColor: `${activeBreakdown.color}25`, color: activeBreakdown.color }}>
                  {activeBreakdown.share}% of average total
                </span>
              </div>
              <div className="dh-savings">
                <span className="sav-label">Potential Yearly Reduction</span>
                <span className="sav-val">{activeBreakdown.savings}</span>
              </div>
            </div>

            <div className="breakdown-bar-track">
              <div
                className="breakdown-bar-fill"
                style={{ width: `${activeBreakdown.share * 3.7}%`, backgroundColor: activeBreakdown.color }}
              />
            </div>

            <div className="breakdown-tip-box">
              <div className="tip-badge">💡 ACTIONABLE SWAP</div>
              <p className="tip-text">{activeBreakdown.tip}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. FEATURES BENTO GRID
          ======================================================== */}
      <section className="ab2-section">
        <div className="ab2-section-head">
          <span className="ab2-eyebrow">PLATFORM CAPABILITIES</span>
          <h2>A Unified Suite for Climate Consciousness</h2>
          <p>Everything you need to measure, track, improve, and offset your personal ecological impact.</p>
        </div>

        <div className="ab2-features-grid">
          {FEATURES_LIST.map((f, i) => (
            <Link key={i} to={f.to} className="ab2-feature-card">
              <div className="feat-card-top">
                <div className="feat-icon-wrap">{f.icon}</div>
                <span className="feat-badge">{f.badge}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feat-cta">
                <span>{f.cta}</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================================================
          6. HOW VASUDHA WORKS (4-Step Sequential Journey)
          ======================================================== */}
      <section className="ab2-section" id="how-it-works">
        <div className="ab2-section-head center">
          <span className="ab2-eyebrow">THE WORKFLOW</span>
          <h2>How Vasudha Guides Your Journey</h2>
          <p>From day one calculation to monthly verified credentials.</p>
        </div>

        <div className="ab2-steps-grid">
          {STEPS.map((step, i) => (
            <div key={i} className="ab2-step-card">
              <div className="step-num-badge">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          7. CLIMATE PLEDGE SIMULATOR
          ======================================================== */}
      <section className="ab2-section">
        <div className="ab2-section-head center">
          <span className="ab2-eyebrow">INTERACTIVE SIMULATOR</span>
          <h2>Build Your Annual Climate Pledge</h2>
          <p>Toggle real habits below to estimate your cumulative yearly carbon savings and tree equivalents.</p>
        </div>

        <div className="ab2-pledge-container">
          <div className="pledge-items-grid">
            {PLEDGE_ITEMS.map((item) => {
              const isChecked = pledges.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pledge-toggle-card ${isChecked ? "active" : ""}`}
                  onClick={() => togglePledge(item.id)}
                >
                  <span className="p-icon">{item.icon}</span>
                  <div className="p-text">
                    <span className="p-title">{item.title}</span>
                    <span className="p-kg">~{item.kg} kg CO₂ / yr</span>
                  </div>
                  <div className="p-check">
                    <CheckCircle2 size={18} />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pledge-score-panel">
            <div className="score-gauge-ring">
              <svg viewBox="0 0 160 160" className="gauge-svg">
                <circle cx="80" cy="80" r="68" className="gauge-track" />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="gauge-fill"
                  style={{
                    strokeDasharray: 427,
                    strokeDashoffset: Math.max(0, 427 - (totalPledgeKg / 1400) * 427),
                  }}
                />
              </svg>
              <div className="gauge-center-text">
                <span className="gauge-num">{totalPledgeKg}</span>
                <span className="gauge-unit">kg CO₂ saved</span>
              </div>
            </div>

            <div className="pledge-trees-badge">
              <span className="pt-icon">🌳</span>
              <span>Equivalent to <strong>{equivalentTrees}</strong> mature trees absorbing CO₂ for a full year</span>
            </div>

            <p className="pledge-active-count">
              {pledges.size} of {PLEDGE_ITEMS.length} commitments selected
            </p>

            <Link to={user ? "/calculator" : "/login"} className="pledge-cta-btn">
              <span>{user ? "Calculate Your Real Baseline" : "Sign In & Begin Saving"}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. GRAND FINALE CTA
          ======================================================== */}
      <section className="ab2-section ab2-cta-section">
        <div className="ab2-cta-card">
          <div className="cta-sparkle-badge">
            <Sparkles size={14} />
            <span>JOIN THE COMMUNITY</span>
          </div>
          <h2>Every Fraction of a Degree Matters</h2>
          <p>
            Start tracking today, earn monthly honor certificates for measurable reductions, and build a greener world together.
          </p>
          <div className="cta-btn-row">
            <Link to={user ? "/dashboard" : "/login"} className="ab2-btn-primary">
              <span>{user ? "Go to Dashboard" : "Create Free Account"}</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/donate" className="ab2-btn-secondary">
              <span>Plant a Tree Now</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}