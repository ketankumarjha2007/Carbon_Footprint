import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import "../styles/Navbar.css";

function Navbar(){

const navigate = useNavigate();

const [menuOpen,setMenuOpen] = useState(false);
const [user,setUser] = useState(null);

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
setUser(currentUser);
});

return ()=>unsubscribe();

},[]);


const handleLogout = async () =>{
await signOut(auth);
navigate("/login");
}

return(

<nav className="navbar">

<div className="logo">
<Link to="/">CarbonTrack</Link>
</div>

<div className="menu-icon" onClick={()=>setMenuOpen(!menuOpen)}>
☰
</div>

<div className={`nav-links ${menuOpen ? "active" : ""}`}>

<Link to="/">Home</Link>

{!user && (
<>
<Link to="/about">About</Link>
<Link to="/donate">Donate</Link>
<Link to="/contact">Contact</Link>
<Link to="/login" className="login-btn">Login</Link>
</>
)}

{user && (
<>
<Link to="/dashboard">Dashboard</Link>
<Link to="/calculator">Calculator</Link>
<Link to="/tracker">Tracker</Link>
<Link to="/donate">Donate</Link>

<button onClick={handleLogout} className="logout-btn">
Logout
</button>
</>
)}

</div>

</nav>

)

}

export default Navbar;