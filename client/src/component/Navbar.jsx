import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  Leaf,
  Heart,
  LogOut,
  ChevronDown,
  LogIn,
  Home,
  Info,
  Mail,
  LayoutDashboard,
  Calculator,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import "../styles/Navbar.css";

const GUEST_LINKS = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
];

const USER_LINKS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calculator", label: "Calculator", icon: Calculator },
  { to: "/tracker", label: "Tracker", icon: Activity },
];

function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdown, setDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imgOk, setImgOk] = useState(true);
  const [hoverKey, setHoverKey] = useState(null);
  const [pill, setPill] = useState({ left: 0, width: 0, show: false });

  const profileRef = useRef(null);
  const linksRef = useRef(null);

  /* auth */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setImgOk(true);
    });
    return () => unsub();
  }, []);

  /* scroll state + page progress */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScrolled(window.scrollY > 8);
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  /* close everything when the route changes */
  useEffect(() => {
    setMenuOpen(false);
    setDropdown(false);
    setHoverKey(null);
  }, [pathname]);

  /* outside click + Escape */
  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setDropdown(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setDropdown(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  /* lock page scroll while the mobile menu is open; close it on desktop resize */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onResize = () => window.innerWidth > 860 && setMenuOpen(false);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setDropdown(false);
    setMenuOpen(false);
    await signOut(auth);
    navigate("/");
  };

  const isActive = (to, exact) => (exact ? pathname === to : pathname.startsWith(to));
  const links = user ? USER_LINKS : GUEST_LINKS;
  const activeKey = links.find((l) => isActive(l.to, l.exact))?.to ?? null;

  /* sliding pill follows hover, rests on the active link */
  useLayoutEffect(() => {
    const place = () => {
      const wrap = linksRef.current;
      const key = hoverKey ?? activeKey;
      const el = wrap && key ? wrap.querySelector(`[data-to="${key}"]`) : null;
      if (!el) return setPill((p) => ({ ...p, show: false }));
      setPill({ left: el.offsetLeft, width: el.offsetWidth, show: true });
    };
    place();
    window.addEventListener("resize", place);
    if (document.fonts?.ready) document.fonts.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [hoverKey, activeKey, user]);

  const firstName = user?.displayName?.split(" ")[0] || "User";
  const initial = firstName.charAt(0).toUpperCase();

  const renderAvatar = (size = "") =>
    user?.photoURL && imgOk ? (
      <img
        className={`nv-avatar ${size}`}
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImgOk(false)}
      />
    ) : (
      <span className={`nv-avatar nv-avatar-fallback ${size}`} aria-hidden="true">
        {initial}
      </span>
    );

  const renderLink = (l) => (
    <Link
      key={l.to}
      to={l.to}
      data-to={l.to}
      className={`nv-link ${isActive(l.to, l.exact) ? "is-active" : ""}`}
      aria-current={isActive(l.to, l.exact) ? "page" : undefined}
      onMouseEnter={() => setHoverKey(l.to)}
      onFocus={() => setHoverKey(l.to)}
    >
      {l.label}
    </Link>
  );

  return (
    <header
      className={`nv ${scrolled ? "is-scrolled" : ""} ${menuOpen ? "is-open" : ""}`}
      style={{ "--nv-p": progress }}
    >
      <nav className="nv-bar" aria-label="Main">
        <span className="nv-aurora" aria-hidden="true" />

        <Link to="/" className="nv-logo" aria-label="Vasudha home">
          <span className="nv-logo-mark">
            <Leaf size={18} strokeWidth={2.4} />
          </span>
          <span className="nv-logo-text">
            Vasudha<i>.</i>
          </span>
        </Link>

        {/* desktop links */}
        <div
          className="nv-links"
          ref={linksRef}
          onMouseLeave={() => setHoverKey(null)}
          onBlur={() => setHoverKey(null)}
        >
          <span
            className={`nv-pill ${pill.show ? "show" : ""}`}
            style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
            aria-hidden="true"
          />
          {links.map(renderLink)}
        </div>

        <div className="nv-right">
          <Link
            to="/donate"
            className={`nv-donate ${isActive("/donate") ? "is-active" : ""}`}
            aria-label="Donate"
          >
            <Heart size={16} strokeWidth={2.6} className="nv-heart" />
            <span>Donate</span>
          </Link>

          {/* desktop account area */}
          {!user ? (
            <Link to="/login" className="nv-signin nv-desk">
              Sign in
              <ArrowUpRight size={15} strokeWidth={2.5} />
            </Link>
          ) : (
            <div className="nv-profile nv-desk" ref={profileRef}>
              <button
                type="button"
                className={`nv-profile-btn ${dropdown ? "is-open" : ""}`}
                onClick={() => setDropdown((d) => !d)}
                aria-haspopup="menu"
                aria-expanded={dropdown}
              >
                {renderAvatar()}
                <span className="nv-name">{firstName}</span>
                <ChevronDown size={15} className="nv-chev" />
              </button>

              <div className={`nv-menu ${dropdown ? "show" : ""}`} role="menu">
                <div className="nv-menu-head">
                  {renderAvatar("lg")}
                  <div>
                    <strong>{user.displayName || "Vasudha member"}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <Link to="/dashboard" role="menuitem" className="nv-menu-item nv-menu-neutral">
                  <LayoutDashboard size={16} /> My dashboard
                </Link>
                <button type="button" role="menuitem" className="nv-menu-item" onClick={handleLogout}>
                  <LogOut size={16} /> Log out
                </button>
              </div>
            </div>
          )}

          {/* hamburger */}
          <button
            type="button"
            className="nv-burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="nv-drawer"
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <span className="nv-progress" aria-hidden="true">
          <span />
        </span>
      </nav>

      {/* mobile drawer */}
      <div id="nv-drawer" className="nv-drawer" aria-hidden={!menuOpen}>
        <div className="nv-drawer-in">
          <p className="nv-drawer-eyebrow">Menu</p>
          <div className="nv-drawer-links">
            {links.map((l, i) => {
              const Icon = l.icon;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{ "--i": i }}
                  tabIndex={menuOpen ? 0 : -1}
                  className={`nv-dlink ${isActive(l.to, l.exact) ? "is-active" : ""}`}
                  aria-current={isActive(l.to, l.exact) ? "page" : undefined}
                >
                  <span className="nv-dlink-ico">
                    <Icon size={20} />
                  </span>
                  <span className="nv-dlink-label">{l.label}</span>
                  <ArrowUpRight size={18} className="nv-dlink-arrow" />
                </Link>
              );
            })}
          </div>

          <div className="nv-drawer-foot" style={{ "--i": links.length }}>
            {!user ? (
              <Link to="/login" className="nv-drawer-signin" tabIndex={menuOpen ? 0 : -1}>
                <LogIn size={18} /> Sign in
              </Link>
            ) : (
              <>
                <div className="nv-drawer-user">
                  {renderAvatar("lg")}
                  <div>
                    <strong>{user.displayName || "Vasudha member"}</strong>
                    <small>{user.email}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="nv-drawer-logout"
                  onClick={handleLogout}
                  tabIndex={menuOpen ? 0 : -1}
                >
                  <LogOut size={18} /> Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;