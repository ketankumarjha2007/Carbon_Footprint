import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Leaf,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
  KeyRound,
  Zap,
  Globe2,
  TrendingDown,
  Loader2,
} from "lucide-react";
import "../styles/login.css";

/* ---------- helpers ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const friendlyError = (err) => {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please check and try again.";
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and retry.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Sign-in window was closed before finishing.";
    case "auth/popup-blocked":
      return "Popup was blocked by your browser. Please allow popups.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
};

const STRENGTH_LABELS = ["", "Weak", "Fair", "Strong", "Unbreakable"];

export default function Login() {
  // mode: "signin" | "signup" | "reset"
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const busyRef = useRef(false); // stops the auth listener from redirecting mid-signup
  const passwordRef = useRef(null);

  const isSignUp = mode === "signup";
  const isReset = mode === "reset";

  /* Redirect if already authenticated */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !busyRef.current) navigate("/dashboard");
    });
    return () => unsubscribe();
  }, [navigate]);

  /* Password rules + strength */
  const rules = useMemo(
    () => [
      { label: "At least 8 characters", ok: password.length >= 8 },
      { label: "Upper & lowercase letters", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: "A number", ok: /[0-9]/.test(password) },
      { label: "A special character", ok: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );
  const pwScore = useMemo(() => {
    if (!password) return 0;
    const passed = rules.filter((r) => r.ok).length;
    if (password.length < 6) return 1;
    return Math.max(1, passed);
  }, [password, rules]);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
    setShowPassword(false);
    if (next !== "signup") setName("");
  };

  const handleKey = (e) => {
    if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
  };

  /* ---------- actions ---------- */
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    busyRef.current = true;
    try {
      await signInWithPopup(auth, provider);
      busyRef.current = false;
      navigate("/dashboard");
    } catch (err) {
      busyRef.current = false;
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      passwordRef.current?.focus();
      return;
    }
    if (isSignUp && password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    setLoading(true);
    busyRef.current = true;
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      busyRef.current = false;
      navigate("/dashboard");
    } catch (err) {
      busyRef.current = false;
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the email linked to your account.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo(
        "If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder)."
      );
    } catch (err) {
      // Don't reveal whether an account exists
      if (err?.code === "auth/user-not-found") {
        setInfo(
          "If an account exists for that email, a reset link is on its way. Check your inbox (and spam folder)."
        );
      } else {
        setError(friendlyError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------- copy ---------- */
  const title = isReset ? "Reset your password" : isSignUp ? "Create your account" : "Welcome back";
  const subtitle = isReset
    ? "Enter your email and we'll send you a secure link to set a new password."
    : isSignUp
    ? "Join thousands of eco-warriors tracking and reducing their emissions."
    : "Access your verified carbon dashboard and monthly honors.";

  return (
    <div className="vx-page">
      {/* ambient background */}
      <div className="vx-orb vx-orb-1" aria-hidden="true" />
      <div className="vx-orb vx-orb-2" aria-hidden="true" />
      <div className="vx-orb vx-orb-3" aria-hidden="true" />
      <div className="vx-grid" aria-hidden="true" />
      <div className="vx-dust" aria-hidden="true">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            style={{
              left: `${(i * 6.1 + 5) % 96}%`,
              animationDuration: `${12 + (i % 5) * 3}s`,
              animationDelay: `${(i * 0.7) % 7}s`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
            }}
          />
        ))}
      </div>

      <div className="vx-shell">
        {/* ============ LEFT: brand panel ============ */}
        <aside className="vx-hero">
          <div className="vx-brand">
            <span className="vx-brand-mark">
              <Leaf size={20} />
            </span>
            <span className="vx-brand-name">Vasudha</span>
          </div>

          <div className="vx-hero-body">
            <span className="vx-pill">
              <Zap size={13} /> ECO-IDENTITY PLATFORM
            </span>
            <h2 className="vx-hero-title">
              Measure it.
              <br />
              <span className="vx-grad">Shrink it.</span> Own it.
            </h2>
            <p className="vx-hero-text">
              Your personal carbon ledger — verified, gamified and built to turn everyday choices
              into measurable climate impact.
            </p>

            <ul className="vx-feature-list">
              <li>
                <span className="vx-feat-ico"><TrendingDown size={16} /></span>
                <div>
                  <strong>Live emission tracking</strong>
                  <small>See your footprint fall week over week</small>
                </div>
              </li>
              <li>
                <span className="vx-feat-ico"><ShieldCheck size={16} /></span>
                <div>
                  <strong>Verified monthly honors</strong>
                  <small>Earn badges backed by real data</small>
                </div>
              </li>
              <li>
                <span className="vx-feat-ico"><Globe2 size={16} /></span>
                <div>
                  <strong>Community leaderboards</strong>
                  <small>Compete with eco-warriors worldwide</small>
                </div>
              </li>
            </ul>
          </div>

        </aside>

        {/* ============ RIGHT: auth card ============ */}
        <main className="vx-card-wrap">
          <section className="vx-card" aria-labelledby="vx-title">
            <div className="vx-rim" aria-hidden="true" />

            {/* mobile-only brand */}
            <div className="vx-mobile-brand">
              <span className="vx-brand-mark"><Leaf size={18} /></span>
              <span className="vx-brand-name">Vasudha</span>
            </div>

            {isReset && (
              <button type="button" className="vx-back" onClick={() => switchMode("signin")}>
                <ArrowLeft size={16} /> Back to sign in
              </button>
            )}

            {isReset && (
              <div className="vx-reset-ico"><KeyRound size={26} /></div>
            )}

            <h1 id="vx-title" className="vx-title">{title}</h1>
            <p className="vx-sub">{subtitle}</p>

            {/* tab switcher */}
            {!isReset && (
              <div className="vx-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isSignUp}
                  className={`vx-tab ${!isSignUp ? "active" : ""}`}
                  onClick={() => switchMode("signin")}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isSignUp}
                  className={`vx-tab ${isSignUp ? "active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Create Account
                </button>
                <span className={`vx-tab-pill ${isSignUp ? "right" : "left"}`} aria-hidden="true" />
              </div>
            )}

            {/* alerts */}
            {error && (
              <div className="vx-alert vx-alert-error" role="alert">
                <AlertTriangle size={17} />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="vx-alert vx-alert-ok" role="status">
                <CheckCircle2 size={17} />
                <span>{info}</span>
              </div>
            )}

            {/* ---------- RESET FORM ---------- */}
            {isReset ? (
              <form onSubmit={handleReset} className="vx-form" noValidate>
                <div className="vx-field">
                  <label htmlFor="vx-email">Email address</label>
                  <div className="vx-input">
                    <Mail size={18} className="vx-ico" />
                    <input
                      id="vx-email"
                      type="email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="vx-btn vx-btn-primary" disabled={loading}>
                  <span className="vx-shine" />
                  <span className="vx-btn-in">
                    {loading ? (
                      <><Loader2 size={18} className="vx-spin" /> Sending link…</>
                    ) : (
                      <>Send reset link <ArrowRight size={18} /></>
                    )}
                  </span>
                </button>
              </form>
            ) : (
              /* ---------- SIGN IN / SIGN UP FORM ---------- */
              <form onSubmit={handleEmailAuth} className="vx-form" noValidate>
                {isSignUp && (
                  <div className="vx-field">
                    <label htmlFor="vx-name">Full name</label>
                    <div className="vx-input">
                      <User size={18} className="vx-ico" />
                      <input
                        id="vx-name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        placeholder="e.g. Ketan Kumar"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="vx-field">
                  <label htmlFor="vx-email">Email address</label>
                  <div className="vx-input">
                    <Mail size={18} className="vx-ico" />
                    <input
                      id="vx-email"
                      type="email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="vx-field">
                  <label htmlFor="vx-password">Password</label>
                  <div className="vx-input">
                    <Lock size={18} className="vx-ico" />
                    <input
                      ref={passwordRef}
                      id="vx-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKey}
                      onKeyUp={handleKey}
                      onBlur={() => setCapsOn(false)}
                    />
                    <button
                      type="button"
                      className="vx-eye"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* caps-lock hint (left) + forgot password (right), directly under the field */}
                  {(capsOn || !isSignUp) && (
                    <div className="vx-pass-meta">
                      {capsOn ? (
                        <span className="vx-caps">
                          <Info size={13} /> Caps Lock is on
                        </span>
                      ) : (
                        <span />
                      )}
                      {!isSignUp && (
                        <button
                          type="button"
                          className="vx-link"
                          onClick={() => switchMode("reset")}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                  )}

                  {/* strength meter + checklist */}
                  {isSignUp && password && (
                    <div className="vx-strength">
                      <div className="vx-meter">
                        <div className="vx-meter-track" data-level={pwScore}>
                          {[1, 2, 3, 4].map((n) => (
                            <span key={n} className={pwScore >= n ? "on" : ""} />
                          ))}
                        </div>
                        <span className="vx-meter-label" data-level={pwScore}>
                          {STRENGTH_LABELS[pwScore]}
                        </span>
                      </div>
                      <ul className="vx-rules">
                        {rules.map((r) => (
                          <li key={r.label} className={r.ok ? "ok" : ""}>
                            {r.ok ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button type="submit" className="vx-btn vx-btn-primary" disabled={loading}>
                  <span className="vx-shine" />
                  <span className="vx-btn-in">
                    {loading ? (
                      <><Loader2 size={18} className="vx-spin" /> Authenticating…</>
                    ) : isSignUp ? (
                      <>Create free account <ArrowRight size={18} /></>
                    ) : (
                      <>Sign in to Vasudha <ArrowRight size={18} /></>
                    )}
                  </span>
                </button>
              </form>
            )}

            {/* social login */}
            {!isReset && (
              <>
                <div className="vx-divider">
                  <span /><em>OR CONTINUE WITH</em><span />
                </div>

                <button
                  type="button"
                  className="vx-btn vx-btn-google"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </>
            )}

            {/* switch line */}
            {!isReset && (
              <p className="vx-switch">
                {isSignUp ? "Already have an account?" : "New to Vasudha?"}{" "}
                <button
                  type="button"
                  className="vx-link"
                  onClick={() => switchMode(isSignUp ? "signin" : "signup")}
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </p>
            )}

            {/* trust footer */}
            <div className="vx-trust">
              <span><ShieldCheck size={14} /> Secured by Firebase</span>
              <i>•</i>
              <span><Leaf size={14} /> Carbon-conscious</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}