import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Leaf,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import "../styles/login.css";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };
  const pwScore = getPasswordStrength();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      let msg = err?.message || "Authentication error.";
      if (err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password") {
        msg = "Invalid email or password. Please verify your credentials.";
      } else if (err?.code === "auth/email-already-in-use") {
        msg = "This email is already registered. Please sign in instead.";
      } else if (err?.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters long.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="god-auth-wrapper">
      {/* Dynamic Ambient Nebulae */}
      <div className="auth-nebula nebula-1" />
      <div className="auth-nebula nebula-2" />
      <div className="auth-nebula nebula-3" />

      {/* Cyber Grid */}
      <div className="auth-grid-overlay" />

      {/* Floating Stardust */}
      <div className="auth-stardust-layer">
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="auth-dust"
            style={{
              left: `${(i * 5.5 + 8) % 94}%`,
              animationDuration: `${10 + (i % 5) * 3}s`,
              animationDelay: `${(i * 0.6) % 6}s`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
            }}
          />
        ))}
      </div>

      <div className="auth-card-sanctuary">
        {/* Glow Border Rim */}
        <div className="sanctuary-glow-rim" />

        {/* Brand Crest */}
        <div className="sanctuary-crest">
          <div className="crest-emblem">🌿</div>
          <span className="crest-tag">VASUDHA ECO-IDENTITY</span>
        </div>

        {/* Title */}
        <h1 className="sanctuary-title">
          {isSignUp ? "Create Your Account" : "Welcome Back"}
        </h1>
        <p className="sanctuary-sub">
          {isSignUp
            ? "Join thousands of eco-warriors tracking and reducing emissions."
            : "Access your verified carbon dashboard and monthly honors."}
        </p>

        {/* Sliding Pill Tab Switcher */}
        <div className="sanctuary-tab-slider">
          <button
            type="button"
            className={`tab-switch ${!isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(false);
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`tab-switch ${isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(true);
              setError("");
            }}
          >
            Create Account
          </button>
          <div className={`tab-indicator ${isSignUp ? "right" : "left"}`} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="sanctuary-error-box">
            <span className="err-ico">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleEmailAuth} className="sanctuary-form">
          {isSignUp && (
            <div className="sanctuary-field-group">
              <label htmlFor="sanc-name">Full Name</label>
              <div className="sanc-input-wrap">
                <User size={18} className="sanc-icon" />
                <input
                  id="sanc-name"
                  type="text"
                  placeholder="e.g. Ketan Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="sanctuary-field-group">
            <label htmlFor="sanc-email">Email Address</label>
            <div className="sanc-input-wrap">
              <Mail size={18} className="sanc-icon" />
              <input
                id="sanc-email"
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="sanctuary-field-group">
            <div className="sanc-label-row">
              <label htmlFor="sanc-password">Password</label>
              {!isSignUp && (
                <span className="sanc-secure-tag">256-Bit SSL</span>
              )}
            </div>
            <div className="sanc-input-wrap">
              <Lock size={18} className="sanc-icon" />
              <input
                id="sanc-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="sanc-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {isSignUp && password && (
              <div className="sanc-meter">
                <div className="meter-track">
                  <span className={`meter-seg ${pwScore >= 1 ? "filled" : ""}`} />
                  <span className={`meter-seg ${pwScore >= 2 ? "filled" : ""}`} />
                  <span className={`meter-seg ${pwScore >= 3 ? "filled" : ""}`} />
                  <span className={`meter-seg ${pwScore >= 4 ? "filled" : ""}`} />
                </div>
                <span className="meter-text">
                  {pwScore <= 1 && "Weak"}
                  {pwScore === 2 && "Fair"}
                  {pwScore === 3 && "Strong"}
                  {pwScore === 4 && "Impenetrable"}
                </span>
              </div>
            )}
          </div>

          {/* Primary CTA Submit Button */}
          <button type="submit" className="sanctuary-submit-btn" disabled={loading}>
            <span className="submit-shine" />
            <span className="submit-text">
              {loading ? (
                "Authenticating..."
              ) : isSignUp ? (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <span>Sign In to Vasudha</span>
                  <ArrowRight size={18} />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Divider */}
        <div className="sanctuary-divider">
          <span className="sanc-div-line" />
          <span className="sanc-div-text">OR CONTINUE WITH</span>
          <span className="sanc-div-line" />
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          className="sanctuary-google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg className="google-svg" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Security / Trust Footer */}
        <div className="sanctuary-trust-footer">
          <div className="trust-item">
            <ShieldCheck size={14} className="trust-ico" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="trust-dot">•</span>
          <div className="trust-item">
            <Leaf size={14} className="trust-ico" />
            <span>100% Carbon Neutral</span>
          </div>
        </div>
      </div>
    </div>
  );
}