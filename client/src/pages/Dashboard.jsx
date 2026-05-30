import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const TIER_CONFIG = {
  Platinum: { color: "#8ECAE6", bg: "#050B14", border: "#8ECAE6", emoji: "💎", stars: 5 },
  Gold:     { color: "#D4A853", bg: "#0B2818", border: "#D4A853", emoji: "🥇", stars: 4 },
  Silver:   { color: "#C0C0C8", bg: "#0D0D14", border: "#C0C0C8", emoji: "🥈", stars: 3 },
  Bronze:   { color: "#CD7F32", bg: "#1A0F00", border: "#CD7F32", emoji: "🥉", stars: 2 },
};

function TierToast({ tier, reduction, carbonSaved, onClose }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.Gold;
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="ct-toast-overlay">
      <div className="ct-toast" style={{ "--tier-color": cfg.color, "--tier-bg": cfg.bg, "--tier-border": cfg.border }}>
        <button className="ct-toast-close" onClick={onClose}>×</button>
        <div className="ct-toast-icon">{cfg.emoji}</div>
        <div className="ct-toast-stars">
          {Array.from({ length: cfg.stars }).map((_, i) => (
            <span key={i} className="ct-toast-star" style={{ animationDelay: `${i * 0.1}s` }}>★</span>
          ))}
        </div>
        <h3 className="ct-toast-title">{tier} Certificate Earned!</h3>
        <p className="ct-toast-sub">You reduced your carbon footprint by <strong>{reduction}%</strong> this month</p>
        <div className="ct-toast-stats">
          <div className="ct-toast-stat">
            <span className="ct-ts-val">{carbonSaved} kg</span>
            <span className="ct-ts-label">CO₂ saved</span>
          </div>
          <div className="ct-toast-stat-div" />
          <div className="ct-toast-stat">
            <span className="ct-ts-val">{reduction}%</span>
            <span className="ct-ts-label">reduction</span>
          </div>
        </div>
        <p className="ct-toast-sent">📧 Certificate emailed to you!</p>
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [monthCarbon, setMonthCarbon] = useState(0);
  const [points, setPoints] = useState(0);
  const [carbonSaved, setCarbonSaved] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [aqiValue, setAqiValue] = useState(0);
  const [certLoading, setCertLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { tier, reduction, carbonSaved }
  const autoCheckDone = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const name = user.displayName ? user.displayName.split(" ")[0] : "User";
      setUserName(name);

      // ── Fetch emissions ──────────────────────────────────────────────────
      fetch(`https://carbon-footprint-1-a5ae.onrender.com/api/emission/${user.uid}`)
        .then(r => r.json())
        .then(data => {
          if (!Array.isArray(data) || !data.length) return;
          let total = 0, month = 0;
          const currentMonth = new Date().getMonth();
          const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAqiValue(sorted[0].aqi || 0);
          sorted.forEach(item => {
            const val = Number(item.total) || 0;
            total += val;
            if (item.createdAt && new Date(item.createdAt).getMonth() === currentMonth) month += val;
          });
          setTotalCarbon(total.toFixed(2));
          setMonthCarbon(month.toFixed(2));
        })
        .catch(err => console.log("Emission fetch error:", err));

      // ── Fetch stats ──────────────────────────────────────────────────────
      fetch(`https://carbon-footprint-1-a5ae.onrender.com/api/emission/stats/${user.uid}`)
        .then(r => r.json())
        .then(data => {
          if (!data.success) return;
          setPoints(data.totalPoints || 0);
          setCarbonSaved(data.totalCarbonSaved || 0);
          setLevel(data.level || "Beginner");
        })
        .catch(err => console.log("Stats fetch error:", err));

      // ── Auto certificate check (runs once per session) ────────────────────
      if (!autoCheckDone.current) {
        autoCheckDone.current = true;
        autoCheckCertificate(user);
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Auto check: silently fires on login, shows toast if eligible ─────────
  const autoCheckCertificate = async (user) => {
    try {
      const res = await fetch(
        "https://carbon-footprint-1-a5ae.onrender.com/api/certificate-mail/check-and-send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            name: user.displayName || "User",
          }),
        }
      );
      const data = await res.json();
      if (data.success && data.eligible) {
        setToast({
          tier: data.tier,
          reduction: data.reduction,
          carbonSaved: data.carbonSaved,
        });
      }
    } catch (err) {
      console.log("Auto certificate check failed:", err);
      // Silent fail — don't bother the user
    }
  };

  // ── Manual "Get Certificate" button ──────────────────────────────────────
  const sendCertificateEmail = async () => {
    try {
      const user = auth.currentUser;
      if (!user) { alert("Please login first"); return; }
      setCertLoading(true);

      const res = await fetch(
        "https://carbon-footprint-1-a5ae.onrender.com/api/certificate-mail/send-certificate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            name: user.displayName || "User",
          }),
        }
      );
      const data = await res.json();

      if (data.success && data.eligible) {
        setToast({
          tier: data.tier,
          reduction: data.reduction,
          carbonSaved: data.carbonSaved,
        });
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Certificate email failed");
    } finally {
      setCertLoading(false);
    }
  };

  const getAqiStatus = (aqi) => {
    if (aqi <= 50)  return "Good 🟢";
    if (aqi <= 100) return "Moderate 🟡";
    if (aqi <= 200) return "Poor 🟠";
    return "Hazardous 🔴";
  };

  return (
    <div className="dashboard">
      {toast && (
        <TierToast
          tier={toast.tier}
          reduction={toast.reduction}
          carbonSaved={toast.carbonSaved}
          onClose={() => setToast(null)}
        />
      )}

      <div className="dashboard-header">
        <h1>👋 Hi {userName}</h1>
        <p>Welcome back to CarbonTrack</p>
      </div>

      <div className="dashboard-cards">
        <div className="card">
          <h2>Total Carbon</h2>
          <p>{totalCarbon} kg CO₂</p>
        </div>
        <div className="card">
          <h2>This Month</h2>
          <p>{monthCarbon} kg CO₂</p>
        </div>
        <div className="card">
          <h2>Goal</h2>
          <p>Reduce 20%</p>
        </div>
        <div className="card">
          <h2>Last AQI</h2>
          <p>{aqiValue} - {getAqiStatus(aqiValue)}</p>
        </div>
        <div className="card reward-card">
          <h2>⭐ Points</h2>
          <p>{points}</p>
        </div>
        <div className="card reward-card">
          <h2>🌱 Carbon Saved</h2>
          <p>{Number(carbonSaved).toFixed(2)} kg</p>
        </div>
        <div className="card reward-card level-card">
          <h2>🏆 Level</h2>
          <p>{level}</p>
        </div>
      </div>

      <div className="dashboard-actions">
        <button onClick={() => navigate("/calculator")}>Calculate Carbon</button>
        <button onClick={() => navigate("/tracker")}>Track Activity</button>
        <button onClick={() => navigate("/donate")}>Donate for Trees</button>
        <button
          onClick={sendCertificateEmail}
          disabled={certLoading}
          className={certLoading ? "loading" : ""}
        >
          {certLoading ? "Sending..." : "Get Certificate"}
        </button>
      </div>
    </div>
  );
}

export default Dashboard;