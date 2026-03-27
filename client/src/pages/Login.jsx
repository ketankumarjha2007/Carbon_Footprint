import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

import "../styles/login.css";

function Login() {

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState("");
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);

  const navigate = useNavigate();

  /* ---------- AUTO REDIRECT ---------- */
  useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth,(user)=>{
      if(user){
        navigate("/dashboard");
      }
    });
    return ()=>unsubscribe();
  },[navigate]);

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try{
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
    setLoading(false);
  };

  /* ---------- EMAIL LOGIN ---------- */
  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try{
      await signInWithEmailAndPassword(auth,email,password);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
    setLoading(false);
  };

  /* ---------- SIGNUP ---------- */
  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try{
      await createUserWithEmailAndPassword(auth,email,password);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
    setLoading(false);
  };

  return(

    <div className="login-wrapper">

      {/* 🌌 PARTICLES */}
      <div className="particles">
        <span></span><span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>

      <div className="login-box">

        <h1>CarbonTrack</h1>
        <p className="subtitle">Track your carbon footprint</p>

        {error && <p className="error">{error}</p>}

        {/* EMAIL */}
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        {/* PASSWORD WITH TOGGLE */}
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <span
            className="toggle"
            onClick={()=>setShowPassword(!showPassword)}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* LOGIN */}
        <button className="btn login" onClick={handleLogin} disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>

        {/* SIGNUP */}
        <button className="btn signup" onClick={handleSignup} disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* GOOGLE */}
        <button className="btn google" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? "Loading..." : "Continue with Google"}
        </button>

      </div>

    </div>

  );
}

export default Login;