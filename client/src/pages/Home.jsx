import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videoFile from "../assets/video.mp4";

function Home() {
  const canvasRef = useRef(null);
  const [aqi, setAqi] = useState(null);
  const [aqiStatus, setAqiStatus] = useState("");
  const glowRef = useRef(null);

  /* PARTICLES */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(114,255,177,0.35)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(114,255,177,${0.08 - dist / 1500})`;
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  /* CURSOR GLOW */
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
      }
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {

    navigator.geolocation.getCurrentPosition(

      async (position) => {

        try {

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(
            `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi`
          );

          const data = await res.json();

          console.log(data);

          const aqiArray = data?.hourly?.us_aqi || [];

          const validAqi = aqiArray.filter(
            (v) => v !== null && v !== undefined
          );

          if (validAqi.length === 0) {
            setAqiStatus("AQI Unavailable");
            return;
          }

          const latestAqi =
            validAqi[validAqi.length - 1];

          console.log("Latest AQI:", latestAqi);

          setAqi(latestAqi);

          if (latestAqi <= 50)
            setAqiStatus("Healthy Air Quality 😊");

          else if (latestAqi <= 100)
            setAqiStatus("Moderate Air Quality 😐");

          else if (latestAqi <= 150)
            setAqiStatus("Unhealthy for Sensitive Groups 😷");

          else
            setAqiStatus("Poor Air Quality 🚨");

        } catch (err) {

          console.log("AQI Error:", err);

          setAqiStatus("Failed To Load AQI");

        }

      },

      (error) => {

        console.log("Location Error:", error);

        setAqiStatus("Location Permission Denied");

      }

    );

  }, []);

  return (
    <div className="home">
      <div className="gradient-bg"></div>

      <canvas ref={canvasRef} className="particles"></canvas>

      <div ref={glowRef} className="cursor-glow"></div>

      <section className="hero">
        <div className="hero-content">
          <div className="top-badge">
            Monitor Your Carbon Footprint & Air Quality in Real-Time
          </div>

          <h1>
            Build A <span>Greener</span>
            <br />
            Future With Data
          </h1>

          <p>
            CarbonTrack delivers intelligent carbon analytics,
            AQI monitoring, and sustainability insights through
            a powerful real-time environmental intelligence system.
          </p>

          <div className="hero-grid">
            <div className="glass-card main-card">
              <div className="card-top">
                <span className="live-dot"></span>
                LIVE ENVIRONMENT STATUS
              </div>

              <h2>{aqiStatus || "Loading AQI..."}</h2>

              <div className="aqi-value">
                {aqi !== null ? aqi : "--"} <span>AQI</span>
              </div>

              <div className="mini-stats">
                <div>
                  <h3>98%</h3>
                  <p>Prediction Accuracy</p>
                </div>

                <div>
                  <h3>24/7</h3>
                  <p>Monitoring</p>
                </div>

                <div>
                  <h3>AI</h3>
                  <p>Smart Insights</p>
                </div>
              </div>
            </div>

            <div className="side-cards">
              <div className="glass-card small-card">
                <h3>Carbon Tracking</h3>
                <p>
                  Measure and reduce emissions with precision.
                </p>
              </div>

              <div className="glass-card small-card">
                <h3>Smart Recommendations</h3>
                <p>
                  AI-generated eco suggestions for sustainability.
                </p>
              </div>
            </div>
          </div>

          <div className="cta">
            <Link to="/login" className="btn primary">
              Launch Platform
            </Link>

            <Link to="/about" className="btn secondary">
              Explore More
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        {[
          {
            title: "Real-Time Carbon Analytics",
            desc: "Track emissions instantly with advanced monitoring systems."
          },
          {
            title: "Environmental Intelligence",
            desc: "Powerful AI insights designed for sustainable decisions."
          },
          {
            title: "Smart AQI Monitoring",
            desc: "Live air quality data with predictive environmental analysis."
          }
        ].map((item, i) => (
          <div className="feature-card" key={i}>
            <div className="feature-inner">
              <div className="feature-line"></div>

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