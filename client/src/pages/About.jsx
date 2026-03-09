import "../styles/About.css";

function About() {
  return (
    <div className="about-page">

      <section className="about-hero">
        <h1>About CarbonTrack </h1>
        <p>
          Empowering individuals to understand and reduce their carbon footprint
          for a cleaner and greener planet.
        </p>
      </section>

      <section className="about-cards">

        <div className="about-card">
          <h2> What is Carbon Footprint?</h2>
          <p>
            A carbon footprint measures the total greenhouse gases produced by
            human activities like transportation, electricity use, and food
            consumption. Understanding it helps us make better environmental
            choices.
          </p>
        </div>

        <div className="about-card">
          <h2>Why It Matters</h2>
          <p>
            Climate change is accelerating due to increasing carbon emissions.
            By tracking and reducing our footprint, we can slow global warming
            and protect ecosystems around the world.
          </p>
        </div>

        <div className="about-card">
          <h2> Our Mission</h2>
          <p>
            CarbonTrack aims to help people monitor their carbon emissions,
            learn sustainable habits, and contribute to a greener future through
            awareness and responsible choices.
          </p>
        </div>

      </section>

    </div>
  );
}

export default About;