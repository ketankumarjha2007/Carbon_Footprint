import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "../styles/tracker.css";

function Tracker(){

const [records,setRecords] = useState([]);
const [todayTotal,setTodayTotal] = useState(0);

useEffect(()=>{

const fetchData = async () => {

const user = auth.currentUser;

if(!user) return;

const res = await fetch(
`https://carbonfootprint-production-c318.up.railway.app/api/emission/${user.uid}`
);

const data = await res.json();

setRecords(data);

/* calculate today's total */

const today = new Date().toDateString();

let total = 0;

data.forEach(item=>{

if(new Date(item.createdAt).toDateString() === today){
total += item.total;
}

});

setTodayTotal(total);

};

fetchData();

},[]);

return(

<div className="tracker">

<div className="tracker-header">

<h1>📊 Carbon Activity Tracker</h1>
<p>Monitor your daily carbon footprint</p>

</div>


<div className="summary-card">

<h3>Today's Carbon</h3>
<p>{todayTotal} kg CO₂</p>

</div>


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
{item.total} kg CO₂
</div>

</div>

);

})}

</div>

</div>

);

}

export default Tracker;