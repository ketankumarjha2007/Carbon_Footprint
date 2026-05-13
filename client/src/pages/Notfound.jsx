import { Link } from "react-router-dom";
import "../styles/Notfound.css";
export default function NotFound() {
  return (
    <div className="notfound-page">

      {/* Animated Background */}
      <div className="gradient-bg"></div>

      <div className="floating floating1"></div>
      <div className="floating floating2"></div>
      <div className="floating floating3"></div>

      {/* Main Card */}
      <div className="notfound-card">

        <div className="logo-badge">
          CarbonTrack
        </div>

        <h1>404</h1>

        <h2>Page Not Found</h2>

        <p>
          Looks like this page drifted away from the CarbonTrack universe.
          Let’s get you back on track.
        </p>

        <div className="buttons">

          <Link to="/" className="primary-btn">
            Go Home
          </Link>

          <button
            className="secondary-btn"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>

        </div>

      </div>

    </div>
  );
}