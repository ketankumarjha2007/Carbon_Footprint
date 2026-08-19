import React, { useEffect, useRef, useState, useCallback } from "react";
import "../styles/offlineGame.css";

const GAME_WIDTH = 1000;
const GAME_HEIGHT = 500;
const GROUND_Y = 410;
const COMBO_DECAY_FRAMES = 150; // ~2.5s at 60fps before streak resets
const MILESTONE_STEP = 500; // meters

const DIFFICULTIES = {
  easy: { label: "Easy", speed: 5, obstacleMult: 1.35, spawnGap: 30 },
  normal: { label: "Normal", speed: 6, obstacleMult: 1, spawnGap: 0 },
  hard: { label: "Hard", speed: 7.5, obstacleMult: 0.75, spawnGap: -20 },
};

const POWERUP_TYPES = {
  shield: { icon: "\uD83D\uDEE1\uFE0F", duration: 480, label: "Shield" },
  magnet: { icon: "\uD83E\uDDF2", duration: 420, label: "Magnet" },
  slowmo: { icon: "\u23F1\uFE0F", duration: 360, label: "Slow-Mo" },
};

export default function OfflineGame() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioCtxRef = useRef(null);
  const canvasWrapRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [comboPct, setComboPct] = useState(0);
  const [muted, setMuted] = useState(false);
  const [levelFlash, setLevelFlash] = useState(false);
  const [milestoneFlash, setMilestoneFlash] = useState(null);
  const [shake, setShake] = useState(false);
  const [summary, setSummary] = useState({ items: 0, distance: 0, best: 0, powerups: 0 });
  const [difficulty, setDifficulty] = useState("normal");
  const [activePowerUp, setActivePowerUp] = useState(null); // { type, pct }
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("carbonTrackEcoHighScore")) || 0
  );

  const mutedRef = useRef(muted);
  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const game = useRef({
    player: { x: 120, y: GROUND_Y - 58, width: 50, height: 58, velocityY: 0, jumping: false, squash: 1, jumpsUsed: 0 },
    obstacles: [],
    collectibles: [],
    powerUps: [],
    particles: [],
    trail: [],
    clouds: [],
    stars: [],
    score: 0,
    speed: 6,
    frame: 0,
    level: 1,
    streak: 0,
    framesSinceCollect: 0,
    itemsCollected: 0,
    powerupsCollected: 0,
    nextMilestone: MILESTONE_STEP,
    activePowerUp: null, // { type, timeLeft, duration }
    shieldHits: 0,
    obstacleTimer: 80,
    collectibleTimer: 100,
    powerUpTimer: 500,
    running: false,
    paused: false,
    diff: DIFFICULTIES.normal,
  });

  const vibrate = (pattern) => {
    if (navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) { /* noop */ }
    }
  };

  // -----------------------------
  // AUDIO
  // -----------------------------
  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    return audioCtxRef.current;
  };

  const playTone = useCallback((freq, duration = 0.12, type = "sine", gainVal = 0.06, delay = 0) => {
    if (mutedRef.current) return;
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  }, []);

  const sfxJump = () => playTone(520, 0.09, "square", 0.05);
  const sfxDoubleJump = () => { playTone(620, 0.07, "square", 0.05); playTone(820, 0.08, "square", 0.04, 0.04); };
  const sfxCollect = () => { playTone(700, 0.08, "sine", 0.06); playTone(950, 0.09, "sine", 0.05, 0.05); };
  const sfxPowerUp = () => { [660, 880, 1100].forEach((f, i) => playTone(f, 0.1, "triangle", 0.05, i * 0.06)); };
  const sfxHit = () => { playTone(160, 0.25, "sawtooth", 0.08); playTone(90, 0.3, "sawtooth", 0.06, 0.06); };
  const sfxShieldBlock = () => { playTone(300, 0.1, "square", 0.06); playTone(200, 0.12, "square", 0.05, 0.05); };
  const sfxLevel = () => { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 0.14, "triangle", 0.05, i * 0.07)); };
  const sfxMilestone = () => { [784, 988].forEach((f, i) => playTone(f, 0.12, "sine", 0.05, i * 0.09)); };

  // -----------------------------
  // START GAME
  // -----------------------------
  const startGame = () => {
    const diff = DIFFICULTIES[difficulty];
    game.current = {
      player: { x: 120, y: GROUND_Y - 58, width: 50, height: 58, velocityY: 0, jumping: false, squash: 1, jumpsUsed: 0 },
      obstacles: [],
      collectibles: [],
      powerUps: [],
      particles: [],
      trail: [],
      clouds: [
        { x: 100, y: 80, size: 1 },
        { x: 450, y: 120, size: 0.8 },
        { x: 800, y: 70, size: 1.2 },
      ],
      stars: Array.from({ length: 40 }, () => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * 220,
        r: Math.random() * 1.4 + 0.3,
        tw: Math.random() * Math.PI * 2,
      })),
      score: 0,
      speed: diff.speed,
      frame: 0,
      level: 1,
      streak: 0,
      framesSinceCollect: 0,
      itemsCollected: 0,
      powerupsCollected: 0,
      nextMilestone: MILESTONE_STEP,
      activePowerUp: null,
      shieldHits: 0,
      obstacleTimer: 80 + diff.spawnGap,
      collectibleTimer: 100,
      powerUpTimer: 420,
      running: true,
      paused: false,
      diff,
    };

    setStarted(true);
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setLevel(1);
    setStreak(0);
    setComboPct(0);
    setActivePowerUp(null);
  };

  const jump = () => {
    const g = game.current;
    if (!g.running || g.paused) return;
    const maxJumps = 2; // double jump always available
    if (!g.player.jumping) {
      g.player.velocityY = -15;
      g.player.jumping = true;
      g.player.jumpsUsed = 1;
      g.player.squash = 1.25;
      sfxJump();
      vibrate(10);
    } else if (g.player.jumpsUsed < maxJumps) {
      g.player.velocityY = -13;
      g.player.jumpsUsed += 1;
      g.player.squash = 1.3;
      createParticles(g.player.x + g.player.width / 2, g.player.y + g.player.height, "148,163,184");
      sfxDoubleJump();
      vibrate(15);
    }
  };

  const collision = (a, b) => {
    const padding = 8;
    return (
      a.x + padding < b.x + b.width &&
      a.x + a.width - padding > b.x &&
      a.y + padding < b.y + b.height &&
      a.y + a.height - padding > b.y
    );
  };

  const createParticles = (x, y, color = "34,197,94", count = 12) => {
    for (let i = 0; i < count; i++) {
      game.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 1,
        life: 32,
        color,
      });
    }
  };

  // -----------------------------
  // DRAWING
  // -----------------------------
  const skyForLevel = (lvl) => {
    const palettes = [
      ["#dff7e5", "#b8eac5", "#65b978", "day"],
      ["#d7f3ee", "#a9e0d4", "#4aa793", "day"],
      ["#e7f0ff", "#c2d9f7", "#5f8fd9", "day"],
      ["#fdeee0", "#f6cfa8", "#e08a3d", "dusk"],
      ["#1e2a4a", "#2c3d63", "#4a5a8a", "night"],
    ];
    return palettes[Math.min(lvl - 1, palettes.length - 1)];
  };

  const drawBackground = (ctx, lvl) => {
    const [c1, c2, c3, mood] = skyForLevel(lvl);
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, c1);
    gradient.addColorStop(0.55, c2);
    gradient.addColorStop(1, c3);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    if (mood === "night") {
      game.current.stars.forEach((s) => {
        const tw = 0.5 + Math.sin(game.current.frame * 0.05 + s.tw) * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${0.3 + tw * 0.6})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.arc(850, 80, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1e2a4a";
      ctx.beginPath();
      ctx.arc(862, 72, 26, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(850, 80, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(850, 80, 54, 0, Math.PI * 2);
      ctx.fillStyle = "#fde047";
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = mood === "night" ? "rgba(20,30,55,0.7)" : "rgba(60,90,70,0.55)";
    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(180, 150);
    ctx.lineTo(350, 300);
    ctx.lineTo(520, 130);
    ctx.lineTo(720, 300);
    ctx.lineTo(850, 170);
    ctx.lineTo(1000, 300);
    ctx.lineTo(1000, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    game.current.clouds.forEach((cloud) => {
      ctx.fillStyle = mood === "night" ? "rgba(200,210,235,0.35)" : "rgba(255,255,255,0.85)";
      const { x, y, size: s } = cloud;
      ctx.beginPath();
      ctx.arc(x, y, 25 * s, 0, Math.PI * 2);
      ctx.arc(x + 30 * s, y - 10 * s, 32 * s, 0, Math.PI * 2);
      ctx.arc(x + 65 * s, y, 25 * s, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = mood === "night" ? "#0f2818" : "#14532d";
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);

    ctx.strokeStyle = mood === "night" ? "#2f6b4a" : "#4ade80";
    ctx.lineWidth = 3;
    const offset = (game.current.frame * game.current.speed) % 25;
    for (let x = -25; x < GAME_WIDTH + 25; x += 25) {
      const gx = x - offset;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx + 6, GROUND_Y - 10);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(74,222,128,0.35)";
    ctx.fillRect(0, GROUND_Y - 2, GAME_WIDTH, 2);
  };

  const drawTrail = (ctx) => {
    game.current.trail.forEach((t) => {
      ctx.fillStyle = `rgba(34,197,94,${(t.life / 20) * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(t.x, t.y, 10 * (t.life / 20), 4 * (t.life / 20), 0, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawPlayer = (ctx, player, activePowerUp) => {
    const squash = player.squash;

    if (activePowerUp && activePowerUp.type === "shield") {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(game.current.frame * 0.2) * 0.15;
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (activePowerUp && activePowerUp.type === "magnet") {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#c084fc";
      ctx.lineWidth = 2;
      [55, 75].forEach((r) => {
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, r + Math.sin(game.current.frame * 0.15) * 4, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(player.x + 25, GROUND_Y + 4, 28 * (2 - squash), 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height);
    ctx.scale(squash, 2 - squash);
    ctx.translate(-(player.x + player.width / 2), -(player.y + player.height));

    const grad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.height);
    grad.addColorStop(0, "#4ade80");
    grad.addColorStop(1, "#16a34a");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y + 12, player.width, player.height - 12, 15);
    ctx.fill();

    ctx.fillStyle = "#15803d";
    ctx.beginPath();
    ctx.ellipse(player.x + 34, player.y + 7, 20, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 30, 6, 0, Math.PI * 2);
    ctx.arc(player.x + 34, player.y + 30, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#064e3b";
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y + 30, 2.5, 0, Math.PI * 2);
    ctx.arc(player.x + 34, player.y + 30, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#064e3b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + 25, player.y + 34, 9, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  };

  const drawObstacle = (ctx, obstacle) => {
    if (obstacle.type === "factory") {
      ctx.fillStyle = "#475569";
      ctx.fillRect(obstacle.x, obstacle.y + 20, obstacle.width, obstacle.height - 20);
      ctx.fillStyle = "#334155";
      ctx.fillRect(obstacle.x + 12, obstacle.y - 10, 14, 35);
      ctx.fillStyle = "rgba(100,116,139,0.6)";
      ctx.beginPath();
      ctx.arc(obstacle.x + 18, obstacle.y - 20, 10, 0, Math.PI * 2);
      ctx.arc(obstacle.x + 32, obstacle.y - 35, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(obstacle.x + 10, obstacle.y + 35, 10, 10);
      ctx.fillRect(obstacle.x + 30, obstacle.y + 35, 10, 10);
    }
    if (obstacle.type === "car") {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.roundRect(obstacle.x, obstacle.y + 15, obstacle.width, obstacle.height - 15, 8);
      ctx.fill();
      ctx.fillStyle = "#bae6fd";
      ctx.beginPath();
      ctx.moveTo(obstacle.x + 18, obstacle.y + 15);
      ctx.lineTo(obstacle.x + 35, obstacle.y + 15);
      ctx.lineTo(obstacle.x + 48, obstacle.y + 30);
      ctx.lineTo(obstacle.x + 18, obstacle.y + 30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(obstacle.x + 15, obstacle.y + obstacle.height, 8, 0, Math.PI * 2);
      ctx.arc(obstacle.x + obstacle.width - 15, obstacle.y + obstacle.height, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    if (obstacle.type === "waste") {
      ctx.fillStyle = "#64748b";
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.fillStyle = "#334155";
      ctx.fillRect(obstacle.x - 5, obstacle.y - 6, obstacle.width + 10, 7);
      ctx.fillStyle = "#22c55e";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("\u267B", obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2 + 8);
    }
  };

  const drawCollectible = (ctx, item) => {
    const bob = Math.sin((game.current.frame + item.x) * 0.08) * 4;
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    const icons = { tree: "\uD83C\uDF33", water: "\uD83D\uDCA7", solar: "\u2600\uFE0F", recycle: "\u267B\uFE0F" };
    ctx.save();
    ctx.shadowColor = "rgba(250,204,21,0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText(icons[item.type], item.x, item.y + bob);
    ctx.restore();
  };

  const drawPowerUp = (ctx, item) => {
    const bob = Math.sin((game.current.frame + item.x) * 0.1) * 6;
    ctx.save();
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(192,132,252,0.75)";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(item.x, item.y + bob, 22, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(192,132,252,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillText(POWERUP_TYPES[item.type].icon, item.x, item.y + bob + 10);
    ctx.restore();
  };

  const drawParticles = (ctx) => {
    game.current.particles.forEach((p) => {
      ctx.fillStyle = `rgba(${p.color},${p.life / 32})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // -----------------------------
  // GAME LOOP
  // -----------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = GAME_WIDTH * dpr;
    canvas.height = GAME_HEIGHT * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const loop = () => {
      const g = game.current;
      drawBackground(ctx, g.level);

      if (g.running && !g.paused) {
        g.frame++;

        const speedMult = g.activePowerUp && g.activePowerUp.type === "slowmo" ? 0.5 : 1;
        const effSpeed = g.speed * speedMult;

        g.player.velocityY += 0.75;
        g.player.y += g.player.velocityY;
        if (g.player.squash < 1) g.player.squash = Math.min(1, g.player.squash + 0.06);
        if (g.player.squash > 1) g.player.squash = Math.max(1, g.player.squash - 0.04);

        if (g.player.y >= GROUND_Y - g.player.height) {
          g.player.y = GROUND_Y - g.player.height;
          if (g.player.jumping) g.player.squash = 0.78;
          g.player.velocityY = 0;
          g.player.jumping = false;
          g.player.jumpsUsed = 0;
        }

        if (g.frame % 3 === 0 && !g.player.jumping) {
          g.trail.push({ x: g.player.x + 5, y: GROUND_Y - 2, life: 20 });
        }
        g.trail = g.trail.filter((t) => { t.life -= 1.4; return t.life > 0; });

        g.clouds.forEach((cloud) => {
          cloud.x -= 0.3;
          if (cloud.x < -150) cloud.x = GAME_WIDTH + 100;
        });

        if (g.activePowerUp) {
          g.activePowerUp.timeLeft -= 1;
          if (g.activePowerUp.timeLeft <= 0) {
            g.activePowerUp = null;
            setActivePowerUp(null);
          } else {
            setActivePowerUp({
              type: g.activePowerUp.type,
              pct: g.activePowerUp.timeLeft / g.activePowerUp.duration,
            });
          }
        }

        g.framesSinceCollect++;
        if (g.framesSinceCollect > COMBO_DECAY_FRAMES && g.streak > 0) {
          g.streak = 0;
          setStreak(0);
        }
        setComboPct(Math.max(0, 1 - g.framesSinceCollect / COMBO_DECAY_FRAMES));

        g.obstacleTimer--;
        if (g.obstacleTimer <= 0) {
          const types = ["factory", "car", "waste"];
          const type = types[Math.floor(Math.random() * types.length)];
          let width = 55, height = 65;
          if (type === "factory") { width = 65; height = 75; }
          if (type === "car") { width = 80; height = 45; }
          g.obstacles.push({ x: GAME_WIDTH + 50, y: GROUND_Y - height, width, height, type });
          g.obstacleTimer = Math.max(40, (100 + Math.random() * 100 - g.level * 4) * g.diff.obstacleMult);
        }

        g.collectibleTimer--;
        if (g.collectibleTimer <= 0) {
          const types = ["tree", "water", "solar", "recycle"];
          const type = types[Math.floor(Math.random() * types.length)];
          g.collectibles.push({ x: GAME_WIDTH + 50, y: 250 + Math.random() * 80, width: 35, height: 35, type });
          g.collectibleTimer = 80 + Math.random() * 100;
        }

        g.powerUpTimer--;
        if (g.powerUpTimer <= 0) {
          const types = Object.keys(POWERUP_TYPES);
          const type = types[Math.floor(Math.random() * types.length)];
          g.powerUps.push({ x: GAME_WIDTH + 50, y: 220 + Math.random() * 100, width: 40, height: 40, type });
          g.powerUpTimer = 700 + Math.random() * 300;
        }

        g.obstacles.forEach((o) => (o.x -= effSpeed));
        g.collectibles.forEach((c) => (c.x -= effSpeed));
        g.powerUps.forEach((p) => (p.x -= effSpeed));

        if (g.activePowerUp && g.activePowerUp.type === "magnet") {
          const px = g.player.x + g.player.width / 2;
          const py = g.player.y + g.player.height / 2;
          g.collectibles.forEach((c) => {
            const dx = px - c.x, dy = py - c.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 220) {
              c.x += dx * 0.06;
              c.y += dy * 0.06;
            }
          });
        }

        for (const obstacle of g.obstacles) {
          if (collision(g.player, obstacle)) {
            if (g.activePowerUp && g.activePowerUp.type === "shield") {
              g.obstacles = g.obstacles.filter((o) => o !== obstacle);
              createParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, "96,165,250", 16);
              sfxShieldBlock();
              vibrate(20);
              g.activePowerUp = null;
              setActivePowerUp(null);
            } else {
              endGame();
            }
            break;
          }
        }

        g.collectibles = g.collectibles.filter((item) => {
          if (collision(g.player, item)) {
            g.streak += 1;
            g.framesSinceCollect = 0;
            const bonus = 40 + Math.min(g.streak, 10) * 8;
            g.score += bonus;
            g.itemsCollected += 1;
            createParticles(item.x, item.y, "250,204,21");
            sfxCollect();
            vibrate(12);
            setStreak(g.streak);
            return false;
          }
          return item.x > -100;
        });

        g.powerUps = g.powerUps.filter((item) => {
          if (collision(g.player, { x: item.x - 20, y: item.y - 20, width: item.width, height: item.height })) {
            const cfg = POWERUP_TYPES[item.type];
            g.activePowerUp = { type: item.type, timeLeft: cfg.duration, duration: cfg.duration };
            g.powerupsCollected += 1;
            createParticles(item.x, item.y, "192,132,252", 16);
            sfxPowerUp();
            vibrate([10, 30, 10]);
            setActivePowerUp({ type: item.type, pct: 1 });
            return false;
          }
          return item.x > -100;
        });

        g.obstacles = g.obstacles.filter((o) => o.x > -100);

        g.score += 0.1 * speedMult;
        setScore(Math.floor(g.score));

        const distance = Math.floor(g.frame / 10);
        if (distance >= g.nextMilestone) {
          g.score += 100;
          sfxMilestone();
          setMilestoneFlash(g.nextMilestone);
          setTimeout(() => setMilestoneFlash(null), 1400);
          g.nextMilestone += MILESTONE_STEP;
        }

        const newLevel = Math.floor(g.frame / 600) + 1;
        if (newLevel !== g.level) {
          g.level = newLevel;
          g.speed += 0.5;
          sfxLevel();
          setLevel(newLevel);
          setLevelFlash(true);
          setTimeout(() => setLevelFlash(false), 1400);
        }

        g.particles = g.particles.filter((p) => {
          p.x += p.vx; p.y += p.vy; p.life--;
          return p.life > 0;
        });
      }

      drawTrail(ctx);
      g.obstacles.forEach((o) => drawObstacle(ctx, o));
      g.collectibles.forEach((c) => drawCollectible(ctx, c));
      g.powerUps.forEach((p) => drawPowerUp(ctx, p));
      drawParticles(ctx);
      drawPlayer(ctx, g.player, g.activePowerUp);

      animationRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationRef.current);
  }, []);

  const endGame = () => {
    const g = game.current;
    const finalScore = Math.floor(g.score);
    g.running = false;
    setScore(finalScore);
    setSummary({
      items: g.itemsCollected,
      distance: Math.floor(g.frame / 10),
      best: Math.max(finalScore, highScore),
      powerups: g.powerupsCollected,
    });
    setGameOver(true);
    setStreak(0);
    setComboPct(0);
    setActivePowerUp(null);
    sfxHit();
    vibrate([40, 30, 40]);
    setShake(true);
    setTimeout(() => setShake(false), 400);

    if (finalScore > highScore) {
      localStorage.setItem("carbonTrackEcoHighScore", finalScore);
      setHighScore(finalScore);
    }
  };

  const toggleFullscreen = () => {
    const el = canvasWrapRef.current;
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (!started || gameOver) startGame();
        else jump();
      }
      if (event.code === "KeyP" && started && !gameOver) {
        setPaused((prev) => {
          const value = !prev;
          game.current.paused = value;
          return value;
        });
      }
      if (event.code === "KeyM") setMuted((m) => !m);
      if (event.code === "KeyF") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  return (
    <div className="ct-page">
      <div className="ct-root ct-container">
        {/* HEADER */}
        <div className="ct-header-row">
          <div>
            <div className="ct-brand-row">
              <div className="ct-brand-mark">CT</div>
              <span className="ct-display ct-brand-name">CarbonTrack</span>
            </div>
            <h1 className="ct-title ct-display">Eco Runner</h1>
            <p className="ct-tagline">
              No connection needed — keep your streak alive while we reconnect.
            </p>
          </div>

          <div className="ct-header-right">
            <div className="ct-status-pill">
              <span className="ct-status-dot" />
              Offline mode
            </div>
            <button className="ct-icon-btn" onClick={() => setMuted((m) => !m)} aria-label="Toggle sound" title={muted ? "Unmute (M)" : "Mute (M)"}>
              {muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
            </button>
            <button className="ct-icon-btn" onClick={toggleFullscreen} aria-label="Toggle fullscreen" title="Fullscreen (F)">
              {isFullscreen ? "\u2715" : "\u26F6"}
            </button>
          </div>
        </div>

        {/* HUD */}
        <div className="ct-hud">
          <HudChip icon="🌱" label="ECO SCORE" value={score.toLocaleString()} accent="#4ade80" />
          <HudChip icon="🏆" label="BEST" value={highScore.toLocaleString()} accent="#facc15" />
          <HudChip icon="🔥" label="POINTS" value={`x${streak}`} accent="#fb923c" comboPct={comboPct} />
          <HudChip icon="📶" label="LEVEL" value={level} accent="#60a5fa" hideMd />
          <HudChip
            icon={activePowerUp ? POWERUP_TYPES[activePowerUp.type].icon : "\u2728"}
            label={activePowerUp ? POWERUP_TYPES[activePowerUp.type].label.toUpperCase() : "POWER-UP"}
            value={activePowerUp ? `${Math.ceil(activePowerUp.pct * (POWERUP_TYPES[activePowerUp.type].duration / 60))}s` : "—"}
            accent="#c084fc"
            hideMd
          />
        </div>

        {/* GAME FRAME */}
        <div className={`ct-frame ${shake ? "shake" : ""}`}>
          <div className="ct-canvas-wrap" ref={canvasWrapRef}>
            <canvas
              ref={canvasRef}
              style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
              onClick={() => {
                if (!started || gameOver) startGame();
                else jump();
              }}
            />

            {activePowerUp && (
              <div className="ct-powerup-badge">
                <span>{POWERUP_TYPES[activePowerUp.type].icon}</span>
                <span>{POWERUP_TYPES[activePowerUp.type].label}</span>
              </div>
            )}

            {levelFlash && (
              <div className="ct-level-toast">
                <div className="ct-toast-inner">
                  <span className="ct-display">LEVEL {level}</span>
                  <small>Terrain speed up · new sky</small>
                </div>
              </div>
            )}

            {milestoneFlash !== null && (
              <div className="ct-milestone-toast">
                <div className="ct-toast-inner">
                  <span className="ct-display">🎉 {milestoneFlash}m milestone!</span>
                  <small>+100 bonus eco points</small>
                </div>
              </div>
            )}

            {!started && (
              <div className="ct-overlay">
                <div className="ct-overlay-card">
                  <div className="ct-overlay-icon">🌍</div>
                  <h2 className="ct-display ct-overlay-title">Ready to go green?</h2>
                  <p className="ct-overlay-text">
                    Jump (double-jump too!) over pollution, collect resources, and grab power-ups for shields, magnets, and slow-mo.
                  </p>

                  <div className="ct-difficulty-row">
                    {Object.entries(DIFFICULTIES).map(([key, d]) => (
                      <button
                        key={key}
                        className={`ct-diff-btn ${difficulty === key ? "active" : ""}`}
                        onClick={() => setDifficulty(key)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <button className="ct-primary-btn" onClick={startGame}>
                    ▶ Start Eco Run
                  </button>
                  <small className="ct-overlay-hint">Space / ↑ / Tap to jump (again mid-air to double-jump) &nbsp;·&nbsp; P pause · M mute · F fullscreen</small>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="ct-overlay">
                <div className="ct-overlay-card">
                  <div className="ct-overlay-icon">{score >= highScore ? "🏆" : "🌱"}</div>
                  <h2 className="ct-display ct-overlay-title">
                    {score >= highScore ? "New high score!" : "Run complete"}
                  </h2>
                  <div className="ct-mono ct-final-score">{score.toLocaleString()}</div>

                  <div className="ct-summary-row">
                    <SummaryStat label="Items" value={summary.items} />
                    <SummaryStat label="Power-ups" value={summary.powerups} />
                    <SummaryStat label="Distance" value={`${summary.distance}m`} />
                    <SummaryStat label="Best" value={summary.best.toLocaleString()} />
                  </div>

                  <button className="ct-primary-btn" onClick={startGame}>
                    🔄 Play again
                  </button>
                </div>
              </div>
            )}

            {paused && started && !gameOver && (
              <div className="ct-pause-overlay">
                <h2 className="ct-display" style={{ margin: 0, fontSize: 34 }}>⏸ Paused</h2>
                <p style={{ opacity: 0.75, marginTop: 6 }}>Press P to continue</p>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE JUMP */}
        {started && !gameOver && (
          <button
            className="ct-jump-btn"
            onTouchStart={(e) => { e.preventDefault(); jump(); }}
            onClick={jump}
          >
            ↑ JUMP
          </button>
        )}

        {/* CONTROLS */}
        <div className="ct-controls-row">
          <ControlHint keyLabel="SPACE / ↑" desc="Jump ×2" />
          <ControlHint keyLabel="P" desc="Pause" />
          <ControlHint keyLabel="M" desc="Mute" />
          <ControlHint keyLabel="F" desc="Fullscreen" />
          <ControlHint keyLabel="TAP" desc="Mobile jump" />
        </div>

        {/* FOOTER */}
        <div className="ct-footer">
          <span>🌍 CarbonTrack Eco Runner</span>
          <span>High score saved locally on this device.</span>
        </div>
      </div>
    </div>
  );
}

function HudChip({ icon, label, value, accent, hideMd, comboPct }) {
  return (
    <div className={`ct-hud-chip ${hideMd ? "hide-md" : ""}`}>
      <span className="ct-hud-icon" style={{ background: `${accent}22`, color: accent }}>{icon}</span>
      <div className="ct-chip-text">
        <small className="ct-chip-label">{label}</small>
        <strong className="ct-mono ct-chip-value" style={{ color: accent }}>{value}</strong>
        {typeof comboPct === "number" && (
          <div className="ct-combo-track">
            <div className="ct-combo-fill" style={{ width: `${comboPct * 100}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }) {
  return (
    <div className="ct-summary-stat">
      <div className="ct-mono ct-summary-value">{value}</div>
      <div className="ct-summary-label">{label}</div>
    </div>
  );
}

function ControlHint({ keyLabel, desc }) {
  return (
    <div className="ct-control-hint">
      <span className="ct-control-key">{keyLabel}</span>
      {desc}
    </div>
  );
}