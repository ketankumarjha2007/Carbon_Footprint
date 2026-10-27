import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
    FaGithub, FaLinkedin, FaEnvelope, FaLeaf,
    FaArrowUp, FaHeart, FaLock,
} from "react-icons/fa";
import "../styles/Footer.css";

const quickLinks = [
    { label: "Home", to: "/" },
    { label: "Calculator", to: "/calculator", protected: true },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
];

const socials = [
    { icon: <FaGithub />, href: "https://github.com/ketankumarjha2007", label: "GitHub" },
    { icon: <FaLinkedin />, href: "https://www.linkedin.com/in/ketan-kumar-jha-499064305/", label: "LinkedIn" },
    { icon: <FaEnvelope />, href: "mailto:ketankumarjha70@gmail.com", label: "Email" },
];

const tips = [
    "Switch to LED bulbs. They use far less energy than old bulbs.",
    "Choose public transport, cycling or walking for short trips.",
    "Unplug idle chargers, they still draw power.",
    "Eat local and seasonal to lower food-miles.",
    "Plant a tree today. It's a carbon sink for decades.",
];

const particles = Array.from({ length: 22 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    size: 3 + ((i * 7) % 6),
    delay: `${(i * 0.7) % 8}s`,
    duration: `${9 + ((i * 3) % 8)}s`,
}));

const hasToken = () => Boolean(localStorage.getItem("token"));

function Footer() {
    const footerRef = useRef(null);
    const [isLoggedIn, setIsLoggedIn] = useState(hasToken);
    const [tipIndex, setTipIndex] = useState(0);
    const [showTop, setShowTop] = useState(false);

    // keep the lock badge in sync with login/logout
    // (after login/logout run: window.dispatchEvent(new Event("auth-change")))
    useEffect(() => {
        const sync = () => setIsLoggedIn(hasToken());
        window.addEventListener("storage", sync);
        window.addEventListener("auth-change", sync);
        return () => {
            window.removeEventListener("storage", sync);
            window.removeEventListener("auth-change", sync);
        };
    }, []);

    useEffect(() => {
        const t = setInterval(() => setTipIndex((i) => (i + 1) % tips.length), 4500);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 400);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const onMouseMove = (e) => {
        const r = footerRef.current.getBoundingClientRect();
        footerRef.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
        footerRef.current.style.setProperty("--my", `${e.clientY - r.top}px`);
    };

    return (
        <footer className="footer" ref={footerRef} onMouseMove={onMouseMove}>
            <div className="footer-aurora" />
            <div className="footer-spotlight" />
            <div className="footer-watermark" aria-hidden="true">VASUDHA</div>

            <div className="footer-particles" aria-hidden="true">
                {particles.map((p, i) => (
                    <span
                        key={i}
                        style={{
                            left: p.left,
                            width: p.size,
                            height: p.size,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                        }}
                    />
                ))}
            </div>

            <div className="footer-container">
                <div className="footer-brand">
                    <div className="footer-logo">
                        <span className="footer-logo-icon"><FaLeaf /></span>
                        <h2>VASUDHA</h2>
                    </div>
                    <p>
                        Track, understand and reduce your carbon footprint.
                        Small choices, planet-sized impact.
                    </p>
                </div>

                <div className="footer-col">
                    <h4>Explore</h4>
                    <ul>
                        {quickLinks.map((l) => (
                            <li key={l.label}>
                                <Link to={l.to}>
                                    {l.label}
                                    {l.protected && !isLoggedIn && (
                                        <span className="lock-badge" title="Login required to calculate">
                                            <FaLock /> Login
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="footer-col footer-tip">
                    <h4>Eco Tip</h4>
                    <div className="tip-card">
                        <p key={tipIndex}>{tips[tipIndex]}</p>
                    </div>
                </div>

                <div className="footer-col footer-connect">
                    <h4>Connect</h4>
                    <div className="footer-socials">
                        {socials.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                target={s.href.startsWith("http") ? "_blank" : undefined}
                                rel="noreferrer"
                                aria-label={s.label}
                                className="social-btn"
                            >
                                {s.icon}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <span>© {new Date().getFullYear()} VASUDHA. All rights reserved.</span>
                <span className="footer-credit">
                    Designed &amp; built with <FaHeart className="heart" /> by{" "}
                    <strong>Ketan Kumar Jha</strong>
                </span>
            </div>

            <button
                className={`back-to-top ${showTop ? "show" : ""}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
            >
                <FaArrowUp />
            </button>
        </footer>
    );
}

export default Footer;