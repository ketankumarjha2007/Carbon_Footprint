import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "../styles/tracker.css";

function Tracker(){

const [records,setRecords] = useState([]);
const [todayTotal,setTodayTotal] = useState(0);
const [loading,setLoading] = useState(true);
const [error,setError] = useState("");

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

}catch(err){
  setError("Failed to load data");
}
finally{
  setLoading(false);
}

};

fetchData();

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