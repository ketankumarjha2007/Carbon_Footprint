import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Navbar.css";

function Navbar(){

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [menuOpen,setMenuOpen] = useState(false);

  const handleLogout = () =>{
    localStorage.removeItem("token");
    navigate("/login");
  }

  return(

    <nav className="navbar">

      <div className="logo">
        <Link to="/">CarbonTrack</Link>
      </div>

      {/* HAMBURGER */}

      <div className="menu-icon" onClick={()=>setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>

        <Link to="/">Home</Link>

        {!token && (
          <>
            <Link to="/about">About</Link>
            <Link to="/donate">Donate</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/login" className="login-btn">Login</Link>
          </>
        )}

        {token && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/calculator">Calculator</Link>
            <Link to="/tracker">Tracker</Link>
            <Link to="/donate">Donate</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </>
        )}

      </div>

    </nav>

  )
}

export default Navbar