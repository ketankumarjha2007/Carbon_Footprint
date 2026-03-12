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

  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(()=>{

    const unsubscribe = onAuthStateChanged(auth,(user)=>{

      if(user){
        navigate("/dashboard");
      }

    });

    return ()=>unsubscribe();

  },[navigate]);


  // Google Login
  const handleGoogleLogin = async () => {
    try{
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
  };


  // Email Login
  const handleLogin = async () => {
    try{
      await signInWithEmailAndPassword(auth,email,password);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
  };


  // Signup
  const handleSignup = async () => {
    try{
      await createUserWithEmailAndPassword(auth,email,password);
      navigate("/dashboard");
    }catch(err){
      setError(err.message);
    }
  };


  return(

    <div className="login-wrapper">

      <div className="login-box">

        <h1>CarbonTrack</h1>
        <p className="subtitle">Track your carbon footprint</p>

        {error && <p className="error">{error}</p>}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button className="btn login" onClick={handleLogin}>
          Login
        </button>

        <button className="btn signup" onClick={handleSignup}>
          Create Account
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button className="btn google" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

      </div>

    </div>

  );
}

export default Login;