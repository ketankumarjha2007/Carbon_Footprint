import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import "../styles/calculator.css";
import { useNavigate } from "react-router-dom";

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

export default function Calculator() {
  const navigate = useNavigate();

  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);

  const [travel, setTravel] = useState("");
  const [distance, setDistance] = useState("");
  const [electricity, setElectricity] = useState("");
  const [diet, setDiet] = useState("");

  const [carbon, setCarbon] = useState(null);
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

  useEffect(() => {
    if (city.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchCities = async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
        );
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      }
    };

    fetchCities();
  }, [city]);

  const selectCity = (c) => {
    setSelectedCity(c);
    setCity(`${c.name}, ${c.country}`);
    setSuggestions([]);
  };

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
    if (value <= 150) return { text: "USG", class: "aqi-usg" };
    if (value <= 200) return { text: "Unhealthy 😷", class: "aqi-unhealthy" };
    if (value <= 300) return { text: "Very Unhealthy ☠️", class: "aqi-very" };
    return { text: "Hazardous 🚨", class: "aqi-hazard" };
  };

  /* ---------------- AI SUGGESTIONS ---------------- */

  const getAISuggestions = (carbonValue) => {
    const tips = [];

    if (carbonValue < 10)
      tips.push("Excellent! Low carbon footprint");
    else if (carbonValue < 30)
      tips.push("Moderate footprint. Improve slightly");
    else tips.push("High footprint! Reduce emissions");

    if (travel === "Car") tips.push("Use public transport");
    if (Number(electricity) > 200) tips.push("Save electricity");
    if (diet.includes("Non-veg")) tips.push("Reduce meat intake");

    if (aqi && aqi > 150)
      tips.push("High AQI! Avoid outdoor activity");

    return tips;
  };

  /* ---------------- CALCULATE ---------------- */

  const calculate = async () => {
    setError("");

    if (!selectedCity || !travel || !distance || !electricity || !diet) {
      setError("Please fill all fields");
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

      const total =
        travelEmission + electricityEmission + dietEmission;

      const finalCarbon = Number(total.toFixed(2));
      setCarbon(finalCarbon);

      const aqiValue = await fetchAQI(
        selectedCity.latitude,
        selectedCity.longitude
      );

      const res = await fetch(
        "https://carbon-footprint-1-a5ae.onrender.com/api/emission/save",
        {
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
        }
      );

      const result = await res.json();

      if (result?.data) {
        setPoints(result.data.points);
        setCarbonSaved(result.data.carbonSaved);
        setLevel(result.data.level);

        await fetch(
          `https://carbon-footprint-1-a5ae.onrender.com/api/emission/stats/${user.uid}`
        );
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

  return (
    <section className="calc-wrapper">
      <div className="calculator">

        <h2>Carbon Footprint Calculator</h2>

        <div className="city-container">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter city"
          />

          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((c) => (
                <li key={c.id} onClick={() => selectCity(c)}>
                  {c.name}, {c.country}
                </li>
              ))}
            </ul>
          )}
        </div>

        <select onChange={(e) => setTravel(e.target.value)}>
          <option value="">Travel mode</option>
          {Object.keys(travelFactors).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Daily distance (km)"
          onChange={(e) => setDistance(e.target.value)}
        />

        <input
          type="number"
          placeholder="Electricity (kWh/Day)"
          value={electricity}
          onChange={(e) => setElectricity(e.target.value)}
        />

        <select onChange={(e) => setDiet(e.target.value)}>
          <option value="">Diet</option>
          {Object.keys(dietFactors).map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        {error && <p className="error">{error}</p>}

        <button onClick={calculate} disabled={loading}>
          {loading ? "Calculating..." : "Calculate"}
        </button>

        {carbon !== null && (
          <div className="result-card">
            <h3>Your Carbon Impact</h3>

            <p className="carbon-value">
              {carbon} kg CO₂e / Day
            </p>

            {aqiInfo && (
              <p className={`aqi ${aqiInfo.class}`}>
                AQI: {aqi} — {aqiInfo.text}
              </p>
            )}

            <div className="reward-box">
              <p>⭐ Points Earned: {points}</p>
              <p>🌱 Carbon Saved: {carbonSaved} kg</p>
              <p>🏆 Level: {level}</p>
            </div>

            <div className="ai-card">
              <h4>AI Suggestions</h4>
              <ul>
                {aiTips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>

            <button
              className="redirect"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </section>
  );
}