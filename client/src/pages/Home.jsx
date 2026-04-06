import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videoFile from "../assets/video.mp4";
import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const glowRef = useRef(null);
  const inputRef = useRef(null);
  const terminalRef = useRef(null);

  const [lines, setLines] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [index, setIndex] = useState(0);

  const [history, setHistory] = useState([]);
  const [cmdIndex, setCmdIndex] = useState(-1);

  const commands = ["help", "about", "features", "clear", "hack"];

  const bootText = [
    "Launching Carbon Intelligence Engine...",
    "Syncing with atmosphere APIs...",
    "Welcome to CarbonTrack ",
    "Type 'help' for commands"
  ];

  /* TYPEWRITER */
  const typeLine = (text) => {
    return new Promise((resolve) => {
      let i = 0;
      setCurrentText("");

      const interval = setInterval(() => {
        setCurrentText((prev) => prev + text[i]);
        i++;

        if (i >= text.length) {
          clearInterval(interval);
          setLines((prev) => [...prev, "> " + text]);
          setCurrentText("");
          resolve();
        }
      }, 20);
    });
  };

  /* BOOT FLOW */
  useEffect(() => {
    if (index < bootText.length) {
      const run = async () => {
        await typeLine(bootText[index]);
        setTimeout(() => setIndex((p) => p + 1), 300);
      };
      run();
    }
  }, [index]);

  /* COMMAND SYSTEM */
  const runCommand = (cmd) => {
    let output = [];

    switch (cmd) {
      case "help":
        output = [
          "Available Commands:",
          "about → platform info",
          "features → modules",
          "hack → simulate attack",
          "clear → reset",
          "tracker → Go to Login"
        ];
        break;

      case "about":
        output = [
          "CarbonTrack",
          "Give Real-Time Carbon and AQI Insights",
          "Built for real-time AQI tracking"
        ];
        break;
      case "tracker":
        output = [
          "Redirecting to Login..."
        ];
        setTimeout(() => navigate("/login"), 1000);
        break;

      case "features":
        output = [
          "Modules:",
          "• Carbon Tracking",
          "• AQI Monitoring",
          "• Smart AI suggestions"
        ];
        break;

      case "hack":
        fakeHack();
        return;

      case "clear":
        setLines([]);
        return;

      default:
        output = ["Command not found. Type 'help'"];
    }

    setLines((prev) => [...prev, "> " + cmd]);

    output.forEach((line, i) => {
      setTimeout(() => typeLine(line), i * 300);
    });
  };
  const fakeHack = () => {
    const steps = [
      "Bypassing firewall...",
      "Injecting payload...",
      "Decrypting system...",
      "Accessing secure node...",
      "Access Denied "
    ];

    setLines((prev) => [...prev, "> hack"]);

    steps.forEach((step, i) => {
      setTimeout(() => typeLine(step), i * 500);
    });
  };
  const handleKey = (e) => {
    if (e.key === "Enter") {
      const cmd = e.target.value.trim().toLowerCase();
      if (!cmd) return;

      setHistory((prev) => [...prev, cmd]);
      setCmdIndex(-1);

      runCommand(cmd);
      e.target.value = "";
    }

    if (e.key === "ArrowUp") {
      if (history.length === 0) return;
      const newIndex =
        cmdIndex < history.length - 1 ? cmdIndex + 1 : cmdIndex;
      setCmdIndex(newIndex);
      e.target.value = history[history.length - 1 - newIndex];
    }

    if (e.key === "ArrowDown") {
      if (cmdIndex <= 0) {
        setCmdIndex(-1);
        e.target.value = "";
      } else {
        const newIndex = cmdIndex - 1;
        setCmdIndex(newIndex);
        e.target.value = history[history.length - 1 - newIndex];
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const val = e.target.value;
      const match = commands.find((c) => c.startsWith(val));
      if (match) e.target.value = match;
    }
  };
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop =
        terminalRef.current.scrollHeight;
    }
  }, [lines, currentText]);
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

      particles.forEach((p) => {
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

  /* CURSOR GLOW */
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
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

          <div
            className="terminal"
            ref={terminalRef}
            onClick={() => inputRef.current.focus()}
          >
            {lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}

            {currentText && <p>{currentText}</p>}

            <div className="input-line">
              <span>{">"}</span>
              <input
                ref={inputRef}
                onKeyDown={handleKey}
                autoFocus
                spellCheck="false"
              />
            </div>
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