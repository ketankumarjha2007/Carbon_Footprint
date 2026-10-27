import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "../styles/calculator.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  Car,
  Bike,
  Bus,
  TrainFront,
  Zap,
  Footprints,
  MapPin,
  Route,
  Plug,
  Salad,
  Calculator as CalcIcon,
  AlertCircle,
  Star,
  Sprout,
  Trophy,
  Wind,
  Sparkles,
  ArrowRight,
  Loader2,
  Leaf,
} from "lucide-react";

/* ---------------- FACTORS ---------------- */
const travelFactors = {
  Car: 0.21,
  Bike: 0.05,
  Bus: 0.1,
  Train: 0.04,
  EV: 0.03,
  Walking: 0,
};

const dietFactors = {
  Vegan: 1.5,
  Vegetarian: 2.0,
  Eggetarian: 2.5,
  "Non-veg (1–2 days/week)": 3,
  "Non-veg (3–5 days/week)": 4,
  "Non-veg (daily)": 5,
};

const travelIcons = {
  Car,
  Bike,
  Bus,
  Train: TrainFront,
  EV: Zap,
  Walking: Footprints,
};

const GAUGE_MAX = 60; // kg CO2e / day shown as a full ring
const RING = 2 * Math.PI * 54;

export default function Calculator() {
  const navigate = useNavigate();

  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const skipFetch = useRef(false);

  const [travel, setTravel] = useState("");
  const [distance, setDistance] = useState("");
  const [electricity, setElectricity] = useState("");
  const [diet, setDiet] = useState("");

  const [carbon, setCarbon] = useState(null);
  const [shown, setShown] = useState(0);
  const [breakdown, setBreakdown] = useState(null);
  const [aqi, setAqi] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [points, setPoints] = useState(0);
  const [carbonSaved, setCarbonSaved] = useState(0);
  const [level, setLevel] = useState("Beginner");

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const unitsRef = ref(db, "electricity/" + user.uid + "/units");

      onValue(unitsRef, (snapshot) => {
        const value = snapshot.val();

        if (value !== null) {
          setElectricity(value.toString());
        }
      });
    });

    return () => unsubscribeAuth();
  }, []);

  /* city search (debounced, cancels stale requests) */
  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false;
      return;
    }
    if (city.length < 2) {
      setSuggestions([]);
      return;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=6`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        setSuggestions(data.results || []);
        setActive(-1);
      } catch (e) {
        if (e.name !== "AbortError") setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [city]);

  const selectCity = (c) => {
    skipFetch.current = true;
    setSelectedCity(c);
    setCity(`${c.name}, ${c.country}`);
    setSuggestions([]);
    setOpen(false);
  };

  const onCityKey = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      selectCity(suggestions[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  /* animated count-up for the result number */
  useEffect(() => {
    if (carbon === null) return;
    let raf;
    const start = performance.now();
    const dur = 900;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(carbon * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [carbon]);

  /* ---------------- AQI FETCH ---------------- */

  const fetchAQI = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`
      );

      const data = await res.json();
      const value = Number(data?.hourly?.us_aqi?.[0]) || null;

      setAqi(value);
      return value;
    } catch {
      setAqi(null);
      return null;
    }
  };

  /* ---------------- AQI INFO ---------------- */

  const getAqiInfo = (value) => {
    if (!value) return { text: "Unavailable", class: "aqi-na" };
    if (value <= 50) return { text: "Good 😊", class: "aqi-good" };
    if (value <= 100) return { text: "Moderate 😐", class: "aqi-moderate" };
    if (value <= 150) return { text: "Unhealthy for sensitive groups", class: "aqi-usg" };
    if (value <= 200) return { text: "Unhealthy 😷", class: "aqi-unhealthy" };
    if (value <= 300) return { text: "Very Unhealthy ☠️", class: "aqi-very" };
    return { text: "Hazardous 🚨", class: "aqi-hazard" };
  };

  /* ---------------- AI SUGGESTIONS ---------------- */

  const getAISuggestions = (carbonValue) => {
    const tips = [];

    if (carbonValue < 10) tips.push("Excellent! Low carbon footprint");
    else if (carbonValue < 30) tips.push("Moderate footprint. Improve slightly");
    else tips.push("High footprint! Reduce emissions");

    if (travel === "Car") tips.push("Use public transport");
    if (Number(electricity) > 200) tips.push("Save electricity");
    if (diet.includes("Non-veg")) tips.push("Reduce meat intake");

    if (aqi && aqi > 150) tips.push("High AQI! Avoid outdoor activity");

    return tips;
  };

  /* ---------------- CALCULATE ---------------- */

  const calculate = async (e) => {
    e?.preventDefault();
    setError("");

    if (!selectedCity || !travel || !distance || !electricity || !diet) {
      setError(
        !selectedCity && city
          ? "Please pick your city from the suggestions"
          : "Please fill all fields"
      );
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("User not logged in");
      return;
    }

    setLoading(true);

    try {
      const travelEmission = travelFactors[travel] * Number(distance);
      const electricityEmission = Number(electricity) * 0.82;
      const dietEmission = dietFactors[diet];

      const total = travelEmission + electricityEmission + dietEmission;

      const finalCarbon = Number(total.toFixed(2));
      setCarbon(finalCarbon);
      setBreakdown({
        transport: travelEmission,
        electricity: electricityEmission,
        food: dietEmission,
      });

      const aqiValue = await fetchAQI(selectedCity.latitude, selectedCity.longitude);

      const res = await fetch(`${API_BASE_URL}/api/emission/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          transport: travelEmission,
          electricity: electricityEmission,
          food: dietEmission,
          total: finalCarbon,
          aqi: aqiValue,
        }),
      });

      const result = await res.json();

      if (result?.data) {
        setPoints(result.data.points);
        setCarbonSaved(result.data.carbonSaved);
        setLevel(result.data.level);

        await fetch(`${API_BASE_URL}/api/emission/stats/${user.uid}`);
      } else {
        setError("Reward system failed. Try again.");
      }
    } catch (err) {
      console.log(err);
      setError("Something went wrong");
    }

    setLoading(false);
  };

  const aqiInfo = aqi !== null ? getAqiInfo(aqi) : null;
  const aiTips = carbon !== null ? getAISuggestions(carbon) : [];

  const filled = [selectedCity, travel, distance, electricity, diet].filter(Boolean).length;
  const lvl = carbon === null ? "" : carbon < 10 ? "lvl-good" : carbon < 30 ? "lvl-mid" : "lvl-high";
  const lvlText = carbon === null ? "" : carbon < 10 ? "Low impact" : carbon < 30 ? "Moderate impact" : "High impact";
  const pct = carbon === null ? 0 : Math.min(1, shown / GAUGE_MAX);
  const bTotal = breakdown ? breakdown.transport + breakdown.electricity + breakdown.food || 1 : 1;

  const rows = breakdown
    ? [
        { key: "transport", label: "Transport", icon: Route, value: breakdown.transport },
        { key: "electricity", label: "Electricity", icon: Plug, value: breakdown.electricity },
        { key: "food", label: "Food", icon: Salad, value: breakdown.food },
      ]
    : [];

  return (
    <section className="cc">
      <div className="cc-grid-bg" aria-hidden="true" />

      <div className="cc-wrap">
        <header className="cc-head">
          <span className="cc-eyebrow">
            <Leaf size={14} /> Carbon tracker
          </span>
          <h1>
            Carbon Footprint <em>Calculator</em>
          </h1>
          <p>Tell us about your day and see your impact on the planet in seconds.</p>
        </header>

        <div className="cc-layout">
          {/* ================= FORM ================= */}
          <form className="cc-card cc-form" onSubmit={calculate} noValidate>
            <div className="cc-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${filled / 5})` }} />
            </div>
            <div className="cc-progress-text">{filled} of 5 completed</div>

            {/* city */}
            <div className="cc-block">
              <label className="cc-title" htmlFor="cc-city">
                <MapPin size={16} /> Your city
              </label>
              <div className="cc-city">
                <div className="cc-field">
                  <MapPin size={18} className="cc-field-ico" />
                  <input
                    id="cc-city"
                    className="cc-input"
                    value={city}
                    autoComplete="off"
                    onChange={(e) => {
                      setCity(e.target.value);
                      setSelectedCity(null);
                      setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => setOpen(false)}
                    onKeyDown={onCityKey}
                    placeholder="Search for your city"
                    role="combobox"
                    aria-expanded={open && suggestions.length > 0}
                    aria-controls="cc-suggest"
                    aria-autocomplete="list"
                  />
                  {searching && <Loader2 size={16} className="cc-field-spin" />}
                  {selectedCity && !searching && <span className="cc-tick">✓</span>}
                </div>

                {open && suggestions.length > 0 && (
                  <ul className="cc-suggest" id="cc-suggest" role="listbox">
                    {suggestions.map((c, i) => (
                      <li
                        key={c.id}
                        role="option"
                        aria-selected={i === active}
                        className={i === active ? "is-active" : ""}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectCity(c);
                        }}
                        onMouseEnter={() => setActive(i)}
                      >
                        <MapPin size={15} />
                        <span className="cc-s-name">{c.name}</span>
                        <span className="cc-s-sub">
                          {[c.admin1, c.country].filter(Boolean).join(", ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* travel */}
            <div className="cc-block">
              <span className="cc-title">
                <Route size={16} /> How do you travel?
              </span>
              <div className="cc-modes" role="radiogroup" aria-label="Travel mode">
                {Object.keys(travelFactors).map((t) => {
                  const Icon = travelIcons[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={travel === t}
                      className={`cc-mode ${travel === t ? "is-on" : ""}`}
                      onClick={() => setTravel(t)}
                    >
                      <Icon size={22} />
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>

              <div className="cc-field cc-gap">
                <Route size={18} className="cc-field-ico" />
                <input
                  className="cc-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder=" "
                  id="cc-dist"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
                <label className="cc-label" htmlFor="cc-dist">
                  Daily distance (km)
                </label>
              </div>
            </div>

            {/* energy */}
            <div className="cc-block">
              <span className="cc-title">
                <Plug size={16} /> Home energy
              </span>
              <div className="cc-field">
                <Plug size={18} className="cc-field-ico" />
                <input
                  className="cc-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder=" "
                  id="cc-elec"
                  value={electricity}
                  onChange={(e) => setElectricity(e.target.value)}
                />
                <label className="cc-label" htmlFor="cc-elec">
                  Electricity (kWh / day)
                </label>
              </div>
            </div>

            {/* diet */}
            <div className="cc-block">
              <span className="cc-title">
                <Salad size={16} /> Your diet
              </span>
              <div className="cc-diets" role="radiogroup" aria-label="Diet">
                {Object.keys(dietFactors).map((d) => (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={diet === d}
                    className={`cc-diet ${diet === d ? "is-on" : ""}`}
                    onClick={() => setDiet(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="cc-alert" role="alert">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            <button type="submit" className="cc-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="cc-spin" aria-hidden="true" /> Calculating...
                </>
              ) : (
                <>
                  <CalcIcon size={19} /> Calculate
                </>
              )}
            </button>
          </form>

          {/* ================= RESULT ================= */}
          <aside className="cc-result" aria-live="polite">
            {carbon === null ? (
              <div className="cc-card cc-empty">
                <span className="cc-empty-ico">
                  <Leaf size={34} />
                </span>
                <h3>Your impact appears here</h3>
                <p>Fill in the details on the left and hit Calculate to see your daily footprint, air quality and rewards.</p>
              </div>
            ) : (
              <div className="cc-card cc-res">
                <h3 className="cc-res-title">Your Carbon Impact</h3>

                <div className={`cc-gauge ${lvl}`}>
                  <svg viewBox="0 0 128 128" aria-hidden="true">
                    <circle className="cc-ring-bg" cx="64" cy="64" r="54" />
                    <circle
                      className="cc-ring"
                      cx="64"
                      cy="64"
                      r="54"
                      strokeDasharray={RING}
                      strokeDashoffset={RING * (1 - pct)}
                    />
                  </svg>
                  <div className="cc-gauge-in">
                    <strong>{shown.toFixed(2)}</strong>
                    <span>kg CO₂e / day</span>
                  </div>
                </div>
                <p className={`cc-badge ${lvl}`}>{lvlText}</p>

                {/* breakdown */}
                <div className="cc-break">
                  {rows.map(({ key, label, icon: Icon, value }) => (
                    <div className="cc-brow" key={key}>
                      <div className="cc-brow-top">
                        <span>
                          <Icon size={15} /> {label}
                        </span>
                        <b>{value.toFixed(2)} kg</b>
                      </div>
                      <div className="cc-bar">
                        <span className={`b-${key}`} style={{ width: `${(value / bTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {aqiInfo && (
                  <div className={`cc-aqi ${aqiInfo.class}`}>
                    <Wind size={18} />
                    <span>
                      AQI: <b>{aqi ?? "—"}</b> — {aqiInfo.text}
                    </span>
                  </div>
                )}

                <div className="cc-stats">
                  <div>
                    <Star size={18} />
                    <b>{points}</b>
                    <span>Points earned</span>
                  </div>
                  <div>
                    <Sprout size={18} />
                    <b>{carbonSaved} kg</b>
                    <span>Carbon saved</span>
                  </div>
                  <div>
                    <Trophy size={18} />
                    <b>{level}</b>
                    <span>Level</span>
                  </div>
                </div>

                <div className="cc-tips">
                  <h4>
                    <Sparkles size={16} /> AI Suggestions
                  </h4>
                  <ul>
                    {aiTips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>

                <button type="button" className="cc-dash" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard <ArrowRight size={18} />
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}