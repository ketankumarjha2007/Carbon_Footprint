import "../styles/Home.css";
import { Link } from "react-router-dom";

function Home(){
  return(
    <div className="home-page">
      <section className="hero-section">

        <div className="hero-left">
          <h1>Build a Greener Future </h1>

          <p>
            CarbonTrack helps you measure, understand, and reduce
            your carbon footprint. Start tracking your environmental
            impact and take meaningful steps toward a sustainable world.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-btn">Start Tracking</Link>
            <Link to="/about" className="secondary-btn">Learn More</Link>
          </div>
        </div>


        <div className="hero-right">
          <img
            src="https://img.freepik.com/free-vector/ecology-concept-illustration_114360-920.jpg"
            alt="eco"
          />
        </div>

      </section>

      <section className="features-section">

        <div className="feature-box">
          <h3>Carbon Calculator</h3>
          <p>
            Estimate your carbon footprint based on daily
            lifestyle activities like travel, electricity,
            and consumption habits.
          </p>
        </div>

        <div className="feature-box">
          <h3>Track Progress</h3>
          <p>
            Monitor your emissions over time and understand
            how small lifestyle changes reduce your
            environmental impact.
          </p>
        </div>

        <div className="feature-box">
          <h3>Contribute to Nature</h3>
          <p>
            Support tree planting initiatives and contribute
            toward building a greener and healthier planet.
          </p>
        </div>

      </section>

    </div>
  )
}

export default Home