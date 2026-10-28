import { useEffect, useMemo, useRef, useState } from "react";
import { auth } from "../firebase";
import "../styles/tracker.css";
import { API_BASE_URL } from "../config/api";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell
} from "recharts";

/* ================= CONFIG ================= */
const DAILY_GOAL = 10; // kg CO₂ per day — change to your target
const REFRESH_MS = 10000;
const HEAT_WEEKS = 12;
const RANGES = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 }
];
const FILTERS = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" }
];
const PAGE_SIZE = 15;

/* ================= HELPERS ================= */
const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
    x.getDate()
  ).padStart(2, "0")}`;
};

const fmt = (n) => (Number(n) || 0).toFixed(2);

const friendlyDate = (key) => {
  const today = dayKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === today) return "Today";
  if (key === dayKey(y)) return "Yesterday";
  const [yy, mm, dd] = key.split("-").map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
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
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg className="trk-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sp-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

/* chart tooltip */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="trk-tip">
      <span className="trk-tip-label">{label}</span>
      <strong>{fmt(payload[0].value)} kg CO₂</strong>
    </div>
  );
};

/* ================= COMPONENT ================= */
function Tracker() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState(7);
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [lastSync, setLastSync] = useState(null);

  /* ---------- FETCH ---------- */
  useEffect(() => {
    let alive = true;

    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          if (alive) {
            setError("User not logged in");
            setLoading(false);
          }
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/emission/${user.uid}`);
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();

        const sorted = (Array.isArray(data) ? [...data] : []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        if (alive) {
          setRecords(sorted);
          setError("");
          setLastSync(new Date());
        }
      } catch (err) {
        if (alive) setError("Failed to load data");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  /* ---------- DERIVED DATA ---------- */
  const byDay = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const k = dayKey(r.createdAt);
      map[k] = (map[k] || 0) + (Number(r.total) || 0);
    });
    return map;
  }, [records]);

  const dailyData = useMemo(() => {
    const out = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push({
        date: d.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        carbon: +(byDay[dayKey(d)] || 0).toFixed(2)
      });
    }
    return out;
  }, [byDay, range]);

  const monthlyData = useMemo(() => {
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      out.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString(undefined, { month: "short" }),
        carbon: 0
      });
    }
    records.forEach((r) => {
      const d = new Date(r.createdAt);
      const item = out.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (item) item.carbon += Number(r.total) || 0;
    });
    return out.map((m) => ({ ...m, carbon: +m.carbon.toFixed(2) }));
  }, [records]);

  const stats = useMemo(() => {
    const now = new Date();
    const yest = new Date();
    yest.setDate(now.getDate() - 1);

    const today = byDay[dayKey(now)] || 0;
    const yesterday = byDay[dayKey(yest)] || 0;
    const change = yesterday === 0 ? null : ((today - yesterday) / yesterday) * 100;

    const rangeTotal = dailyData.reduce((s, d) => s + d.carbon, 0);
    const avg = rangeTotal / range;

    const month = records.reduce((s, r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? s + (Number(r.total) || 0)
        : s;
    }, 0);

    const peak = dailyData.reduce((p, d) => (d.carbon > p.carbon ? d : p), {
      date: "—",
      carbon: 0
    });

    /* streak of days at/under goal */
    let streak = 0;
    const sd = new Date();
    if (byDay[dayKey(sd)] === undefined) sd.setDate(sd.getDate() - 1);
    while (streak < 365) {
      const v = byDay[dayKey(sd)];
      if (v !== undefined && v <= DAILY_GOAL) {
        streak++;
        sd.setDate(sd.getDate() - 1);
      } else break;
    }

    /* this week vs last week */
    let thisWeek = 0;
    let lastWeek = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const v = byDay[dayKey(d)] || 0;
      if (i < 7) thisWeek += v;
      else lastWeek += v;
    }
    const weekChange = lastWeek === 0 ? null : ((thisWeek - lastWeek) / lastWeek) * 100;

    /* projection */
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projected = (month / now.getDate()) * daysInMonth;

    return {
      today, yesterday, change, avg, month, peak,
      streak, thisWeek, lastWeek, weekChange, projected
    };
  }, [byDay, dailyData, range, records]);

  const goalPct = Math.min((stats.today / DAILY_GOAL) * 100, 100);
  const over = stats.today > DAILY_GOAL;
  const R = 52;
  const C = 2 * Math.PI * R;

  /* ---------- HEATMAP ---------- */
  const heat = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (HEAT_WEEKS - 1) * 7);

    const cells = [];
    for (let i = 0; i < HEAT_WEEKS * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const future = d > today;
      const v = byDay[dayKey(d)] || 0;
      let level = 0;
      if (v > 0) {
        const p = v / DAILY_GOAL;
        level = p < 0.25 ? 1 : p < 0.5 ? 2 : p <= 1 ? 3 : 4;
      }
      cells.push({
        key: dayKey(d),
        future,
        level,
        title: `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} · ${fmt(v)} kg`
      });
    }
    return cells;
  }, [byDay]);

  /* ---------- TIMELINE ---------- */
  const filtered = useMemo(() => {
    const now = new Date();
    return records.filter((r) => {
      if (filter === "today") return dayKey(r.createdAt) === dayKey(now);
      if (filter === "week") return now - new Date(r.createdAt) <= 7 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [records, filter]);

  const grouped = useMemo(() => {
    const shown = filtered.slice(0, visible);
    const groups = [];
    shown.forEach((r) => {
      const k = dayKey(r.createdAt);
      let g = groups[groups.length - 1];
      if (!g || g.key !== k) {
        g = { key: k, items: [], total: 0 };
        groups.push(g);
      }
      g.items.push(r);
      g.total += Number(r.total) || 0;
    });
    return groups;
  }, [filtered, visible]);

  useEffect(() => setVisible(PAGE_SIZE), [filter]);

  /* spotlight follow */
  const onMove = (e) => {
    const card = e.target.closest && e.target.closest(".trk-card");
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${e.clientX - r.left}px`);
    card.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  /* ================= STATES ================= */
  if (loading) {
    return (
      <div className="trk">
        <div className="trk-bg" aria-hidden="true" />
        <div className="trk-wrap">
          <div className="trk-skel trk-skel-title" />
          <div className="trk-hero">
            <div className="trk-skel trk-skel-ring" />
            <div className="trk-stats">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="trk-skel trk-skel-card" />
              ))}
            </div>
          </div>
          <div className="trk-skel trk-skel-chart" />
        </div>
      </div>
    );
  }

  if (error && records.length === 0) {
    return (
      <div className="trk trk-center">
        <div className="trk-bg" aria-hidden="true" />
        <div className="trk-card trk-msg">
          <span className="trk-msg-icon">⚠️</span>
          <h3>{error}</h3>
          <p>Please check your connection or sign in again.</p>
          <button className="trk-btn trk-btn-gold" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const trendUp = stats.change !== null && stats.change > 0;
  const weekUp = stats.weekChange !== null && stats.weekChange > 0;
  const spark7 = dailyData.slice(-7).map((d) => d.carbon);
  const sparkRange = dailyData.map((d) => d.carbon);
  const sparkMonth = monthlyData.map((m) => m.carbon);

  const tip =
    stats.today === 0
      ? "Nothing logged today yet — add an activity to keep your streak alive."
      : over
      ? "You're above today's goal. Swapping one short ride for a walk can bring it down."
      : "You're on track today. Keep it up!";

  let n = 0;
  const rise = () => ({ "--i": n++ });

  /* ================= UI ================= */
  return (
    <div className="trk">
      <div className="trk-bg" aria-hidden="true" />

      <div className="trk-wrap" onMouseMove={onMove}>
        {/* HEADER */}
        <header className="trk-header trk-rise" style={rise()}>
          <div>
            <span className="trk-eyebrow">
              <i className="trk-dot" /> Live · Carbon Intelligence
            </span>
            <h1>
              Carbon Activity <em>Tracker</em>
              <b>.</b>
            </h1>
            <p>Monitor your daily carbon footprint in real time.</p>
          </div>
          <div className="trk-sync">
            {lastSync
              ? `Synced ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Syncing…"}
          </div>
        </header>

        {/* HERO */}
        <section className="trk-hero">
          <div className="trk-card trk-goal trk-rise" style={rise()}>
            <h3 className="trk-label">Today's Carbon</h3>

            <div className="trk-ring">
              <svg viewBox="0 0 120 120" role="img" aria-label="Daily goal progress">
                <defs>
                  <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={over ? "#f59e0b" : "#22c55e"} />
                    <stop offset="100%" stopColor={over ? "#ef4444" : "#facc15"} />
                  </linearGradient>
                </defs>
                <circle className="trk-ring-bg" cx="60" cy="60" r={R} />
                <circle
                  className="trk-ring-fg"
                  cx="60"
                  cy="60"
                  r={R}
                  strokeDasharray={C}
                  strokeDashoffset={C - (C * goalPct) / 100}
                />
              </svg>
              <div className="trk-ring-center">
                <strong className={over ? "bad" : ""}>
                  <Num value={stats.today} decimals={2} />
                </strong>
                <span>kg CO₂</span>
              </div>
            </div>

            <div className="trk-goal-foot">
              <span className="trk-chip">Goal {DAILY_GOAL} kg</span>
              <p className={`trk-goal-note ${over ? "bad" : "good"}`}>
                {over
                  ? `Over goal by ${fmt(stats.today - DAILY_GOAL)} kg`
                  : `${fmt(DAILY_GOAL - stats.today)} kg left today`}
              </p>
            </div>
          </div>

          <div className="trk-stats">
            <div className="trk-card trk-stat trk-rise" style={rise()}>
              <span className="trk-label">vs Yesterday</span>
              <strong className={stats.change === null ? "" : trendUp ? "bad" : "good"}>
                {stats.change === null ? (
                  "—"
                ) : (
                  <>
                    {trendUp ? "▲" : "▼"} <Num value={Math.abs(stats.change)} decimals={0} />%
                  </>
                )}
              </strong>
              <small>{fmt(stats.yesterday)} kg yesterday</small>
              <Spark data={spark7} id="a" color={trendUp ? "#f59e0b" : "#22c55e"} />
            </div>

            <div className="trk-card trk-stat trk-rise" style={rise()}>
              <span className="trk-label">Daily Average</span>
              <strong>
                <Num value={stats.avg} />
              </strong>
              <small>kg over last {range} days</small>
              <Spark data={sparkRange} id="b" />
            </div>

            <div className="trk-card trk-stat trk-rise" style={rise()}>
              <span className="trk-label">This Month</span>
              <strong>
                <Num value={stats.month} />
              </strong>
              <small>kg CO₂ total</small>
              <Spark data={sparkMonth} id="c" color="#facc15" />
            </div>

            <div className="trk-card trk-stat trk-rise" style={rise()}>
              <span className="trk-label">Peak Day</span>
              <strong>
                <Num value={stats.peak.carbon} />
              </strong>
              <small>
                {stats.peak.date} · {records.length} entries
              </small>
              <Spark data={sparkRange} id="d" color="#facc15" />
            </div>
          </div>
        </section>

        {/* CHARTS */}
        <section className="trk-charts">
          <div className="trk-card trk-chart trk-rise" style={rise()}>
            <div className="trk-chart-head">
              <div>
                <h3>Daily Emissions</h3>
                <p>Last {range} days · dashed line is your goal</p>
              </div>
              <div className="trk-seg" role="tablist">
                {RANGES.map((r) => (
                  <button
                    key={r.days}
                    role="tab"
                    aria-selected={range === r.days}
                    className={range === r.days ? "active" : ""}
                    onClick={() => setRange(r.days)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="trk-chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
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
                    minTickGap={18}
                  />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                  <ReferenceLine
                    y={DAILY_GOAL}
                    stroke="#fbbf24"
                    strokeDasharray="5 5"
                    strokeOpacity={0.7}
                    ifOverflow="extendDomain"
                  />
                  <Area
                    type="monotone"
                    dataKey="carbon"
                    stroke="#22c55e"
                    strokeWidth={3}
                    fill="url(#areaGrad)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#facc15" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="trk-card trk-chart trk-rise" style={rise()}>
            <div className="trk-chart-head">
              <div>
                <h3>Monthly Emissions</h3>
                <p>Last 6 months</p>
              </div>
            </div>

            <div className="trk-chart-body">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.35} />
                    </linearGradient>
                    <linearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                  <Bar dataKey="carbon" radius={[8, 8, 0, 0]} maxBarSize={44}>
                    {monthlyData.map((m, i) => (
                      <Cell
                        key={m.key}
                        fill={i === monthlyData.length - 1 ? "url(#barGold)" : "url(#barGrad)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* HEATMAP + INSIGHTS */}
        <section className="trk-lower">
          <div className="trk-card trk-rise" style={rise()}>
            <div className="trk-chart-head">
              <div>
                <h3>Activity Heatmap</h3>
                <p>Last {HEAT_WEEKS} weeks · darker means higher emissions</p>
              </div>
            </div>

            <div className="trk-heat">
              {heat.map((c) => (
                <span
                  key={c.key}
                  title={c.future ? "" : c.title}
                  className={`trk-cell l${c.level}${c.future ? " future" : ""}`}
                />
              ))}
            </div>

            <div className="trk-legend">
              <span>Less</span>
              {[0, 1, 2, 3].map((l) => (
                <i key={l} className={`trk-cell l${l}`} />
              ))}
              <span>More</span>
              <i className="trk-cell l4" />
              <span>Over goal</span>
            </div>
          </div>

          <div className="trk-card trk-insights trk-rise" style={rise()}>
            <div className="trk-chart-head">
              <div>
                <h3>Insights</h3>
                <p>Auto-generated from your data</p>
              </div>
            </div>

            <ul className="trk-ins">
              <li>
                <span className="trk-ins-ico">🔥</span>
                <div>
                  <small>Under-goal streak</small>
                  <strong>
                    {stats.streak} {stats.streak === 1 ? "day" : "days"}
                  </strong>
                </div>
              </li>
              <li>
                <span className="trk-ins-ico">📈</span>
                <div>
                  <small>This week vs last</small>
                  <strong className={stats.weekChange === null ? "" : weekUp ? "bad" : "good"}>
                    {stats.weekChange === null
                      ? "—"
                      : `${weekUp ? "▲" : "▼"} ${Math.abs(stats.weekChange).toFixed(0)}%`}
                  </strong>
                </div>
              </li>
              <li>
                <span className="trk-ins-ico">🎯</span>
                <div>
                  <small>Projected this month</small>
                  <strong>{fmt(stats.projected)} kg</strong>
                </div>
              </li>
            </ul>

            <p className="trk-tipbox">💡 {tip}</p>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="trk-card trk-timeline trk-rise" style={rise()}>
          <div className="trk-chart-head">
            <div>
              <h3>Activity Timeline</h3>
              <p>
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <div className="trk-seg">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={filter === f.key ? "active" : ""}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="trk-empty">
              <span>🌱</span>
              <p>No activity yet</p>
              <small>Start tracking to see your impact!</small>
            </div>
          ) : (
            <>
              <div className="trk-groups">
                {grouped.map((g) => (
                  <div key={g.key} className="trk-group">
                    <div className="trk-group-head">
                      <span>{friendlyDate(g.key)}</span>
                      <span>{fmt(g.total)} kg</span>
                    </div>

                    <ul className="trk-list">
                      {g.items.map((item, idx) => {
                        const time = new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        });
                        const val = Number(item.total) || 0;
                        const pct = Math.min((val / DAILY_GOAL) * 100, 100);
                        return (
                          <li key={item._id || `${g.key}-${idx}`} className="trk-item">
                            <span className="trk-pin" />
                            <div className="trk-item-main">
                              <span className="trk-time">{time}</span>
                              <div className="trk-bar">
                                <i className={val > DAILY_GOAL ? "hot" : ""} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <strong className="trk-val">{fmt(val)} kg CO₂</strong>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {visible < filtered.length && (
                <button
                  className="trk-btn trk-btn-gold trk-more"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  Load more ({filtered.length - visible} remaining)
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Tracker;