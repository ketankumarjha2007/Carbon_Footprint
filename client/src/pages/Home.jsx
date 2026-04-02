import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videoFile from "../assets/video.mp4";

function Home() {

  const canvasRef = useRef(null);
  const glowRef = useRef(null);

  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [index, setIndex] = useState(0);

  const bootText = [
    "Launching Carbon Intelligence Engine...",
    "Syncing with atmosphere APIs...",
    "Calibrating emission metrics...",
    "Deploying smart insights...",
    "CarbonTrack is online ✔"
  ];
  const typeLine = (text) => {
    return new Promise((resolve) => {
      let i = 0;
      setCurrentText("");

      const interval = setInterval(() => {
        setCurrentText(prev => prev + text[i]);
        i++;

        if (i >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, 25);
    });
  };

  /* TERMINAL FLOW */
  useEffect(() => {
    if (index < bootText.length) {

      const run = async () => {
        const line = bootText[index];

        await typeLine(line);

        setLines(prev => [...prev, line]);
        setCurrentText("");

        setTimeout(() => {
          setIndex(prev => prev + 1);
        }, 300);
      };

      run();
    }
  }, [index]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5,
      dx: (Math.random() - 0.5) * 0.5,
      dy: (Math.random() - 0.5) * 0.5
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(34,211,238,0.25)";

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();
  }, []);
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  useEffect(() => {
    const cards = document.querySelectorAll(".feature-card");

    const handleMove = (card, e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - rect.left}px`);
      card.style.setProperty("--y", `${e.clientY - rect.top}px`);
    };

    cards.forEach(card => {
      const listener = (e) => handleMove(card, e);
      card.addEventListener("mousemove", listener);
      card._listener = listener;
    });

    return () => {
      cards.forEach(card => {
        if (card._listener) {
          card.removeEventListener("mousemove", card._listener);
        }
      });
    };
  }, []);

  return (
    <div className="home">
      <div className="aurora"></div>
      <canvas ref={canvasRef} className="particles"></canvas>
      <div ref={glowRef} className="glow"></div>
      <section className="hero">
        <div className="hero-content">

          <h1>
            Carbon<span>Track</span>
          </h1>

          <p>
            Smart carbon footprint and AQI monitoring platform
            built for a sustainable future.
          </p>
          <div className="terminal">

            {lines.map((l, i) => (
              <p key={i}>{"> " + l}</p>
            ))}

            {currentText && (
              <p>{"> " + currentText}</p>
            )}

            <span className="cursor"></span>

          </div>

          <div className="cta">
            <Link to="/login" className="btn primary">
              Get Started
            </Link>
            <Link to="/about" className="btn secondary">
              Learn More
            </Link>
          </div>

        </div>
      </section>
      <section className="features">
        {[
          {
            title: "Carbon Tracking",
            desc: "Track emissions and understand your impact."
          },
          {
            title: "AQI Monitoring",
            desc: "Real-time air quality intelligence."
          },
          {
            title: "Smart Insights",
            desc: "AI-powered sustainability suggestions."
          }
        ].map((item, i) => (
          <div className="feature-card" key={i}>
            <div className="inner">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </section>
      <section className="video-section">
        <div className="video-wrapper">
          <video autoPlay muted loop playsInline>
            <source src={videoFile} type="video/mp4" />
          </video>
        </div>
      </section>

    </div>
  );
}

export default Home;