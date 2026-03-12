import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

function Dashboard() {

  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const name = user.email.split("@")[0];
      setUserName(name);
    }
  }, []);

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <h1>👋Hi {userName}</h1>
        <p>Welcome back to CarbonTrack</p>
      </div>

      <div className="dashboard-cards">

        <div className="card">
          <h2>Total Carbon</h2>
          <p>0 kg CO₂</p>
        </div>

        <div className="card">
          <h2>This Month</h2>
          <p>0 kg CO₂</p>
        </div>

        <div className="card">
          <h2>Goal</h2>
          <p>Reduce 20%</p>
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