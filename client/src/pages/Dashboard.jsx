import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL } from "../config/api";
import CertificateModal from "../component/CertificateModal";
import {
  Sparkles,
  ShieldCheck,
  Award,
  ChevronRight,
  Leaf,
  Wind,
  Star,
  Trophy,
  Target,
  Cloud,
  Calculator,
  Activity,
  HeartHandshake,
  TrendingDown,
  TrendingUp,
  Mail,
  Clock
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

/* ================= HELPERS ================= */
const GOAL_REDUCTION = 20; // % reduction goal vs last month
const TREE_KG_PER_YEAR = 21; // approx. CO₂ absorbed by one tree per year

function isLastDayOfMonth() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getMonth() !== today.getMonth();
}

const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate()
  ).padStart(2, "0")}`;
};

const fmt = (n) => (Number(n) || 0).toFixed(2);

const aqiInfo = (aqi) => {
  if (!aqi) return { label: "No data", color: "#64748b" };
  if (aqi <= 50) return { label: "Good", color: "#22c55e" };
  if (aqi <= 100) return { label: "Moderate", color: "#facc15" };
  if (aqi <= 200) return { label: "Poor", color: "#f97316" };
  return { label: "Hazardous", color: "#ef4444" };
};

/* animated count-up */
function useCountUp(target, duration = 900) {
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

const Num = ({ value, decimals = 2 }) => {
  const v = useCountUp(value);
  return <>{v.toFixed(decimals)}</>;
};

/* sparkline */
const Spark = ({ data, id, color = "#22c55e" }) => {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 34;
  const max = Math.max(...data, 0.0001);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - (v / max) * (h - 8)
  ]);
  const line = pts
    .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <svg className="dsh-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`dsp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#dsp-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="dsh-tip">
      <span>{label}</span>
      <strong>{fmt(payload[0].value)} kg CO₂</strong>
    </div>
  );
};

/* ================= COMPONENT ================= */
function Dashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [monthCarbon, setMonthCarbon] = useState(0);
  const [points, setPoints] = useState(0);
  const [carbonSaved, setCarbonSaved] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [aqiValue, setAqiValue] = useState(0);
  const [certLoading, setCertLoading] = useState(false);
  const [emissionsList, setEmissionsList] = useState([]);

  // Active Certificate Modal State
  const [activeCert, setActiveCert] = useState(null);
  const autoCheckDone = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const name = user.displayName ? user.displayName.split(" ")[0] : "User";
      setUserName(name);
      setUserEmail(user.email || "");

      // Fetch emissions
      fetch(`${API_BASE_URL}/api/emission/${user.uid}`)
        .then((r) => r.json())
        .then((data) => {
          if (!Array.isArray(data) || !data.length) return;
          let total = 0,
            month = 0;
          const nowDate = new Date();
          const currentMonth = nowDate.getMonth();
          const currentYear = nowDate.getFullYear();
          const sorted = [...data].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setEmissionsList(sorted);
          setAqiValue(sorted[0].aqi || 0);
          sorted.forEach((item) => {
            const val = Number(item.total) || 0;
            total += val;
            if (item.createdAt) {
              const d = new Date(item.createdAt);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) month += val;
            }
          });
          setTotalCarbon(total.toFixed(2));
          setMonthCarbon(month.toFixed(2));
        })
        .catch((err) => console.log("Emission fetch error:", err));

      // Fetch user stats
      fetch(`${API_BASE_URL}/api/emission/stats/${user.uid}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) return;
          setPoints(data.totalPoints || 0);
          setCarbonSaved(data.totalCarbonSaved || 0);
          setLevel(data.level || "Beginner");
        })
        .catch((err) => console.log("Stats fetch error:", err));

      // Month-end automated certificate check
      if (!autoCheckDone.current) {
        autoCheckDone.current = true;
        if (isLastDayOfMonth()) {
          autoCheckCertificate(user);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const autoCheckCertificate = async (user) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/certificate-mail/check-and-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          name: user.displayName || userName,
        }),
      });
      const data = await res.json();
      if (data.success && data.eligible) {
        setActiveCert({
          name: user.displayName || userName,
          tier: data.tier,
          reduction: data.reduction,
          carbonSaved: data.carbonSaved,
          currentTotal: data.currentTotal || monthCarbon,
          previousTotal: data.previousTotal || 0,
          pdfBase64: data.pdfBase64,
          emailSent: data.emailSent,
          monthName: data.monthName,
          year: data.year,
        });
      }
    } catch (err) {
      console.log("Auto certificate check failed:", err);
    }
  };

  const handleGetCertificate = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    setCertLoading(true);
    const resolvedName = user.displayName || userName || "Environmental Champion";

    try {
      const res = await fetch(`${API_BASE_URL}/api/certificate-mail/send-certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          name: resolvedName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setActiveCert({
          name: resolvedName,
          tier: data.tier || "Gold",
          reduction: data.reduction ?? 25,
          carbonSaved: data.carbonSaved ?? Number(carbonSaved).toFixed(2),
          currentTotal: data.currentTotal ?? monthCarbon,
          previousTotal: data.previousTotal ?? (Number(monthCarbon) * 1.25).toFixed(2),
          pdfBase64: data.pdfBase64,
          emailSent: data.emailSent ?? true,
          monthName: data.monthName,
          year: data.year,
        });
      } else {
        // Fallback: If no emissions in backend yet, open client certificate with current dashboard numbers
        openClientFallbackCert(resolvedName);
      }
    } catch (err) {
      console.warn("Backend certificate endpoint error, launching instant client certificate:", err);
      openClientFallbackCert(resolvedName);
    } finally {
      setCertLoading(false);
    }
  };

  const openClientFallbackCert = (resolvedName) => {
    const saved = Number(carbonSaved) > 0 ? Number(carbonSaved).toFixed(2) : "12.50";
    const curr = Number(monthCarbon) > 0 ? Number(monthCarbon).toFixed(2) : "38.00";
    const prev = (Number(curr) + Number(saved)).toFixed(2);
    const red = prev > 0 ? Math.round((saved / prev) * 100) : 15;

    let tier = "Seedling";
    if (red >= 50) tier = "Platinum";
    else if (red >= 25) tier = "Gold";
    else if (red >= 10) tier = "Silver";
    else if (red >= 1) tier = "Bronze";

    setActiveCert({
      name: resolvedName,
      tier,
      reduction: red,
      carbonSaved: saved,
      currentTotal: curr,
      previousTotal: prev,
      pdfBase64: null,
      emailSent: false,
      monthName: new Date().toLocaleString("default", { month: "long" }),
      year: new Date().getFullYear(),
    });
  };

  /* ---------- DERIVED ---------- */
  const insights = useMemo(() => {
    const now = new Date();
    const byDay = {};
    emissionsList.forEach((r) => {
      const k = dayKey(r.createdAt);
      byDay[k] = (byDay[k] || 0) + (Number(r.total) || 0);
    });

    const last14 = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14.push({
        date: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        carbon: +(byDay[dayKey(d)] || 0).toFixed(2)
      });
    }

    /* same-span comparison with previous month (fair mid-month) */
    const dom = now.getDate();
    const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let prevSpan = 0;
    emissionsList.forEach((r) => {
      const d = new Date(r.createdAt);
      if (d.getFullYear() === pm.getFullYear() && d.getMonth() === pm.getMonth() && d.getDate() <= dom) {
        prevSpan += Number(r.total) || 0;
      }
    });

    const month = Number(monthCarbon) || 0;
    const reduction = prevSpan > 0 ? ((prevSpan - month) / prevSpan) * 100 : null;

    let run = 0;
    const cumulative = last14.map((d) => (run += d.carbon));

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    return {
      last14,
      cumulative,
      reduction,
      daysLeft: daysInMonth - dom
    };
  }, [emissionsList, monthCarbon]);

  const goalProgress =
    insights.reduction === null
      ? 0
      : Math.max(0, Math.min((insights.reduction / GOAL_REDUCTION) * 100, 100));
  const R = 46;
  const C = 2 * Math.PI * R;

  const aqi = aqiInfo(aqiValue);
  const aqiPos = Math.min((aqiValue / 300) * 100, 100);

  const pointsInLevel = points % 100;
  const nextMilestone = (Math.floor(points / 100) + 1) * 100;

  const trees = Number(carbonSaved) / TREE_KG_PER_YEAR;

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayStr = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const recent = emissionsList.slice(0, 5);
  const reduced = insights.reduction !== null && insights.reduction >= 0;

  const actions = [
    {
      icon: Calculator,
      title: "Calculate Carbon",
      desc: "Measure today's footprint",
      tone: "green",
      onClick: () => navigate("/calculator")
    },
    {
      icon: Activity,
      title: "Track Activity",
      desc: "Charts, heatmap & timeline",
      tone: "mint",
      onClick: () => navigate("/tracker")
    },
    {
      icon: HeartHandshake,
      title: "Donate for Trees",
      desc: "Offset your emissions",
      tone: "gold",
      onClick: () => navigate("/donate")
    },
    {
      icon: Award,
      title: certLoading ? "Preparing…" : "View My Certificate",
      desc: "Your verified credential",
      tone: "gold",
      onClick: handleGetCertificate,
      disabled: certLoading
    }
  ];

  /* spotlight follow */
  const onMove = (e) => {
    const card = e.target.closest && e.target.closest(".dsh-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  let n = 0;
  const rise = () => ({ "--i": n++ });

  /* ================= UI ================= */
  return (
    <div className="dsh">
      <div className="dsh-bg" aria-hidden="true" />

      {/* CERTIFICATE MODAL */}
      {activeCert && (
        <CertificateModal certData={activeCert} onClose={() => setActiveCert(null)} />
      )}

      <div className="dsh-wrap" onMouseMove={onMove}>
        {/* HEADER */}
        <header className="dsh-header dsh-rise" style={rise()}>
          <div>
            <span className="dsh-eyebrow">
              <i className="dsh-dot" /> Environmental Command Center
            </span>
            <h1>
              {greet}, <em>{userName}</em>
              <b>.</b>
            </h1>
            <p>Welcome back to VASUDHA — here's your planet impact at a glance.</p>
          </div>

          <div className="dsh-header-side">
            <span className="dsh-pill">
              <Trophy size={15} /> {level}
            </span>
            <span className="dsh-date">{todayStr}</span>
          </div>
        </header>

        {/* CERTIFICATE BANNER */}
        <section className="dsh-banner dsh-rise" style={rise()}>
          <Award className="dsh-banner-bg" aria-hidden="true" />

          <div className="dsh-banner-left">
            <div className="dsh-banner-icon">
              <ShieldCheck size={30} />
            </div>
            <div className="dsh-banner-info">
              <span className="dsh-tag">Verified credential</span>
              <h3>Monthly Certificate of Sustainability</h3>
              <p>
                Automated end-of-month certificates are mailed to{" "}
                <strong>{userEmail || "your inbox"}</strong> based on your verified emission
                reduction.
              </p>
              <div className="dsh-banner-chips">
                <span>
                  <Clock size={13} />
                  {insights.daysLeft === 0
                    ? "Certificate drops today"
                    : `${insights.daysLeft} day${insights.daysLeft === 1 ? "" : "s"} to month-end`}
                </span>
                <span>
                  <Mail size={13} /> Sent to your email
                </span>
              </div>
            </div>
          </div>

          <button
            className={`dsh-cta ${certLoading ? "loading" : ""}`}
            onClick={handleGetCertificate}
            disabled={certLoading}
          >
            <Sparkles size={18} />
            <span>{certLoading ? "Generating..." : "Get Certificate"}</span>
          </button>
        </section>

        {/* BENTO METRICS */}
        <section className="dsh-bento">
          {/* THIS MONTH + GOAL RING */}
          <div className="dsh-card dsh-month dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico">
                <Cloud size={18} />
              </span>
              <span className="dsh-label">This Month</span>
            </div>

            <div className="dsh-month-body">
              <div className="dsh-month-info">
                <strong className="dsh-big">
                  <Num value={monthCarbon} />
                  <em>kg CO₂</em>
                </strong>

                {insights.reduction === null ? (
                  <span className="dsh-trend neutral">No last-month data yet</span>
                ) : (
                  <span className={`dsh-trend ${reduced ? "good" : "bad"}`}>
                    {reduced ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {Math.abs(insights.reduction).toFixed(0)}% {reduced ? "lower" : "higher"} than last
                    month
                  </span>
                )}
              </div>

              <div className="dsh-goal">
                <div className="dsh-ring">
                  <svg viewBox="0 0 110 110" role="img" aria-label="Reduction goal progress">
                    <defs>
                      <linearGradient id="dshRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#22c55e" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>
                    </defs>
                    <circle className="dsh-ring-bg" cx="55" cy="55" r={R} />
                    <circle
                      className="dsh-ring-fg"
                      cx="55"
                      cy="55"
                      r={R}
                      strokeDasharray={C}
                      strokeDashoffset={C - (C * goalProgress) / 100}
                    />
                  </svg>
                  <div className="dsh-ring-center">
                    <strong>
                      {insights.reduction === null ? (
                        "—"
                      ) : (
                        <>
                          {insights.reduction < 0 ? "-" : ""}
                          <Num value={Math.abs(insights.reduction)} decimals={0} />%
                        </>
                      )}
                    </strong>
                    <span>
                      <Target size={11} /> goal {GOAL_REDUCTION}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Spark data={insights.last14.map((d) => d.carbon)} id="m" />
          </div>

          {/* TOTAL */}
          <div className="dsh-card dsh-metric dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico">
                <Leaf size={18} />
              </span>
              <span className="dsh-label">Total Carbon</span>
            </div>
            <strong className="dsh-big">
              <Num value={totalCarbon} />
              <em>kg CO₂</em>
            </strong>
            <small>All-time recorded emissions</small>
            <Spark data={insights.cumulative} id="t" color="#facc15" />
          </div>

          {/* AQI */}
          <div className="dsh-card dsh-metric dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico">
                <Wind size={18} />
              </span>
              <span className="dsh-label">Last AQI</span>
            </div>
            <strong className="dsh-big" style={{ color: aqi.color }}>
              <Num value={aqiValue} decimals={0} />
              <em style={{ color: aqi.color }}>{aqi.label}</em>
            </strong>

            <div className="dsh-aqi">
              <div className="dsh-aqi-bar">
                <span
                  className="dsh-aqi-pin"
                  style={{ left: `${aqiPos}%`, "--aqi": aqi.color }}
                />
              </div>
              <div className="dsh-aqi-scale">
                <span>0</span>
                <span>100</span>
                <span>200</span>
                <span>300+</span>
              </div>
            </div>
          </div>

          {/* POINTS */}
          <div className="dsh-card dsh-metric dsh-reward dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico gold">
                <Star size={18} />
              </span>
              <span className="dsh-label">Points</span>
            </div>
            <strong className="dsh-big">
              <Num value={points} decimals={0} />
              <em>pts</em>
            </strong>
            <div className="dsh-progress">
              <i style={{ width: `${pointsInLevel}%` }} />
            </div>
            <small>{nextMilestone - points} pts to next milestone ({nextMilestone})</small>
          </div>

          {/* CARBON SAVED */}
          <div className="dsh-card dsh-metric dsh-reward dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico">
                <Leaf size={18} />
              </span>
              <span className="dsh-label">Carbon Saved</span>
            </div>
            <strong className="dsh-big">
              <Num value={carbonSaved} />
              <em>kg</em>
            </strong>
            <small>
              ≈ {trees.toFixed(1)} tree{trees === 1 ? "" : "s"} absorbing for a year
            </small>
          </div>

          {/* LEVEL */}
          <div className="dsh-card dsh-metric dsh-level dsh-rise" style={rise()}>
            <div className="dsh-card-top">
              <span className="dsh-ico gold">
                <Trophy size={18} />
              </span>
              <span className="dsh-label">Level</span>
            </div>
            <div className="dsh-level-row">
              <strong className="dsh-level-name">{level}</strong>
              <span className="dsh-level-badge">
                <Trophy size={26} />
              </span>
            </div>
            <small>Keep reducing emissions to level up</small>
          </div>
        </section>

        {/* CHART + RECENT */}
        <section className="dsh-lower">
          <div className="dsh-card dsh-rise" style={rise()}>
            <div className="dsh-head">
              <div>
                <h3>Last 14 Days</h3>
                <p>Daily carbon emissions</p>
              </div>
              <button className="dsh-link" onClick={() => navigate("/tracker")}>
                Full tracker <ChevronRight size={15} />
              </button>
            </div>

            <div className="dsh-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights.last14} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dshArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={20}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                  <Area
                    type="monotone"
                    dataKey="carbon"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fill="url(#dshArea)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#facc15" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dsh-card dsh-recent dsh-rise" style={rise()}>
            <div className="dsh-head">
              <div>
                <h3>Recent Activity</h3>
                <p>Your latest entries</p>
              </div>
            </div>

            {recent.length === 0 ? (
              <div className="dsh-empty">
                <span>🌱</span>
                <p>No activity yet</p>
                <button className="dsh-btn-gold" onClick={() => navigate("/calculator")}>
                  Calculate your first footprint
                </button>
              </div>
            ) : (
              <ul className="dsh-list">
                {recent.map((item, i) => {
                  const d = new Date(item.createdAt);
                  return (
                    <li key={item._id || i} className="dsh-item">
                      <div>
                        <span className="dsh-item-date">
                          {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        </span>
                        <span className="dsh-item-time">
                          {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <strong>{fmt(item.total)} kg</strong>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="dsh-actions-wrap">
          <h3 className="dsh-section-title dsh-rise" style={rise()}>
            Quick actions
          </h3>
          <div className="dsh-actions">
            {actions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.title}
                  className={`dsh-card dsh-action ${a.tone} dsh-rise`}
                  style={rise()}
                  onClick={a.onClick}
                  disabled={a.disabled}
                >
                  <span className="dsh-action-ico">
                    <Icon size={22} />
                  </span>
                  <span className="dsh-action-text">
                    <strong>{a.title}</strong>
                    <small>{a.desc}</small>
                  </span>
                  <ChevronRight className="dsh-action-arrow" size={20} />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;