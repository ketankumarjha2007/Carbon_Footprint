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

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      if (!user) return;

      /* GET FIRST NAME FROM GOOGLE LOGIN */

      let name = "User";

      if (user.displayName) {
        name = user.displayName.split(" ")[0];
      }

      setUserName(name);

      /* FETCH USER EMISSION DATA */

      fetch(`https://carbonfootprint-production-c318.up.railway.app/api/emission/${user.uid}`)
        .then((res) => res.json())
        .then((data) => {

          if (!Array.isArray(data)) return;

          let total = 0;
          let month = 0;

          const currentMonth = new Date().getMonth();

          data.forEach((item) => {

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
          console.log("Error fetching emissions:", err);
        });

    });

    return () => unsubscribe();

  }, []);

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