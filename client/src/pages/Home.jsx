import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import videoFile from "../assets/video.mp4";
import {
  Activity,
  Sparkles,
  Wind,
  Award,
  HeartHandshake,
  Star,
  Cloud,
  Factory,
  FlaskConical,
  FlaskRound,
  Sun,
  Leaf,
  Thermometer,
  Droplets,
  Gauge,
  Eye,
  CloudSun,
  Navigation,
  MapPin,
  RefreshCw,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

/* ================= HELPERS ================= */
const formatValue = (value, decimals = 0) => {
  if (value === null || value === undefined) return "--";
  return Number(value).toFixed(decimals);
};

const getWindDirection = (degree) => {
  if (degree === null || degree === undefined) return "--";
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(degree / 45) % 8];
};

const aqiInfo = (aqi) => {
  if (aqi === null || aqi === undefined)
    return { label: "AQI Unavailable", color: "#64748b", advice: "We couldn't read the air quality for your area right now." };
  if (aqi <= 50)
    return { label: "Good Air Quality", color: "#22c55e", advice: "The air is clean — a great time to be outside." };
  if (aqi <= 100)
    return { label: "Moderate Air Quality", color: "#facc15", advice: "Acceptable air. Very sensitive people should limit long outdoor effort." };
  if (aqi <= 150)
    return { label: "Unhealthy for Sensitive Groups", color: "#fb923c", advice: "Children, elders and asthma patients should reduce time outdoors." };
  if (aqi <= 200)
    return { label: "Unhealthy Air Quality", color: "#f97316", advice: "Everyone may feel effects. Consider a mask outdoors." };
  if (aqi <= 300)
    return { label: "Very Unhealthy Air", color: "#ef4444", advice: "Avoid outdoor activity and keep windows closed." };
  return { label: "Hazardous Air Quality", color: "#a855f7", advice: "Stay indoors. Air is dangerous for everyone." };
};

const uvLabel = (uv) => {
  if (uv === null || uv === undefined) return "";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
};

const barColor = (pct) =>
  pct < 33 ? "#22c55e" : pct < 66 ? "#facc15" : pct < 85 ? "#f59e0b" : "#ef4444";

/* animated count-up */
function useCountUp(target, duration = 1000) {
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
  const v = useCountUp(value);
  return <>{v.toFixed(decimals)}</>;
};

/* ================= STATIC CONTENT ================= */
const POLLUTANTS = [
  { key: "pm25", label: "PM2.5", icon: Cloud, decimals: 1, max: 150, note: "Fine particles" },
  { key: "pm10", label: "PM10", icon: Wind, decimals: 1, max: 250, note: "Coarse particles" },
  { key: "carbonMonoxide", label: "CO", icon: Factory, decimals: 0, max: 4000, note: "Carbon monoxide" },
  { key: "nitrogenDioxide", label: "NO₂", icon: FlaskConical, decimals: 1, max: 200, note: "Nitrogen dioxide" },
  { key: "sulphurDioxide", label: "SO₂", icon: FlaskRound, decimals: 1, max: 200, note: "Sulphur dioxide" },
  { key: "ozone", label: "O₃", icon: Sun, decimals: 1, max: 240, note: "Ground-level ozone" }
];

const FEATURES = [
  { icon: Activity, title: "Real-Time Carbon Analytics", desc: "Track emissions instantly with advanced monitoring systems." },
  { icon: Sparkles, title: "Environmental Intelligence", desc: "Powerful AI insights designed for sustainable decisions." },
  { icon: Wind, title: "Smart AQI Monitoring", desc: "Live air quality data with pollutant and weather analysis." },
  { icon: Award, title: "Verified Certificates", desc: "Earn a monthly sustainability certificate for real emission cuts." },
  { icon: HeartHandshake, title: "Plant & Offset", desc: "Donate for trees and offset what you can't cut yourself." },
  { icon: Star, title: "Rewards & Levels", desc: "Collect points, level up and celebrate every bit of progress." }
];

const STEPS = [
  { title: "Calculate", desc: "Log your travel, energy and lifestyle to see your carbon footprint." },
  { title: "Track", desc: "Watch trends, heatmaps and insights update in real time." },
  { title: "Reduce & Earn", desc: "Cut emissions, earn points and a verified monthly certificate." }
];

/* ================= COMPONENT ================= */
function Home() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const mounted = useRef(true);

  const [environment, setEnvironment] = useState(null);
  const [loadingEnvironment, setLoadingEnvironment] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  /* ---------- AUTH (to swap the CTA) ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setLoggedIn(!!u));
    return () => unsub();
  }, []);

  /* ---------- PARTICLES ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf;
    let particles = [];

    const build = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 22000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.3,
        dx: (Math.random() - 0.5) * 0.35,
        dy: (Math.random() - 0.5) * 0.35
      }));
    };

    const animate = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
          p.x += p.dx;
          p.y += p.dy;
          if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(114,255,177,0.35)";
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(114,255,177,${Math.max(0, 0.1 - dist / 1300)})`;
              ctx.stroke();
            }
          }
        });
      }
      raf = requestAnimationFrame(animate);
    };

    build();
    animate();
    window.addEventListener("resize", build);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
    };
  }, []);

  /* ---------- SCROLL REVEAL ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll(".hm-reveal");

    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }

    root.classList.add("hm-js");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  /* ---------- CURSOR GLOW + CARD SPOTLIGHT ---------- */
  const onMove = (e) => {
    if (glowRef.current) {
      glowRef.current.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
    }
    const card = e.target.closest && e.target.closest(".hm-card");
    if (card) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  };

  /* ---------- ENVIRONMENT (same Open-Meteo logic) ---------- */
  const fetchEnvironment = useCallback(async (latitude, longitude) => {
    try {
      const airQualityUrl =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
        `&forecast_hours=1` +
        `&timezone=auto`;

      const weatherUrl =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${latitude}` +
        `&longitude=${longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility,uv_index` +
        `&timezone=auto`;

      const [airResponse, weatherResponse] = await Promise.all([
        fetch(airQualityUrl),
        fetch(weatherUrl)
      ]);

      if (!airResponse.ok) throw new Error("Air quality request failed");
      if (!weatherResponse.ok) throw new Error("Weather request failed");

      const airData = await airResponse.json();
      const weatherData = await weatherResponse.json();
      if (!mounted.current) return;

      const h = airData?.hourly;
      const c = weatherData?.current;

      setEnvironment({
        aqi: h?.us_aqi?.[0] ?? null,
        pollutants: {
          pm25: h?.pm2_5?.[0] ?? null,
          pm10: h?.pm10?.[0] ?? null,
          carbonMonoxide: h?.carbon_monoxide?.[0] ?? null,
          nitrogenDioxide: h?.nitrogen_dioxide?.[0] ?? null,
          sulphurDioxide: h?.sulphur_dioxide?.[0] ?? null,
          ozone: h?.ozone?.[0] ?? null
        },
        weather: {
          temperature: c?.temperature_2m ?? null,
          humidity: c?.relative_humidity_2m ?? null,
          apparentTemperature: c?.apparent_temperature ?? null,
          pressure: c?.pressure_msl ?? null,
          windSpeed: c?.wind_speed_10m ?? null,
          windDirection: c?.wind_direction_10m ?? null,
          cloudCover: c?.cloud_cover ?? null,
          visibility: c?.visibility ?? null,
          uvIndex: c?.uv_index ?? null
        },
        latitude,
        longitude,
        updatedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      });

      setErrorMsg("");
      setLocationMessage("Live data based on your location");
    } catch (error) {
      console.error("Environment Error:", error);
      if (mounted.current) setErrorMsg("Unable to load environmental data");
    } finally {
      if (mounted.current) setLoadingEnvironment(false);
    }
  }, []);

  const requestLocation = useCallback(() => {
    setLoadingEnvironment(true);
    setErrorMsg("");

    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setLoadingEnvironment(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => fetchEnvironment(position.coords.latitude, position.coords.longitude),
      (error) => {
        console.error("Location Error:", error);
        if (!mounted.current) return;
        setErrorMsg(
          error.code === 1 ? "Location permission denied" : "Couldn't detect your location"
        );
        setLoadingEnvironment(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [fetchEnvironment]);

  useEffect(() => {
    mounted.current = true;
    requestLocation();
    return () => {
      mounted.current = false;
    };
  }, [requestLocation]);

  /* ---------- DERIVED ---------- */
  const aqi = environment?.aqi ?? null;
  const info = aqiInfo(aqi);
  const aqiPct = aqi === null ? 0 : Math.min((aqi / 300) * 100, 100);
  const R = 52;
  const C = 2 * Math.PI * R;
  const w = environment?.weather;
  const hasData = !!environment;

  let n = 0;
  const d = () => ({ "--d": n++ });

  const primary = loggedIn
    ? { to: "/dashboard", label: "Open Dashboard" }
    : { to: "/login", label: "Launch Platform" };

  /* ================= UI ================= */
  return (
    <div className="hm" ref={rootRef} onMouseMove={onMove}>
      <div className="hm-bg" aria-hidden="true" />
      <canvas ref={canvasRef} className="hm-particles" aria-hidden="true" />
      <div ref={glowRef} className="hm-glow" aria-hidden="true" />

      <main className="hm-main">
        {/* ================= HERO ================= */}
        <section className="hm-hero">
          <div className="hm-hero-left">
            <div className="hm-badge hm-item" style={d()}>
              <i className="hm-dot" />
              Dharti Ko Samjho, Bhavishya Badlo — Welcome to Vasudha.
            </div>

            <h1 className="hm-item" style={d()}>
              Build a <em>Greener</em>
              <br />
              Future with Data<b>.</b>
            </h1>

            <p className="hm-lead hm-item" style={d()}>
              VASUDHA delivers intelligent carbon analytics, live environmental monitoring and
              sustainability insights through a real-time environmental intelligence system.
            </p>

            <div className="hm-cta hm-item" style={d()}>
              <Link to={primary.to} className="hm-btn hm-btn-gold">
                {primary.label} <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="hm-btn hm-btn-ghost">
                Explore More
              </Link>
            </div>

            <div className="hm-stats hm-item" style={d()}>
              <div>
                <strong>
                  <Num value={98} />%
                </strong>
                <span>Prediction accuracy</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Live monitoring</span>
              </div>
              <div>
                <strong>AI</strong>
                <span>Smart insights</span>
              </div>
            </div>
          </div>

          {/* LIVE ENVIRONMENT CARD */}
          <div className="hm-hero-right">
            <div className="hm-card hm-env hm-item" style={d()}>
              <div className="hm-env-top">
                <span className="hm-live">
                  <i className="hm-dot" /> Current environment
                </span>
                {hasData && <span className="hm-updated">Updated {environment.updatedAt}</span>}
              </div>

              {loadingEnvironment ? (
                <div className="hm-state">
                  <div className="hm-spinner" />
                  <p>Detecting your location...</p>
                </div>
              ) : errorMsg && !hasData ? (
                <div className="hm-state">
                  <MapPin size={30} />
                  <p>{errorMsg}</p>
                  <button className="hm-btn hm-btn-ghost hm-small" onClick={requestLocation}>
                    <RefreshCw size={15} /> Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="hm-gauge-row">
                    <div className="hm-gauge" style={{ "--c": info.color }}>
                      <svg viewBox="0 0 120 120" role="img" aria-label="Air quality index">
                        <circle className="hm-g-bg" cx="60" cy="60" r={R} />
                        <circle
                          className="hm-g-fg"
                          cx="60"
                          cy="60"
                          r={R}
                          strokeDasharray={C}
                          strokeDashoffset={C - (C * aqiPct) / 100}
                        />
                      </svg>
                      <div className="hm-g-center">
                        <strong>{aqi === null ? "--" : <Num value={aqi} />}</strong>
                        <span>US AQI</span>
                      </div>
                    </div>

                    <div className="hm-aqi-text">
                      <span className="hm-chip" style={{ "--c": info.color }}>
                        {info.label}
                      </span>
                      <p>{info.advice}</p>
                      <small>
                        <MapPin size={12} /> {locationMessage || "Location based monitoring"}
                      </small>
                    </div>
                  </div>

                  <div className="hm-quick">
                    <div>
                      <Thermometer size={18} />
                      <strong>{formatValue(w?.temperature, 1)}°C</strong>
                      <small>Temperature</small>
                    </div>
                    <div>
                      <Droplets size={18} />
                      <strong>{formatValue(w?.humidity)}%</strong>
                      <small>Humidity</small>
                    </div>
                    <div>
                      <Wind size={18} />
                      <strong>{formatValue(w?.windSpeed, 1)} km/h</strong>
                      <small>Wind</small>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="hm-float hm-card hm-item" style={d()}>
              <span className="hm-float-ico">
                <Leaf size={20} />
              </span>
              <div>
                <strong>Dharti Ka Digital Saathi</strong>
                <small>Your intelligent companion for a greener tomorrow.</small>
              </div>
            </div>
          </div>
        </section>

        {/* ================= AIR QUALITY ================= */}
        <section className="hm-section hm-reveal">
          <header className="hm-heading hm-item" style={{ "--d": 0 }}>
            <span className="hm-eyebrow">Air quality</span>
            <h2>
              What is in the <em>air</em> you breathe?
            </h2>
            <p>Live pollutant concentrations for your location.</p>
          </header>

          <div className="hm-grid-3">
            {POLLUTANTS.map((p, i) => {
              const Icon = p.icon;
              const val = environment?.pollutants?.[p.key];
              const pct = val === null || val === undefined ? 0 : Math.min((val / p.max) * 100, 100);
              return (
                <div key={p.key} className="hm-card hm-pollutant hm-item" style={{ "--d": i + 1 }}>
                  <div className="hm-pol-top">
                    <span className="hm-ico">
                      <Icon size={20} />
                    </span>
                    <div>
                      <span className="hm-pol-name">{p.label}</span>
                      <small>{p.note}</small>
                    </div>
                  </div>

                  <div className="hm-pol-val">
                    <strong>{formatValue(val, p.decimals)}</strong>
                    <small>μg/m³</small>
                  </div>

                  <div className="hm-meter">
                    <i style={{ width: `${pct}%`, background: barColor(pct) }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= WEATHER ================= */}
        <section className="hm-section hm-reveal">
          <header className="hm-heading hm-item" style={{ "--d": 0 }}>
            <span className="hm-eyebrow">Weather</span>
            <h2>
              Current <em>conditions</em>
            </h2>
            <p>Updated {environment?.updatedAt || "--"}</p>
          </header>

          <div className="hm-grid-4">
            {[
              { icon: Thermometer, label: "Temperature", value: `${formatValue(w?.temperature, 1)}°C` },
              { icon: Droplets, label: "Humidity", value: `${formatValue(w?.humidity)}%` },
              { icon: Gauge, label: "Pressure", value: `${formatValue(w?.pressure)} hPa` },
              {
                icon: Wind,
                label: "Wind",
                value: `${formatValue(w?.windSpeed, 1)} km/h`,
                extra: (
                  <em>
                    {w?.windDirection !== null && w?.windDirection !== undefined && (
                      <Navigation
                        size={12}
                        style={{ transform: `rotate(${w.windDirection + 180 - 45}deg)` }}
                      />
                    )}
                    {getWindDirection(w?.windDirection)}
                  </em>
                )
              },
              {
                icon: Sun,
                label: "UV Index",
                value: formatValue(w?.uvIndex, 1),
                extra: <em>{uvLabel(w?.uvIndex)}</em>
              },
              { icon: Cloud, label: "Cloud Cover", value: `${formatValue(w?.cloudCover)}%` },
              {
                icon: Eye,
                label: "Visibility",
                value:
                  w?.visibility !== null && w?.visibility !== undefined
                    ? `${(w.visibility / 1000).toFixed(1)} km`
                    : "-- km"
              },
              { icon: CloudSun, label: "Feels Like", value: `${formatValue(w?.apparentTemperature, 1)}°C` }
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={t.label} className="hm-card hm-weather hm-item" style={{ "--d": i + 1 }}>
                  <span className="hm-ico">
                    <Icon size={20} />
                  </span>
                  <div>
                    <small>{t.label}</small>
                    <strong>{t.value}</strong>
                    {t.extra}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="hm-section hm-reveal">
          <header className="hm-heading hm-item" style={{ "--d": 0 }}>
            <span className="hm-eyebrow">Features</span>
            <h2>
              Everything you need to <em>go green</em>
            </h2>
            <p>One platform to measure, understand and reduce your footprint.</p>
          </header>

          <div className="hm-grid-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="hm-card hm-feature hm-item" style={{ "--d": i + 1 }}>
                  <span className="hm-ico big">
                    <Icon size={24} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="hm-section hm-reveal">
          <header className="hm-heading hm-item" style={{ "--d": 0 }}>
            <span className="hm-eyebrow">How it works</span>
            <h2>
              Three steps to a <em>lighter footprint</em>
            </h2>
          </header>

          <div className="hm-steps">
            {STEPS.map((s, i) => (
              <div key={s.title} className="hm-card hm-step hm-item" style={{ "--d": i + 1 }}>
                <span className="hm-step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CTA BANNER ================= */}
        <section className="hm-section hm-reveal">
          <div className="hm-banner hm-item" style={{ "--d": 0 }}>
            <ShieldCheck className="hm-banner-bg" aria-hidden="true" />
            <span className="hm-eyebrow">Join Vasudha</span>
            <h2>
              Ready to measure your <em>footprint</em>?
            </h2>
            <p>
              Start tracking in minutes and earn a verified sustainability certificate every month.
            </p>
            <div className="hm-cta center">
              <Link to={primary.to} className="hm-btn hm-btn-gold">
                {primary.label} <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="hm-btn hm-btn-ghost">
                Learn more
              </Link>
            </div>
          </div>
        </section>

        {/* ================= VIDEO ================= */}
        <section className="hm-section hm-reveal hm-last">
          <div className="hm-video hm-item" style={{ "--d": 0 }}>
            <video autoPlay muted loop playsInline>
              <source src={videoFile} type="video/mp4" />
            </video>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;