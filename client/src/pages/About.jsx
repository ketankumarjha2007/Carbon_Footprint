import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import "../styles/About.css";

/* ================= DATA ================= */

const STATS = [
  { end: 37, decimals: 0, suffix: " Gt", label: "CO₂ released from fossil fuels every year (approx.)" },
  { end: 4.7, decimals: 1, suffix: " t", label: "CO₂ per person worldwide every year (approx.)" },
  { end: 1.2, decimals: 1, suffix: " °C", label: "global warming above pre-industrial levels (approx.)" },
];

const CARDS = [
  { icon: "🌫️", title: "What is a carbon footprint?", text: "A carbon footprint measures the total greenhouse gases produced by human activities like transportation, electricity use and food consumption. Understanding it helps us make better environmental choices." },
  { icon: "🔥", title: "Why it matters", text: "Climate change is accelerating due to increasing carbon emissions. By tracking and reducing our footprint, we can slow global warming and protect ecosystems around the world." },
  { icon: "🌿", title: "Our mission", text: "Vasudha helps people monitor their carbon emissions, learn sustainable habits and build a greener future through awareness and responsible choices." },
];

/* illustrative split of a typical household footprint (not personal data) */
const SOURCES = [
  { id: "transport", icon: "🚗", name: "Transport", share: 27, color: "#a3f76b", tip: "Fewer solo car trips, carpooling, trains and cycling cut this fastest." },
  { id: "electricity", icon: "⚡", name: "Electricity", share: 24, color: "#ffd166", tip: "Efficient appliances, LED lighting and a green power plan add up quietly." },
  { id: "food", icon: "🍽️", name: "Food", share: 22, color: "#ff8f70", tip: "More plants, less waste and local seasonal produce lower food emissions." },
  { id: "shopping", icon: "🛍️", name: "Shopping", share: 13, color: "#d2a8ff", tip: "Repair, reuse and buy fewer, longer-lasting things." },
  { id: "waste", icon: "♻️", name: "Waste", share: 8, color: "#71d8ce", tip: "Segregate, compost and recycle so less ends up in landfill." },
  { id: "water", icon: "💧", name: "Water", share: 6, color: "#78baff", tip: "Fix leaks and use less hot water. Heating it is the hidden cost." },
];

const STEPS = [
  { icon: "📊", title: "Measure", front: "Find your number", back: "Enter your travel, energy and food habits and see your carbon footprint in seconds." },
  { icon: "🔍", title: "Understand", front: "See what drives it", back: "Find out which activities add the most emissions, so you know where to focus." },
  { icon: "🌱", title: "Reduce", front: "Make small swaps", back: "Get simple, practical habits that cut emissions without changing your whole life." },
  { icon: "🌍", title: "Inspire", front: "Spread the change", back: "Share what works. When more people act, the impact grows far beyond one person." },
];

const HABITS = ["Take the stairs", "Carry a bottle", "Switch off standby", "Meatless Monday", "Walk short trips", "Fix the leak", "Air-dry clothes", "Buy second-hand", "Compost scraps", "Share a ride"];

/* ================= HOOKS ================= */

function useReveal(rootRef) {
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll("[data-reveal]");
    if (!els) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

/* ================= COMPONENTS ================= */

function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, raf, pts = [], running = true;

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(70, Math.floor((w * h) / 24000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.4 + 0.5,
      }));
    };
    build();

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, dm = Math.hypot(dx, dy);
        if (dm < 120 && dm > 0) { p.x += (dx / dm) * 1.2; p.y += (dy / dm) * 1.2; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(125,220,143,0.7)"; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 110) {
            ctx.strokeStyle = `rgba(74,222,128,${0.14 * (1 - d / 110)})`;
            ctx.lineWidth = 0.7; ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    /* pause when the tab is hidden to save battery */
    const onVis = () => {
      running = !document.hidden;
      if (running) draw(); else cancelAnimationFrame(raf);
    };
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("resize", build);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <canvas ref={ref} className="ab-canvas" aria-hidden="true" />;
}

function TiltCard({ children, className = "", max = 8 }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const el = ref.current, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };
  const onLeave = () => {
    ref.current.style.setProperty("--rx", "0deg");
    ref.current.style.setProperty("--ry", "0deg");
  };
  return (
    <div className={`tilt ${className}`} ref={ref} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="tilt-inner">
        <span className="tilt-glare" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

function Counter({ end, decimals = 0, suffix = "" }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min((t - start) / 1600, 1);
        setVal(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toFixed(decimals)}{suffix}</span>;
}

function Globe() {
  return (
    <div className="globe-scene" aria-hidden="true">
      <div className="globe">
        <div className="globe-halo" />
        <div className="globe-sphere">
          <div className="globe-land" />
          <div className="globe-land globe-land-2" />
          <div className="globe-clouds" />
          <div className="globe-shade" />
        </div>
        <div className="ring ring-a" />
        <div className="ring ring-b" />
        <div className="orbit orbit-1"><i /></div>
        <div className="orbit orbit-2"><i /></div>
      </div>
    </div>
  );
}

/* interactive donut: pick a source, see its share and a practical tip */
function FootprintExplorer() {
  const [active, setActive] = useState(0);
  const R = 84, C = 2 * Math.PI * R, GAP = 4;
  const offsets = SOURCES.map((_, i) =>
    SOURCES.slice(0, i).reduce((total, source) => total + (source.share / 100) * C, 0)
  );
  const cur = SOURCES[active];

  return (
    <div className="explorer">
      <div className="donut-wrap">
        <svg viewBox="0 0 220 220" className="donut" role="img" aria-label="Typical footprint split by category">
          {SOURCES.map((s, i) => {
            const len = (s.share / 100) * C;
            return (
              <circle
                key={s.id}
                cx="110" cy="110" r={R}
                className={`seg ${i === active ? "on" : ""}`}
                style={{ "--segment-color": s.color }}
                strokeDasharray={`${Math.max(len - GAP, 0)} ${C}`}
                strokeDashoffset={-offsets[i]}
              />
            );
          })}
        </svg>
        <div className="donut-core" aria-live="polite">
          <span className="core-icon">{cur.icon}</span>
          <strong>{cur.share}%</strong>
          <span>{cur.name}</span>
        </div>
      </div>

      <div className="explorer-side">
        <div className="chips" role="tablist" aria-label="Footprint sources">
          {SOURCES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              className={`chip ${i === active ? "on" : ""}`}
              onClick={() => setActive(i)}
            >
              <span aria-hidden="true">{s.icon}</span> {s.name}
            </button>
          ))}
        </div>
        <p className="explorer-tip" key={cur.id}>{cur.tip}</p>
        <p className="fine">Illustrative split for a typical household. Your own numbers will differ, and the calculator shows them.</p>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

function About() {
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(0);

  useReveal(pageRef);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* cursor spotlight, globe parallax, scroll progress */
  useEffect(() => {
    const page = pageRef.current, hero = heroRef.current;
    const onMove = (e) => {
      page.style.setProperty("--px", `${e.clientX}px`);
      page.style.setProperty("--py", `${e.clientY}px`);
      if (e.pointerType === "touch") return;
      hero.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      hero.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      page.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(3) : 0);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const ctaPath = user ? "/calculator" : "/login";
  const ctaText = user ? "Open the calculator" : "Sign in to start";
  const s = STEPS[step];

  return (
    <div className="about-page" ref={pageRef}>
      <div className="ab-progress" aria-hidden="true" />
      <ParticleCanvas />
      <div className="ab-spotlight" aria-hidden="true" />
      <div className="ab-glow ab-glow-1" aria-hidden="true" />
      <div className="ab-glow ab-glow-2" aria-hidden="true" />

      {/* HERO */}
      <section className="about-hero" ref={heroRef}>
        <div className="hero-copy">
          <p className="hero-eyebrow"><span aria-hidden="true" /> A better future starts with awareness</p>
          <h1>
            Make your carbon footprint <em>visible.</em>
          </h1>
          <p className="hero-sub">
            Vasudha helps you understand what your daily choices cost the
            planet, and shows the smallest changes that make the biggest
            difference.
          </p>
          <div className="hero-actions">
            <a href="#mission" className="ab-btn ab-btn-solid">Our mission</a>
            <a href="#how" className="ab-btn ab-btn-ghost">How it works</a>
          </div>
          <a className="hero-scroll" href="#impact"><span aria-hidden="true">↓</span> Scroll to explore</a>
        </div>
        <Globe />
      </section>

      {/* HABIT MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[...HABITS, ...HABITS].map((h, i) => <span key={i}>{h}</span>)}
        </div>
      </div>

      {/* STATS */}
      <section className="ab-section stats" id="impact">
        <div className="section-intro stats-intro">
          <span className="section-eyebrow">THE BIG PICTURE</span>
          <h2 className="section-title">Small choices. Planet-sized impact.</h2>
          <p className="section-lead">A clearer view of the challenge is the first step toward changing it.</p>
        </div>
        {STATS.map((st, i) => (
          <div key={st.label} className="rise" data-reveal style={{ "--d": `${i * 0.1}s` }}>
            <TiltCard className="stat" max={6}>
              <strong className="stat-num"><Counter {...st} /></strong>
              <span className="stat-label">{st.label}</span>
            </TiltCard>
          </div>
        ))}
      </section>

      {/* INFO CARDS */}
      <section className="ab-section about-cards" id="mission">
        <div className="section-intro mission-intro">
          <span className="section-eyebrow">WHY VASUDHA</span>
          <h2 className="section-title">Make the invisible, understandable.</h2>
          <p className="section-lead">Climate action gets easier when you can see where you are, and what to do next.</p>
        </div>
        {CARDS.map((c, i) => (
          <div key={c.title} className="rise" data-reveal style={{ "--d": `${i * 0.12}s` }}>
            <TiltCard className="about-card">
              <div className="card-icon">{c.icon}</div>
              <h2>{c.title}</h2>
              <p>{c.text}</p>
            </TiltCard>
          </div>
        ))}
      </section>

      {/* EXPLORER */}
      <section className="ab-section rise" data-reveal>
        <h2 className="section-title">Where your footprint comes from</h2>
        <p className="section-lead">
          Everyday choices add up. Pick a category to see how much it usually
          contributes and where a small change helps most.
        </p>
        <FootprintExplorer />
      </section>

      {/* HOW IT WORKS */}
      <section className="ab-section" id="how">
        <h2 className="section-title rise" data-reveal>How Vasudha works</h2>
        <div className="how rise" data-reveal>
          <div className="how-tabs" role="tablist" aria-label="Steps">
            {STEPS.map((t, i) => (
              <button
                key={t.title}
                role="tab"
                aria-selected={i === step}
                className={`how-tab ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}
                onClick={() => setStep(i)}
              >
                <span className="how-no">{i + 1}</span>
                <span>{t.title}</span>
              </button>
            ))}
          </div>
          <div className="how-panel" key={s.title} role="tabpanel">
            <span className="how-icon" aria-hidden="true">{s.icon}</span>
            <div>
              <h3>{s.front}</h3>
              <p>{s.back}</p>
            </div>
            <button
              className="ab-btn ab-btn-ghost"
              onClick={() => setStep((step + 1) % STEPS.length)}
            >
              {step === STEPS.length - 1 ? "Start over" : "Next step"}
            </button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="ab-section rise" data-reveal>
        <TiltCard className="cta-card" max={4}>
          <h2>Every small step counts</h2>
          <p>
            Start by learning your number, then make one change this week.
            Together we can leave a cleaner planet behind.
          </p>
          <Link to={ctaPath} className="ab-btn ab-btn-solid">{ctaText}</Link>
        </TiltCard>
      </section>
    </div>
  );
}

export default About;