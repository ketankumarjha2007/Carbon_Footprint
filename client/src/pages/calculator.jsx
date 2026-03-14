import { useEffect, useState } from "react";
import { auth } from "../firebase";
import "../styles/calculator.css";
import { useNavigate } from "react-router-dom";

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

  const [city,setCity] = useState("");
  const [suggestions,setSuggestions] = useState([]);
  const [selectedCity,setSelectedCity] = useState(null);

  const [travel,setTravel] = useState("");
  const [distance,setDistance] = useState("");
  const [electricity,setElectricity] = useState("");
  const [diet,setDiet] = useState("");

  const [carbon,setCarbon] = useState(null);
  const [aqi,setAqi] = useState(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  /* ---------------- CITY SEARCH ---------------- */

  useEffect(()=>{

    if(city.length < 2){
      setSuggestions([]);
      return;
    }

    const fetchCities = async () => {

      try{

        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${city}`
        );

        const data = await res.json();

        setSuggestions(data.results || []);

      }
      catch{
        setSuggestions([]);
      }

    };

    fetchCities();

  },[city]);

  const selectCity = (c) => {

    setSelectedCity(c);
    setCity(`${c.name}, ${c.country}`);
    setSuggestions([]);

  };

  const fetchAQI = async (lat,lon) => {

    try{

      const res = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`
      );

      const data = await res.json();

      const value = data?.hourly?.us_aqi?.[0];

      setAqi(value ?? "N/A");

    }
    catch{

      setAqi("N/A");

    }

  };

  const getAqiInfo = (value) => {

    if(value === "N/A") return {text:"Unavailable",class:"aqi-na"};
    if(value <= 50) return {text:"Good",class:"aqi-good"};
    if(value <= 100) return {text:"Moderate",class:"aqi-moderate"};
    if(value <= 150) return {text:"Unhealthy for Sensitive Groups",class:"aqi-usg"};
    if(value <= 200) return {text:"Unhealthy",class:"aqi-unhealthy"};
    if(value <= 300) return {text:"Very Unhealthy",class:"aqi-very"};

    return {text:"Hazardous",class:"aqi-hazard"};

  };

  /* ---------------- CALCULATION ---------------- */

  const calculate = async () => {

    setError("");

    if(!selectedCity || !travel || !distance || !electricity || !diet){
      setError("Please fill all fields");
      return;
    }

    const user = auth.currentUser;

    if(!user){
      setError("User not logged in");
      return;
    }

    setLoading(true);

    const travelEmission =
      travelFactors[travel] * Number(distance) ;

    const electricityEmission =
      (Number(electricity)/30) * 0.82;

    const dietEmission =
      dietFactors[diet];

    const total =
      travelEmission + electricityEmission + dietEmission;

    setCarbon(total.toFixed(2));

    await fetchAQI(
      selectedCity.latitude,
      selectedCity.longitude
    );

    try{

      const response = await fetch(
        "https://carbonfootprint-production-c318.up.railway.app/api/emission/save",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({

            userId:user.uid,
            city:selectedCity.name,
            travel,
            distance,
            electricity,
            diet,
            total

          })
        }
      );

      const data = await response.json();

      console.log("Saved to DB:",data);

      setTimeout(()=>{
        navigate("/dashboard");
      },3000);

    }
    catch(err){

      console.log("Database save error",err);

    }

    setLoading(false);

  };

  const aqiInfo =
    aqi !== null ? getAqiInfo(aqi) : null;

  /* ---------------- UI ---------------- */

  return (

<section className="calc-wrapper">

<div className="calculator">

<h2> Carbon Footprint Calculator</h2>

<input
value={city}
onChange={(e)=>setCity(e.target.value)}
placeholder="Enter city"
/>

{suggestions.length > 0 && (

<ul className="suggestions">

{suggestions.map((c)=>(
<li key={c.id} onClick={()=>selectCity(c)}>
{c.name}, {c.country}
</li>
))}

</ul>

)}

<select onChange={(e)=>setTravel(e.target.value)}>
<option value="">Travel mode</option>

{Object.keys(travelFactors).map((t)=>(
<option key={t}>{t}</option>
))}

</select>

<input
type="number"
placeholder="Daily travel distance (km)"
onChange={(e)=>setDistance(e.target.value)}
/>

<input
type="number"
placeholder="Monthly electricity usage (kWh)"
value={electricity}
onChange={(e)=>setElectricity(e.target.value)}
/>

<select onChange={(e)=>setDiet(e.target.value)}>
<option value="">Diet</option>

{Object.keys(dietFactors).map((d)=>(
<option key={d}>{d}</option>
))}

</select>

{error && <p className="error">{error}</p>}

<button onClick={calculate} disabled={loading}>
{loading ? "Calculating..." : "Calculate"}
</button>

{carbon && (

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

<p className="redirect">
Redirecting to dashboard...
</p>

{carbon < 100 && (
<p className="good">
🌱 Excellent! Your carbon footprint is low.
</p>
)}

{carbon >= 100 && carbon < 300 && (
<p className="moderate">
⚠️ Moderate footprint. Consider reducing travel emissions.
</p>
)}

{carbon >= 300 && (
<p className="bad">
🚨 High footprint! Try public transport or EV.
</p>
)}

</div>

)}

</div>

</section>

  );

}
