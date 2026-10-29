# 🌿 Vasudha Frontend Client (React 19 + Vite 7)

This directory houses the client application for **Vasudha (वसुधा • ವಸುಧಾ)** — an environmental intelligence, carbon footprint auditing, and real-time IoT platform.

---

## 🚀 Key Frontend Features

- **React 19 & Vite 7**: Ultra-fast build times, Concurrent Rendering, and modern hook primitives.
- **Multi-Vector Carbon Calculator**: Interactive dynamic SVG radial gauges, cubic-bezier count-up animations, and real-time open-source API integrations.
- **Real-Time IoT Telemetry**: Direct Firebase Realtime Database websocket listener subscribing to live smart electricity meter readings (`electricity/{uid}/units`).
- **Atmospheric Intelligence**: Open-Meteo Air Quality & Geocoding APIs with debounced search query cancellation via `AbortController`.
- **Vasudha AI Assistant**: Embedded compact chat widget powered by Groq LLM inference enriched with live environmental conditions.
- **Fail-Safe Offline Eco Runner**: HTML5 Canvas 2D + Web Audio API 60 FPS infinite runner activating automatically during offline network interruptions.
- **Client-Side Document Synthesis**: High-resolution ESG certificate rendering and instant 80G tax donation invoice generation powered by `jspdf`.
- **Living Grove Tree Donation**: Dynamic SVG tree planting visualization with wandering firefly particles and Razorpay checkout modal.

---

## 🛠️ Scripts

```bash
# Start Vite development server (localhost:5173)
npm run dev

# Compile production bundle to /dist
npm run build

# Preview production build locally
npm run preview

# Run ESLint validation
npm run lint
```

---

## 🔗 Root Documentation

For complete system architecture, IoT hardware wiring schematics, backend REST API specifications, and environment setup, refer to the master [Project README](../README.md).
