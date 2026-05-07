import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import "../styles/Navbar.css";

function Navbar() {

  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const dropdownRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname.startsWith(path) ? "active-link" : "";

  return (
    <nav className={`navbar ${darkMode ? "dark" : "light"}`}>

      {/* LOGO */}
      <div className="logo">
        <Link to="/"> CarbonTrack</Link>
      </div>

      {/* HAMBURGER */}
      <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <div className={`nav-links ${menuOpen ? "active" : ""}`}>

        {!user && (
          <>
            <Link className={isActive("/")} to="/">Home</Link>
            <Link className={isActive("/about")} to="/about">About</Link>
            <Link className={isActive("/donate")} to="/donate">Donate</Link>
            <Link className={isActive("/contact")} to="/contact">Contact</Link>
            <Link to="/login" className="login-btn">Sign In</Link>
          </>
        )}

        {user && (
          <>
            <Link className={isActive("/dashboard")} to="/dashboard">Dashboard</Link>
            <Link className={isActive("/calculator")} to="/calculator">Calculator</Link>
            <Link className={isActive("/tracker")} to="/tracker">Tracker</Link>
            <Link className={isActive("/donate")} to="/donate">Donate</Link>
            <div 
              className="profile" 
              ref={dropdownRef}
              onClick={() => setDropdown(!dropdown)}
            >
              <img src={user.photoURL || "https://i.pravatar.cc/40"} alt="user"/>
              <span>{user.displayName?.split(" ")[0] || "User"}</span>

              {dropdown && (
                <div className="dropdown">
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;