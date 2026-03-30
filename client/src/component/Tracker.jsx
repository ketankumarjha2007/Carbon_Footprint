import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "../styles/tracker.css";

/* 🔥 CHART IMPORTS */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

function Tracker(){

const [records,setRecords] = useState([]);
const [todayTotal,setTodayTotal] = useState(0);
const [loading,setLoading] = useState(true);
const [error,setError] = useState("");

/* 🔥 NEW STATES FOR CHARTS */
const [dailyData,setDailyData] = useState([]);
const [monthlyData,setMonthlyData] = useState([]);

useEffect(()=>{

const fetchData = async () => {

try{
  const user = auth.currentUser;

  if(!user){
    setError("User not logged in");
    setLoading(false);
    return;
  }

  const res = await fetch(
  `https://carbon-footprint-1-a5ae.onrender.com/api/emission/${user.uid}`
  );

  const data = await res.json();

  /* SORT latest first */
  const sorted = data.sort(
    (a,b)=> new Date(b.createdAt) - new Date(a.createdAt)
  );

  setRecords(sorted);

  /* TODAY TOTAL */
  const today = new Date().toDateString();

  let total = 0;

  sorted.forEach(item=>{
    if(new Date(item.createdAt).toDateString() === today){
      total += item.total;
    }
  });

  setTodayTotal(total);

  /* ================= DAILY CHART (LAST 7 DAYS) ================= */
  const last7 = [...sorted].reverse().slice(-7);

  const daily = last7.map(item => ({
    date: new Date(item.createdAt).toLocaleDateString(),
    carbon: item.total
  }));

  setDailyData(daily);

  /* ================= MONTHLY CHART ================= */
  const monthlyMap = {};

  sorted.forEach(item=>{
    const month = new Date(item.createdAt).toLocaleString("default",{
      month:"short"
    });

    if(!monthlyMap[month]) monthlyMap[month] = 0;
    monthlyMap[month] += item.total;
  });

  const monthly = Object.keys(monthlyMap).map(m => ({
    month: m,
    carbon: monthlyMap[m]
  }));

  setMonthlyData(monthly);

}catch(err){
  setError("Failed to load data");
}
finally{
  setLoading(false);
}

};

fetchData();

/* 🔁 OPTIONAL REAL-TIME REFRESH */
const interval = setInterval(fetchData,5000);
return () => clearInterval(interval);

},[]);



/* ================= UI ================= */

if(loading){
  return(
    <div className="tracker center">
      <p>Loading your carbon data...</p>
    </div>
  );
}

if(error){
  return(
    <div className="tracker center">
      <p>{error}</p>
    </div>
  );
}

return(

<div className="tracker">

{/* HEADER */}
<div className="tracker-header">
<h1>📊 Carbon Activity Tracker</h1>
<p>Monitor your daily carbon footprint in real-time</p>
</div>


{/* SUMMARY */}
<div className="summary-card">
<h3>Today's Carbon</h3>
<p>
{todayTotal === 0 ? "0.0" : todayTotal.toFixed(2)} kg CO₂
</p>
</div>


{/* 🔥 DAILY CHART */}
<div className="chart-box">
<h3>Last 7 Days</h3>

<ResponsiveContainer width="100%" height={250}>
<LineChart data={dailyData}>
  <XAxis dataKey="date" stroke="#94a3b8" />
  <YAxis stroke="#94a3b8" />
  <Tooltip />
  <Line
    type="monotone"
    dataKey="carbon"
    stroke="#22c55e"
    strokeWidth={3}
  />
</LineChart>
</ResponsiveContainer>
</div>


{/* 🔥 MONTHLY CHART */}
<div className="chart-box">
<h3>Monthly Emissions</h3>

<ResponsiveContainer width="100%" height={250}>
<BarChart data={monthlyData}>
  <XAxis dataKey="month" stroke="#94a3b8" />
  <YAxis stroke="#94a3b8" />
  <Tooltip />
  <Bar dataKey="carbon" fill="#3b82f6" />
</BarChart>
</ResponsiveContainer>
</div>


{/* EMPTY STATE */}
{records.length === 0 ? (

<div className="empty-state">
<p>No activity yet </p>
<span>Start tracking to see your impact!</span>
</div>

) : (

/* TIMELINE */
<div className="timeline">

<h3>Activity Timeline</h3>

{records.map((item)=>{

const time = new Date(item.createdAt)
.toLocaleTimeString([],{
hour:"2-digit",
minute:"2-digit"
});

const date = new Date(item.createdAt)
.toLocaleDateString();

return(

<div key={item._id} className="timeline-item">

<div className="timeline-left">
<span>{date}</span>
<span>{time}</span>
</div>

<div className="timeline-right">
{item.total.toFixed(2)} kg CO₂
</div>

</div>

);

})}

</div>

)}

</div>

);

}

export default Tracker;