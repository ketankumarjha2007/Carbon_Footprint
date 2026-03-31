import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

function Dashboard() {

  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [totalCarbon, setTotalCarbon] = useState(0);
  const [monthCarbon, setMonthCarbon] = useState(0);
  const [points, setPoints] = useState(0);
  const [carbonSaved, setCarbonSaved] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [aqiValue, setAqiValue] = useState(0);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) return;

      let name = "User";

      if (user.displayName) {
        name = user.displayName.split(" ")[0];
      }

      setUserName(name);

      /* ---------------- FETCH EMISSION + AQI ---------------- */

      fetch(`https://carbon-footprint-1-a5ae.onrender.com/api/emission/${user.uid}`)
        .then((res) => res.json())
        .then((data) => {

          if (!Array.isArray(data) || data.length === 0) return;

          let total = 0;
          let month = 0;

          const currentMonth = new Date().getMonth();

          // 🔥 sort latest first
          const sorted = data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          const latest = sorted[0];
          setAqiValue(latest.aqi || 0);

          sorted.forEach((item) => {

            const emissionValue = Number(item.total) || 0;
            total += emissionValue;

            if (item.createdAt) {
              const itemMonth = new Date(item.createdAt).getMonth();
              if (itemMonth === currentMonth) {
                month += emissionValue;
              }
            }

          });

          setTotalCarbon(total.toFixed(2));
          setMonthCarbon(month.toFixed(2));

        })
        .catch((err) => {
          console.log("Error fetching emission:", err);
        });

      fetch(`https://carbon-footprint-1-a5ae.onrender.com/api/emission/stats/${user.uid}`)
        .then((res) => res.json())
        .then((data) => {

          if (!data.success) return;

          setPoints(data.totalPoints || 0);
          setCarbonSaved(data.totalCarbonSaved || 0);
          setLevel(data.level || "Beginner");

        })
        .catch((err) => {
          console.log("Error fetching stats:", err);
        });

    });

    return () => unsubscribe();

  }, []);

  const getAqiStatus = (aqi) => {
    if (aqi <= 50) return "Good 🟢";
    if (aqi <= 100) return "Moderate 🟡";
    if (aqi <= 200) return "Poor 🟠";
    return "Hazardous 🔴";
  };

  return (

    <div className="dashboard">

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

        <button onClick={() => navigate("/calculator")}>
          Calculate Carbon
        </button>

        <button onClick={() => navigate("/tracker")}>
          Track Activity
        </button>

        <button onClick={() => navigate("/donate")}>
          Donate for Trees
        </button>

      </div>

    </div>

  );
}

export default Dashboard;