import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Download, Mail, Check, Copy, X, Award, Sparkles, ShieldCheck } from "lucide-react";
import { generateClientCertificatePDF } from "../utils/generateCertificatePDF";
import "../styles/CertificateModal.css";

const TIER_META = {
  Platinum: {
    theme: "platinum",
    name: "Platinum",
    emoji: "💎",
    stars: 5,
    tagline: "Extraordinary impact — you are actively healing the biosphere.",
    accent: "#8ECAE6",
    gradient: "linear-gradient(135deg, #050B14 0%, #0D223A 50%, #050B14 100%)",
    glow: "rgba(142, 202, 230, 0.4)",
  },
  Gold: {
    theme: "gold",
    name: "Gold",
    emoji: "🥇",
    stars: 4,
    tagline: "Outstanding achievement — you are a verified climate champion.",
    accent: "#D4A853",
    gradient: "linear-gradient(135deg, #0B2818 0%, #1D4A2B 50%, #0B2818 100%)",
    glow: "rgba(212, 168, 83, 0.4)",
  },
  Silver: {
    theme: "silver",
    name: "Silver",
    emoji: "🥈",
    stars: 3,
    tagline: "Impressive progress — sustainability is becoming your nature.",
    accent: "#C0C0C8",
    gradient: "linear-gradient(135deg, #0D0D14 0%, #20202F 50%, #0D0D14 100%)",
    glow: "rgba(192, 192, 200, 0.35)",
  },
  Bronze: {
    theme: "bronze",
    name: "Bronze",
    emoji: "🥉",
    stars: 2,
    tagline: "Every step counts — your sustainability journey has begun.",
    accent: "#CD7F32",
    gradient: "linear-gradient(135deg, #1A0F00 0%, #3D2200 50%, #1A0F00 100%)",
    glow: "rgba(205, 127, 50, 0.4)",
  },
  Seedling: {
    theme: "seedling",
    name: "Seedling",
    emoji: "🌱",
    stars: 1,
    tagline: "Every journey begins with a single seed — keep growing.",
    accent: "#4ADE80",
    gradient: "linear-gradient(135deg, #06140B 0%, #133D20 50%, #06140B 100%)",
    glow: "rgba(74, 222, 128, 0.4)",
  },
};

export default function CertificateModal({ certData, onClose }) {
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  const tierName = certData?.tier || "Gold";
  const meta = TIER_META[tierName] || TIER_META.Gold;
  const userName = certData?.name || "Environmental Champion";
  const reduction = certData?.reduction ?? 20;
  const carbonSaved = certData?.carbonSaved ?? "12.50";
  const currentTotal = certData?.currentTotal ?? "42.00";
  const previousTotal = certData?.previousTotal ?? "55.00";
  const monthName = certData?.monthName || new Date().toLocaleString("default", { month: "long" });
  const year = certData?.year || new Date().getFullYear();
  const certId = certData?.certId || `CT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleDownload = () => {
    if (certData?.pdfBase64) {
      // Direct base64 download from server
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${certData.pdfBase64}`;
      link.download = `VASUDHA_${tierName}_Certificate_${monthName}_${year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Client jsPDF generator fallback
      generateClientCertificatePDF({
        name: userName,
        tier: tierName,
        reduction,
        carbonSaved,
        currentTotal,
        previousTotal,
        monthName,
        year,
      });
    }
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(certId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="god-cert-overlay" role="dialog" aria-modal="true">
      <Confetti
        width={dimensions.width}
        height={dimensions.height}
        recycle={false}
        numberOfPieces={220}
        gravity={0.16}
        colors={[meta.accent, "#ffffff", "#4ADE80", "#38BDF8", "#F5D78E"]}
      />

      <div className={`god-cert-container theme-${meta.theme}`}>
        {/* Glow halo */}
        <div className="cert-ambient-glow" style={{ "--glow-color": meta.glow }} />

        {/* Close Button */}
        <button className="cert-close-btn" onClick={onClose} aria-label="Close Certificate">
          <X size={20} />
        </button>

        {/* Certificate Scroll Canvas / Paper */}
        <div className="cert-scroll-wrap">
          <div className="cert-card">
            {/* Holographic corner flourishes */}
            <div className="cert-corner corner-tl" />
            <div className="cert-corner corner-tr" />
            <div className="cert-corner corner-bl" />
            <div className="cert-corner corner-br" />

            {/* Inner Guilloche Border */}
            <div className="cert-inner-frame">
              {/* Header section */}
              <div className="cert-header">
                <div className="cert-brand-badge">
                  <div className="cert-emblem">🌿</div>
                  <div className="cert-brand-title">VASUDHA</div>
                  <div className="cert-brand-sub">GLOBAL CLIMATE ACTION SANCTUARY</div>
                </div>

                <div className="cert-tier-pill">
                  <span className="cert-tier-icon">{meta.emoji}</span>
                  <span className="cert-tier-text">{meta.name.toUpperCase()} TIER HONORS</span>
                  <span className="cert-tier-icon">{meta.emoji}</span>
                </div>
              </div>

              {/* Title Section */}
              <div className="cert-title-section">
                <h1 className="cert-main-title">Certificate of Sustainability</h1>
                <p className="cert-conferred-text">
                  This official credential is authenticated and presented with distinction to
                </p>
                <div className="cert-recipient-name">
                  <span className="name-text">{userName}</span>
                  <div className="name-underline" />
                </div>
              </div>

              {/* Tagline citation */}
              <p className="cert-tagline">“{meta.tagline}”</p>

              {/* Citation Body */}
              <p className="cert-description">
                For verified ecological responsibility and measurable greenhouse gas reduction during{" "}
                <strong>{monthName} {year}</strong>, contributing to our collective planetary healing through
                conscious lifestyle choices.
              </p>

              {/* Metrics Grid */}
              <div className="cert-stats-grid">
                <div className="cert-stat-box">
                  <span className="stat-label">Previous Footprint</span>
                  <span className="stat-val">{previousTotal}</span>
                  <span className="stat-unit">kg CO₂</span>
                </div>

                <div className="cert-stat-box highlight">
                  <span className="stat-label">Verified Reduction</span>
                  <span className="stat-val">{carbonSaved}</span>
                  <span className="stat-unit">kg CO₂ saved</span>
                  <div className="stat-badge">-{reduction}%</div>
                </div>

                <div className="cert-stat-box">
                  <span className="stat-label">Current Footprint</span>
                  <span className="stat-val">{currentTotal}</span>
                  <span className="stat-unit">kg CO₂</span>
                </div>
              </div>

              {/* Stars sequence */}
              <div className="cert-stars-row">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`cert-star ${i < meta.stars ? "active" : "inactive"}`}
                    style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Certificate Footer */}
              <div className="cert-footer">
                <div className="footer-col left">
                  <span className="f-title">DATE OF CONFERRAL</span>
                  <span className="f-val">
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="f-sub">VASUDHA REGISTRY</span>
                </div>

                <div className="footer-col center">
                  <div className="cert-seal">
                    <ShieldCheck size={28} className="seal-icon" />
                    <span className="seal-text">VERIFIED</span>
                  </div>
                  <div className="cert-id-badge" onClick={handleCopyId} title="Click to copy Verification ID">
                    <code>ID: {certId}</code>
                    <span className="copy-hint">{copied ? "Copied!" : "Copy"}</span>
                  </div>
                </div>

                <div className="footer-col right">
                  <span className="f-title">AUTHORIZED BY</span>
                  <span className="f-sig">Ketan Kumar Jha</span>
                  <span className="f-sub">Founder, VASUDHA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="cert-actions-bar">
          <button className="cert-action-btn primary" onClick={handleDownload}>
            <Download size={18} />
            <span>Download PDF Certificate</span>
          </button>

          <div className="cert-status-pill">
            <Mail size={16} />
            <span>{certData?.emailSent ? "Mailed to your inbox" : "Ready for download"}</span>
          </div>

          <button className="cert-action-btn secondary" onClick={handleCopyId}>
            {copied ? <Check size={18} color="#4ADE80" /> : <Copy size={18} />}
            <span>{copied ? "ID Copied" : "Copy ID"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
