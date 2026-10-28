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
  Leaf,
  RotateCcw
} from "lucide-react";
import "../styles/About.css";

/* ================= DATA ================= */

const GLOBAL_STATS = [
  { icon: Globe2, value: 37.2, decimals: 1, unit: "Gt", label: "Global fossil CO₂ emissions released each year into our atmosphere." },
  { icon: Layers, value: 4.7, decimals: 1, unit: "Tons", label: "Average yearly carbon footprint per human on Earth." },
  { icon: TrendingDown, value: 1.5, decimals: 1, unit: "°C", label: "Critical climate boundary threshold we must work together to avoid." }
];

const PILLARS = [
  {
    icon: Compass,
    tag: "AWARENESS",
    title: "Precision Carbon Science",
    desc: "Calculate your commute, home electricity, and dietary emissions with standard scientific conversion factors and live regional AQI telemetry."
  },
  {
    icon: ShieldCheck,
    tag: "RECOGNITION",
    title: "Automated Monthly Honors",
    desc: "Reduce your footprint month-over-month to unlock Seedling, Bronze, Silver, Gold, and Platinum Certificates automatically mailed to your inbox on the last day of each month."
  },
  {
    icon: TreePine,
    tag: "RESTORATION",
    title: "Tangible Environmental Offsets",
    desc: "Plant verified trees through partnered afforestation drives and receive digital invoices with official serial tracking and environmental impact metrics."
  }
];

const BREAKDOWN_CATEGORIES = [
  { id: "transport", name: "Transport & Commute", share: 27, color: "#22c55e", tip: "Taking public transit or carpooling just 2 days a week cuts personal vehicle emissions by up to 40%.", savings: "~400 kg CO₂ / year" },
  { id: "energy", name: "Home Electricity", share: 24, color: "#06b6d4", tip: "Switching to LED lighting and eliminating vampire standby draw reduces home electric footprint by 15-20%.", savings: "~220 kg CO₂ / year" },
  { id: "food", name: "Diet & Food Waste", share: 22, color: "#facc15", tip: "Incorporating Meatless Mondays and minimizing food spoilage drastically cuts agricultural methane and nitrous oxide.", savings: "~180 kg CO₂ / year" },
  { id: "goods", name: "Consumption & Goods", share: 13, color: "#a855f7", tip: "Choosing second-hand electronics, repairing clothing, and buying durable goods reduces embodied manufacturing carbon.", savings: "~150 kg CO₂ / year" },
  { id: "waste", name: "Waste & Landfills", share: 8, color: "#3b82f6", tip: "Composting organic scraps prevents anaerobic decomposition in landfills, reducing direct methane emissions.", savings: "~90 kg CO₂ / year" },
  { id: "water", name: "Hot Water & Utilities", share: 6, color: "#ec4899", tip: "Installing aerated showerheads and lowering water heater thermostat by 5°C saves substantial electricity.", savings: "~70 kg CO₂ / year" }
];

/* donut geometry (precomputed) */
const DONUT_R = 70;
const DONUT_C = 2 * Math.PI * DONUT_R;
const DONUT_SEGS = (() => {
  let acc = 0;
  return BREAKDOWN_CATEGORIES.map((cat) => {
    const len = (cat.share / 100) * DONUT_C;
    const seg = Math.max(len - 4, 0);
    const out = { dash: `${seg} ${DONUT_C - seg}`, offset: -acc };
    acc += len;
    return out;
  });
})();

const FEATURES_LIST = [
  { to: "/login", icon: Calculator, badge: "CALCULATOR", title: "Scientific Carbon Calculator", desc: "Input your travel, power, and food habits to see your carbon total and air quality index in under 60 seconds.", cta: "Calculate Footprint" },
  { to: "/login", icon: Activity, badge: "TRACKER", title: "Daily Activity & Habit Log", desc: "Log daily sustainable choices and watch your cumulative emission reduction curve climb with interactive charts.", cta: "Start Tracking" },
  { to: "/login", icon: Award, badge: "CERTIFICATES", title: "Monthly Honor Certificates", desc: "Earn prestige honors from Seedling to Platinum. Certificates are automatically generated and emailed on month-end.", cta: "View Credentials" },
  { to: "/donate", icon: TreePine, badge: "AFFORESTATION", title: "Verified Tree Plantation", desc: "Contribute to afforestation projects with instant Razorpay payments and receive verifiable PDF donation invoices.", cta: "Plant Trees" }
];

const STEPS = [
  { num: "01", title: "Calculate Footprint", desc: "Quantify your daily transport, power consumption, and diet into verified kilograms of CO₂." },
  { num: "02", title: "Track Activity", desc: "Log sustainable actions every day to accumulate green reward points and monitor your reduction trajectory." },
  { num: "03", title: "Heal the Earth", desc: "Sponsor native saplings to offset non-avoidable emissions and receive verified tax-compliant receipts." },
  { num: "04", title: "Receive Honors", desc: "On the final day of each month, your official Certificate of Sustainability is automatically generated and emailed." }
];

const PLEDGE_ITEMS = [
  { id: "transit", title: "Carpool or transit 2 days/wk", kg: 400, icon: "🚌" },
  { id: "walk", title: "Walk or cycle short errands", kg: 250, icon: "🚶" },
  { id: "foodwaste", title: "Zero food waste at home", kg: 200, icon: "🍃" },
  { id: "meatless", title: "Plant-based meal days", kg: 160, icon: "🥗" },
  { id: "led", title: "LEDs & zero standby power", kg: 140, icon: "💡" },
  { id: "thrift", title: "Buy refurbished / second-hand", kg: 120, icon: "♻️" },
  { id: "coldwash", title: "Cold wash & air-dry clothes", kg: 100, icon: "👕" },
  { id: "shower", title: "Shorter water-efficient showers", kg: 70, icon: "🚿" }
];
const PLEDGE_MAX = PLEDGE_ITEMS.reduce((s, p) => s + p.kg, 0);
const GAUGE_R = 68;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

const MARQUEE = ["Calculate", "Track", "Certify", "Offset", "Restore", "Measure", "Reduce", "Honor"];

/* ================= HOOKS & SMALL COMPONENTS ================= */

function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const to = Number(target) || 0;
    const from = prev.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || from === to) {
      prev.current = to;
      setVal(to);
      return;
    }

    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const cur = from + (to - from) * eased;
      prev.current = cur;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}

const Num = ({ value, decimals = 0 }) => {
  const v = useCountUp(value, 700);
  return <>{v.toFixed(decimals)}</>;
};

/* counts up the first time it scrolls into view */
const CountUp = ({ value, decimals = 0 }) => {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setStarted(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const v = useCountUp(started ? value : 0, 1400);
  return <span ref={ref}>{v.toFixed(decimals)}</span>;
};

/* ================= 3D PARTICLE EARTH CANVAS ================= */

/* rough continent outlines as [lon, lat] */
const LAND = [
  // North America
  [[-165,64],[-155,71],[-125,70],[-95,69],[-82,68],[-65,60],[-56,52],[-66,44],[-76,36],[-81,30],[-80,25],[-90,29],[-97,26],[-97,19],[-88,16],[-83,9],[-78,8],[-86,12],[-95,16],[-105,20],[-112,28],[-118,33],[-124,40],[-124,48],[-135,58],[-150,60]],
  // Greenland
  [[-55,60],[-45,60],[-20,70],[-20,82],[-45,83],[-65,80],[-70,76],[-55,68]],
  // South America
  [[-78,8],[-72,12],[-62,10],[-50,0],[-35,-6],[-39,-15],[-48,-26],[-58,-38],[-65,-42],[-68,-54],[-74,-50],[-73,-38],[-71,-20],[-81,-6],[-80,0]],
  // Africa
  [[-17,21],[-10,32],[10,37],[32,31],[35,28],[43,12],[51,12],[40,-3],[40,-15],[35,-25],[20,-35],[17,-30],[12,-17],[9,-1],[9,4],[-8,4],[-17,14]],
  // Europe + Asia
  [[-10,36],[-9,43],[-2,48],[5,52],[8,57],[10,59],[5,62],[15,69],[30,71],[60,70],[80,73],[110,77],[140,72],[180,68],[180,65],[160,60],[140,54],[135,43],[127,38],[122,30],[110,20],[105,10],[100,2],[98,10],[92,22],[80,10],[73,18],[67,25],[58,24],[56,17],[43,13],[35,28],[36,36],[27,37],[22,37],[14,40],[8,44],[0,38],[-6,36]],
  // British Isles
  [[-5,50],[2,51],[0,58],[-6,58]],
  // Japan
  [[130,31],[135,34],[141,36],[142,43],[140,41],[133,35]],
  // Australia
  [[114,-22],[122,-18],[131,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[130,-32],[115,-34]]
];

function inPoly(lon, lat, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/* evenly spaced dots, kept only where they fall on land */
function buildLandPoints() {
  const land = [];
  const ocean = [];
  const step = 3.2; // degrees between latitude rings
  for (let lat = -84; lat <= 84; lat += step) {
    const lonStep = step / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
    for (let lon = -180; lon < 180; lon += lonStep) {
      const p = {
        lat: (lat * Math.PI) / 180,
        lon: (lon * Math.PI) / 180
      };
      if (LAND.some((poly) => inPoly(lon, lat, poly))) land.push(p);
      else ocean.push(p);
    }
  }
  return { land, ocean };
}

const EARTH_POINTS = buildLandPoints();
const EARTH_TILT = 0.38; // axial tilt toward the viewer

function EarthCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let width = 0;
    let height = 0;
    let rotation = 3.6; // start facing Asia / India
    const cosT = Math.cos(EARTH_TILT);
    const sinT = Math.sin(EARTH_TILT);

    /* keep the backing store in sync with the real on-screen size,
       so the circle can never be stretched into an oval */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    let ro;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    /* orthographic projection with tilt; returns screen x, y (up = negative) and depth z */
    const project = (p, radius) => {
      const lon = p.lon + rotation;
      const cl = Math.cos(p.lat);
      const x = cl * Math.sin(lon);
      const y = Math.sin(p.lat);
      const z = cl * Math.cos(lon);
      const y2 = y * cosT - z * sinT;
      const z2 = y * sinT + z * cosT;
      return { x: x * radius, y: -y2 * radius, z: z2 };
    };

    const render = () => {
      if (width && height) {
        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        /* 0.36 leaves room for the orbit ring so it is never clipped */
        const radius = Math.min(width, height) * 0.36;

        /* atmosphere glow */
        const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.45);
        glow.addColorStop(0, "rgba(34, 197, 94, 0.25)");
        glow.addColorStop(0.55, "rgba(250, 204, 21, 0.07)");
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.45, 0, Math.PI * 2);
        ctx.fill();

        /* ocean sphere */
        const sphere = ctx.createRadialGradient(
          cx - radius * 0.35, cy - radius * 0.35, radius * 0.1, cx, cy, radius
        );
        sphere.addColorStop(0, "#10382b");
        sphere.addColorStop(0.6, "#07201a");
        sphere.addColorStop(1, "#020a08");
        ctx.fillStyle = sphere;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(74, 222, 128, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (!reduce) rotation += 0.0035;

        /* faint ocean dots (front side only) */
        ctx.fillStyle = "rgba(74, 222, 128, 0.12)";
        for (let i = 0; i < EARTH_POINTS.ocean.length; i++) {
          const q = project(EARTH_POINTS.ocean[i], radius);
          if (q.z <= 0) continue;
          ctx.fillRect(cx + q.x - 0.5, cy + q.y - 0.5, 1, 1);
        }

        /* land dots, brighter toward the center of the disc */
        for (let i = 0; i < EARTH_POINTS.land.length; i++) {
          const q = project(EARTH_POINTS.land[i], radius);
          if (q.z <= 0) continue;
          ctx.fillStyle = `rgba(74, 222, 128, ${0.3 + q.z * 0.7})`;
          ctx.beginPath();
          ctx.arc(cx + q.x, cy + q.y, 0.9 + q.z * 1.3, 0, Math.PI * 2);
          ctx.fill();
        }

        /* limb shading so the edge reads as a sphere */
        const limb = ctx.createRadialGradient(cx, cy, radius * 0.7, cx, cy, radius);
        limb.addColorStop(0, "transparent");
        limb.addColorStop(1, "rgba(2, 10, 8, 0.55)");
        ctx.fillStyle = limb;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        /* orbit ring + gold satellite */
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(0.35);
        ctx.scale(1, 0.32);
        ctx.strokeStyle = "rgba(250, 204, 21, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
        ctx.stroke();

        const sat = -rotation * 3;
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(radius * 1.3 * Math.cos(sat), radius * 1.3 * Math.sin(sat), 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (!reduce) raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="abt-earth" aria-hidden="true" />;
}

/* ================= MAIN COMPONENT ================= */

export default function About() {
  const rootRef = useRef(null);
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [pledges, setPledges] = useState(new Set(["transit", "meatless", "led"]));
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* scroll reveal */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll(".abt-reveal");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }

    root.classList.add("abt-js");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  /* card spotlight */
  const onMove = (e) => {
    const card = e.target.closest && e.target.closest(".abt-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const togglePledge = (id) => {
    setPledges((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPledgeKg = PLEDGE_ITEMS.reduce((sum, p) => (pledges.has(p.id) ? sum + p.kg : sum), 0);
  const equivalentTrees = totalPledgeKg / 21;
  const kmNotDriven = Math.round(totalPledgeKg / 0.12);
  const active = BREAKDOWN_CATEGORIES[activeCategory];

  let n = 0;
  const d = () => ({ "--d": n++ });

  return (
    <div className="abt" ref={rootRef} onMouseMove={onMove}>
      <div className="abt-bg" aria-hidden="true" />

      <main className="abt-main">
        {/* ================= HERO ================= */}
        <section className="abt-hero">
          <div className="abt-hero-left">
            <div className="abt-badge abt-item" style={d()}>
              <i className="abt-dot" />
              Planetary sustainability intelligence
            </div>

            <h1 className="abt-item" style={d()}>
              Making Personal Climate Action <em>Measurable, Visible &amp; Honored</em>
              <b>.</b>
            </h1>

            <p className="abt-lead abt-item" style={d()}>
              Vasudha translates your daily habits into actionable carbon data, certifies your
              month-over-month reductions with official credentials, and funds verified tree
              plantations to restore our biosphere.
            </p>

            <div className="abt-cta abt-item" style={d()}>
              <Link to={user ? "/calculator" : "/login"} className="abt-btn abt-btn-gold">
                {user ? "Open Calculator" : "Start Tracking Free"} <ArrowRight size={18} />
              </Link>
              <a href="#how-it-works" className="abt-btn abt-btn-ghost">
                Explore How It Works
              </a>
            </div>

            <div className="abt-pills abt-item" style={d()}>
              <div>
                <strong>100%</strong>
                <span>Scientific Formulas</span>
              </div>
              <div>
                <strong>5 Tiers</strong>
                <span>Monthly Certificates</span>
              </div>
              <div>
                <strong>Razorpay</strong>
                <span>Verified Afforestation</span>
              </div>
            </div>
          </div>

          <div className="abt-hero-visual abt-item" style={d()}>
            <EarthCanvas />
            <div className="abt-chip abt-chip-1">
              <Activity size={15} /> Live Emission Telemetry
            </div>
            <div className="abt-chip abt-chip-2">
              <Award size={15} /> Automated End-of-Month Honors
            </div>
            <div className="abt-chip abt-chip-3">
              <TreePine size={15} /> Afforestation Receipts
            </div>
          </div>
        </section>

        {/* ================= MARQUEE ================= */}
        <div className="abt-marquee" aria-hidden="true">
          <div className="abt-marquee-track">
            {[...MARQUEE, ...MARQUEE].map((w, i) => (
              <span key={i}>
                <Leaf size={14} /> {w}
              </span>
            ))}
          </div>
        </div>

        {/* ================= GLOBAL STATS ================= */}
        <section className="abt-section abt-reveal">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">The global challenge</span>
            <h2>
              The numbers that define <em>our generation</em>
            </h2>
            <p>
              Understanding the scale of global greenhouse emissions makes individual action
              urgently meaningful.
            </p>
          </header>

          <div className="abt-grid-3">
            {GLOBAL_STATS.map((st, i) => {
              const Icon = st.icon;
              return (
                <div key={i} className="abt-card abt-stat abt-item" style={{ "--d": i + 1 }}>
                  <span className="abt-ico">
                    <Icon size={20} />
                  </span>
                  <div className="abt-stat-num">
                    <strong>
                      <CountUp value={st.value} decimals={st.decimals} />
                    </strong>
                    <span>{st.unit}</span>
                  </div>
                  <p>{st.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= PILLARS ================= */}
        <section className="abt-section abt-reveal">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">Why Vasudha</span>
            <h2>
              The three pillars of <em>conscious stewardship</em>
            </h2>
            <p>
              We combine personal telemetry, motivational recognition, and direct ecological
              restoration into one cohesive platform.
            </p>
          </header>

          <div className="abt-grid-3">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="abt-card abt-pillar abt-item" style={{ "--d": i + 1 }}>
                  <div className="abt-pillar-top">
                    <span className="abt-ico big">
                      <Icon size={24} />
                    </span>
                    <span className="abt-tag">{p.tag}</span>
                  </div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= BREAKDOWN ================= */}
        <section className="abt-section abt-reveal">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">Source intelligence</span>
            <h2>
              Where does an individual's <em>footprint</em> come from?
            </h2>
            <p>
              Select any sector to inspect its typical lifestyle share and high-impact mitigation
              swaps.
            </p>
          </header>

          <div className="abt-card abt-breakdown abt-item" style={{ "--d": 1 }}>
            <div className="abt-bd-left">
              <div className="abt-donut">
                <svg viewBox="0 0 180 180" role="img" aria-label="Footprint breakdown by sector">
                  <g transform="rotate(-90 90 90)">
                    <circle className="abt-donut-bg" cx="90" cy="90" r={DONUT_R} />
                    {BREAKDOWN_CATEGORIES.map((cat, i) => (
                      <circle
                        key={cat.id}
                        className={`abt-seg ${i === activeCategory ? "on" : ""}`}
                        cx="90"
                        cy="90"
                        r={DONUT_R}
                        stroke={cat.color}
                        strokeDasharray={DONUT_SEGS[i].dash}
                        strokeDashoffset={DONUT_SEGS[i].offset}
                        onMouseEnter={() => setActiveCategory(i)}
                        onClick={() => setActiveCategory(i)}
                      />
                    ))}
                  </g>
                </svg>
                <div className="abt-donut-center">
                  <strong style={{ color: active.color }}>
                    <Num value={active.share} />%
                  </strong>
                  <span>of average total</span>
                </div>
              </div>

              <div className="abt-legend">
                {BREAKDOWN_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`abt-legend-btn ${i === activeCategory ? "active" : ""}`}
                    onClick={() => setActiveCategory(i)}
                    style={{ "--c": cat.color }}
                  >
                    <i />
                    <span>{cat.name}</span>
                    <b>{cat.share}%</b>
                  </button>
                ))}
              </div>
            </div>

            <div className="abt-bd-right" key={active.id}>
              <span className="abt-badge-soft" style={{ "--c": active.color }}>
                {active.share}% of average total
              </span>
              <h3>{active.name}</h3>

              <div className="abt-bd-save">
                <span>Potential yearly reduction</span>
                <strong>{active.savings}</strong>
              </div>

              <div className="abt-track">
                <i style={{ width: `${Math.min(active.share * 3.7, 100)}%`, background: active.color }} />
              </div>

              <div className="abt-tip">
                <span>💡 Actionable swap</span>
                <p>{active.tip}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="abt-section abt-reveal">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">Platform capabilities</span>
            <h2>
              A unified suite for <em>climate consciousness</em>
            </h2>
            <p>
              Everything you need to measure, track, improve, and offset your personal ecological
              impact.
            </p>
          </header>

          <div className="abt-grid-2">
            {FEATURES_LIST.map((f, i) => {
              const Icon = f.icon;
              return (
                <Link
                  key={i}
                  to={f.to}
                  className="abt-card abt-feature abt-item"
                  style={{ "--d": i + 1 }}
                >
                  <div className="abt-feature-top">
                    <span className="abt-ico big">
                      <Icon size={24} />
                    </span>
                    <span className="abt-tag">{f.badge}</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                  <span className="abt-feature-cta">
                    {f.cta} <ChevronRight size={16} />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="abt-section abt-reveal" id="how-it-works">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">The workflow</span>
            <h2>
              How Vasudha guides <em>your journey</em>
            </h2>
            <p>From day one calculation to monthly verified credentials.</p>
          </header>

          <div className="abt-steps">
            <div className="abt-steps-line" aria-hidden="true">
              <i style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} />
            </div>

            {STEPS.map((step, i) => (
              <div
                key={i}
                tabIndex={0}
                className={`abt-card abt-step abt-item ${i <= activeStep ? "done" : ""}`}
                style={{ "--d": i + 1 }}
                onMouseEnter={() => setActiveStep(i)}
                onFocus={() => setActiveStep(i)}
                onClick={() => setActiveStep(i)}
              >
                <span className="abt-step-num">{step.num}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= PLEDGE SIMULATOR ================= */}
        <section className="abt-section abt-reveal">
          <header className="abt-heading abt-item" style={{ "--d": 0 }}>
            <span className="abt-eyebrow">Interactive simulator</span>
            <h2>
              Build your annual <em>climate pledge</em>
            </h2>
            <p>
              Toggle real habits below to estimate your cumulative yearly carbon savings and tree
              equivalents.
            </p>
          </header>

          <div className="abt-pledge">
            <div className="abt-pledge-left abt-item" style={{ "--d": 1 }}>
              <div className="abt-pledge-tools">
                <button type="button" onClick={() => setPledges(new Set(PLEDGE_ITEMS.map((p) => p.id)))}>
                  <CheckCircle2 size={14} /> Select all
                </button>
                <button type="button" onClick={() => setPledges(new Set())}>
                  <RotateCcw size={14} /> Reset
                </button>
              </div>

              <div className="abt-pledge-grid">
                {PLEDGE_ITEMS.map((item) => {
                  const on = pledges.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`abt-toggle ${on ? "active" : ""}`}
                      onClick={() => togglePledge(item.id)}
                      aria-pressed={on}
                    >
                      <span className="abt-toggle-icon">{item.icon}</span>
                      <span className="abt-toggle-text">
                        <strong>{item.title}</strong>
                        <small>~{item.kg} kg CO₂ / yr</small>
                      </span>
                      <CheckCircle2 className="abt-toggle-check" size={20} />
                    </button>
                  );
                })}
              </div>
            </div>

            <aside className="abt-card abt-score abt-item" style={{ "--d": 2 }}>
              <div className="abt-gauge">
                <svg viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="abtGauge" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r={GAUGE_R} className="abt-gauge-bg" />
                  <circle
                    cx="80"
                    cy="80"
                    r={GAUGE_R}
                    className="abt-gauge-fg"
                    strokeDasharray={GAUGE_C}
                    strokeDashoffset={Math.max(0, GAUGE_C - (totalPledgeKg / PLEDGE_MAX) * GAUGE_C)}
                  />
                </svg>
                <div className="abt-gauge-center">
                  <strong>
                    <Num value={totalPledgeKg} />
                  </strong>
                  <span>kg CO₂ saved / yr</span>
                </div>
              </div>

              <div className="abt-equiv">
                <div>
                  <TreePine size={18} />
                  <strong>{equivalentTrees.toFixed(1)}</strong>
                  <small>trees for a year</small>
                </div>
                <div>
                  <Globe2 size={18} />
                  <strong>{kmNotDriven.toLocaleString()}</strong>
                  <small>km not driven</small>
                </div>
              </div>

              <p className="abt-count">
                {pledges.size} of {PLEDGE_ITEMS.length} commitments selected
              </p>

              <Link to={user ? "/calculator" : "/login"} className="abt-btn abt-btn-gold abt-full">
                {user ? "Calculate Your Real Baseline" : "Sign In & Begin Saving"}{" "}
                <ArrowRight size={16} />
              </Link>
            </aside>
          </div>
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="abt-section abt-reveal abt-last">
          <div className="abt-banner abt-item" style={{ "--d": 0 }}>
            <Globe2 className="abt-banner-bg" aria-hidden="true" />
            <span className="abt-eyebrow">
              <Sparkles size={13} /> Join the community
            </span>
            <h2>
              Every fraction of a <em>degree</em> matters
            </h2>
            <p>
              Start tracking today, earn monthly honor certificates for measurable reductions, and
              build a greener world together.
            </p>
            <div className="abt-cta center">
              <Link to={user ? "/dashboard" : "/login"} className="abt-btn abt-btn-gold">
                {user ? "Go to Dashboard" : "Create Free Account"} <ArrowRight size={18} />
              </Link>
              <Link to="/donate" className="abt-btn abt-btn-ghost">
                Plant a Tree Now
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}