import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import "../styles/Navbar.css";

function Navbar(){

const navigate = useNavigate();
const location = useLocation();

const [menuOpen,setMenuOpen] = useState(false);
const [user,setUser] = useState(null);

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
setUser(currentUser);
});

return ()=>unsubscribe();

},[]);

const handleLogout = async () =>{
try{

await signOut(auth);

setMenuOpen(false);

navigate("/");

}
catch(error){
console.log("Logout Error:",error);
}
}

const isActive = (path) =>{
return location.pathname === path ? "active-link" : "";
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

{!user && (
<>

<Link className={isActive("/")} to="/">Home</Link>

<Link className={isActive("/about")} to="/about">About</Link>

<Link className={isActive("/donate")} to="/donate">Donate</Link>

<Link className={isActive("/contact")} to="/contact">Contact</Link>

<Link to="/login" className="login-btn">
Login
</Link>

</>
)}

{user && (
<>

<div className="user-info">

<img 
src={user.photoURL || "https://i.pravatar.cc/40"} 
alt="user"
className="avatar"
/>

<span className="user-name">
{user.displayName ? user.displayName.split(" ")[0] : "User"}
</span>

</div>

<Link className={isActive("/dashboard")} to="/dashboard">
Dashboard
</Link>

<Link className={isActive("/calculator")} to="/calculator">
Calculator
</Link>

<Link className={isActive("/tracker")} to="/tracker">
Tracker
</Link>

<Link className={isActive("/donate")} to="/donate">
Donate
</Link>

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