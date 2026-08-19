import "../styles/Home.css";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videoFile from "../assets/video.mp4";

function Home() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);

  const [environment, setEnvironment] = useState(null);
  const [loadingEnvironment, setLoadingEnvironment] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");


  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    let animationFrame;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
    }));

    const animate = () => {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      particles.forEach((p, i) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) {
          p.dx *= -1;
        }

        if (p.y < 0 || p.y > canvas.height) {
          p.dy *= -1;
        }

        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          p.r,
          0,
          Math.PI * 2
        );

        ctx.fillStyle =
          "rgba(114,255,177,0.35)";

        ctx.fill();

        for (
          let j = i + 1;
          j < particles.length;
          j++
        ) {
          const p2 = particles[j];

          const dist = Math.hypot(
            p.x - p2.x,
            p.y - p2.y
          );

          if (dist < 120) {
            ctx.beginPath();

            ctx.moveTo(
              p.x,
              p.y
            );

            ctx.lineTo(
              p2.x,
              p2.y
            );

            ctx.strokeStyle =
              `rgba(114,255,177,${Math.max(
                0,
                0.08 - dist / 1500
              )})`;

            ctx.stroke();
          }
        }
      });

      animationFrame =
        requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener(
      "resize",
      setCanvasSize
    );

    return () => {
      cancelAnimationFrame(animationFrame);

      window.removeEventListener(
        "resize",
        setCanvasSize
      );
    };
  }, []);

  // =========================================================
  // CURSOR GLOW
  // =========================================================

  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.transform =
          `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`;
      }
    };

    window.addEventListener(
      "mousemove",
      move
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        move
      );
    };
  }, []);


  useEffect(() => {
    let cancelled = false;

    const fetchEnvironment = async (
      latitude,
      longitude
    ) => {
      try {
        /*
         * AIR QUALITY
         *
         * Open-Meteo supports these hourly variables:
         * us_aqi
         * pm2_5
         * pm10
         * carbon_monoxide
         * nitrogen_dioxide
         * sulphur_dioxide
         * ozone
         */

        const airQualityUrl =
          `https://air-quality-api.open-meteo.com/v1/air-quality` +
          `?latitude=${latitude}` +
          `&longitude=${longitude}` +
          `&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
          `&forecast_hours=1` +
          `&timezone=auto`;

        /*
         * WEATHER
         */

        const weatherUrl =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${latitude}` +
          `&longitude=${longitude}` +
          `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility,uv_index` +
          `&timezone=auto`;

        const [
          airResponse,
          weatherResponse,
        ] = await Promise.all([
          fetch(airQualityUrl),
          fetch(weatherUrl),
        ]);

        if (!airResponse.ok) {
          throw new Error(
            "Air quality request failed"
          );
        }

        if (!weatherResponse.ok) {
          throw new Error(
            "Weather request failed"
          );
        }

        const airData =
          await airResponse.json();

        const weatherData =
          await weatherResponse.json();

        if (cancelled) return;
        const airHourly =
          airData?.hourly;

        const aqi =
          airHourly?.us_aqi?.[0] ?? null;

        const pm25 =
          airHourly?.pm2_5?.[0] ?? null;

        const pm10 =
          airHourly?.pm10?.[0] ?? null;

        const carbonMonoxide =
          airHourly?.carbon_monoxide?.[0] ?? null;

        const nitrogenDioxide =
          airHourly?.nitrogen_dioxide?.[0] ?? null;

        const sulphurDioxide =
          airHourly?.sulphur_dioxide?.[0] ?? null;

        const ozone =
          airHourly?.ozone?.[0] ?? null;

        const current =
          weatherData?.current;

        const weather = {
          temperature:
            current?.temperature_2m ?? null,

          humidity:
            current?.relative_humidity_2m ?? null,

          apparentTemperature:
            current?.apparent_temperature ?? null,

          pressure:
            current?.pressure_msl ?? null,

          windSpeed:
            current?.wind_speed_10m ?? null,

          windDirection:
            current?.wind_direction_10m ?? null,

          cloudCover:
            current?.cloud_cover ?? null,

          visibility:
            current?.visibility ?? null,

          uvIndex:
            current?.uv_index ?? null,
        };

        // ---------------------------------------------------
        // AQI STATUS
        // ---------------------------------------------------

        let status = "AQI Unavailable";

        if (aqi !== null) {
          if (aqi <= 50) {
            status =
              "Good Air Quality 😊";
          } else if (aqi <= 100) {
            status =
              "Moderate Air Quality 😐";
          } else if (aqi <= 150) {
            status =
              "Unhealthy for Sensitive Groups 😷";
          } else if (aqi <= 200) {
            status =
              "Unhealthy Air Quality 🚨";
          } else if (aqi <= 300) {
            status =
              "Very Unhealthy Air 🚨";
          } else {
            status =
              "Hazardous Air Quality ☠️";
          }
        }

        setEnvironment({
          aqi,
          aqiStatus: status,

          pollutants: {
            pm25,
            pm10,
            carbonMonoxide,
            nitrogenDioxide,
            sulphurDioxide,
            ozone,
          },

          weather,

          latitude,
          longitude,

          updatedAt:
            new Date().toLocaleTimeString(
              [],
              {
                hour: "2-digit",
                minute: "2-digit",
              }
            ),
        });

        setLocationMessage(
          "Live data based on your location"
        );
      } catch (error) {
        console.error(
          "Environment Error:",
          error
        );

        if (!cancelled) {
          setLocationMessage(
            "Unable to load environmental data"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEnvironment(false);
        }
      }
    };

    if (!navigator.geolocation) {
      setLocationMessage(
        "Geolocation is not supported by your browser"
      );

      setLoadingEnvironment(false);

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        fetchEnvironment(
          latitude,
          longitude
        );
      },

      (error) => {
        console.error(
          "Location Error:",
          error
        );

        setLocationMessage(
          "Location permission denied"
        );

        setLoadingEnvironment(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);


  const formatValue = (
    value,
    decimals = 0
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return "--";
    }

    return Number(value).toFixed(
      decimals
    );
  };

  const getWindDirection = (degree) => {
    if (
      degree === null ||
      degree === undefined
    ) {
      return "--";
    }

    const directions = [
      "N",
      "NE",
      "E",
      "SE",
      "S",
      "SW",
      "W",
      "NW",
    ];

    const index =
      Math.round(degree / 45) % 8;

    return directions[index];
  };

  const getAqiClass = (aqi) => {
    if (aqi === null) return "";

    if (aqi <= 50) return "aqi-good";

    if (aqi <= 100)
      return "aqi-moderate";

    if (aqi <= 150)
      return "aqi-sensitive";

    if (aqi <= 200)
      return "aqi-unhealthy";

    return "aqi-danger";
  };

  return (
    <div className="home">

      <div className="gradient-bg"></div>

      <canvas
        ref={canvasRef}
        className="particles"
      ></canvas>

      <div
        ref={glowRef}
        className="cursor-glow"
      ></div>

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="hero">

        <div className="hero-content">

          <div className="top-badge">
            Carbon Karo Track — Welcome to CarbonTrack
          </div>

          <h1>
            Build A{" "}
            <span>Greener</span>
            <br />
            Future With Data
          </h1>

          <p>
            CarbonTrack delivers intelligent
            carbon analytics, live environmental
            monitoring, and sustainability
            insights through a real-time
            environmental intelligence system.
          </p>

          {/* =================================================
              ENVIRONMENT GRID
          ================================================= */}

          <div className="hero-grid">

            {/* =================================================
                MAIN AQI CARD
            ================================================= */}

            <div className="glass-card main-card">

              <div className="card-top">

                <span className="live-dot"></span>

                CURRENT ENVIRONMENT

              </div>

              {loadingEnvironment ? (

                <div className="environment-loading">

                  <div className="loading-spinner"></div>

                  <p>
                    Detecting your location...
                  </p>

                </div>

              ) : (

                <>

                  <h2>
                    {environment?.aqiStatus ||
                      "AQI Unavailable"}
                  </h2>

                  <div
                    className={`aqi-value ${getAqiClass(
                      environment?.aqi
                    )}`}
                  >

                    {environment?.aqi !== null &&
                    environment?.aqi !== undefined
                      ? Math.round(
                          environment.aqi
                        )
                      : "--"}

                    <span>
                      AQI
                    </span>

                  </div>

                  <p className="location-message">
                    📍{" "}
                    {locationMessage ||
                      "Location based monitoring"}
                  </p>

                  {/* QUICK WEATHER */}

                  <div className="quick-weather">

                    <div>
                      <span>🌡️</span>

                      <strong>
                        {formatValue(
                          environment?.weather
                            ?.temperature,
                          1
                        )}
                        °C
                      </strong>

                      <small>
                        Temperature
                      </small>
                    </div>

                    <div>
                      <span>💧</span>

                      <strong>
                        {formatValue(
                          environment?.weather
                            ?.humidity
                        )}
                        %
                      </strong>

                      <small>
                        Humidity
                      </small>
                    </div>

                    <div>
                      <span>💨</span>

                      <strong>
                        {formatValue(
                          environment?.weather
                            ?.windSpeed,
                          1
                        )}{" "}
                        km/h
                      </strong>

                      <small>
                        Wind
                      </small>
                    </div>

                  </div>

                </>

              )}

              {/* EXISTING STATS */}

              <div className="mini-stats">

                <div>
                  <h3>98%</h3>
                  <p>
                    Prediction Accuracy
                  </p>
                </div>

                <div>
                  <h3>24/7</h3>
                  <p>
                    Monitoring
                  </p>
                </div>

                <div>
                  <h3>AI</h3>
                  <p>
                    Smart Insights
                  </p>
                </div>

              </div>

            </div>

            {/* =================================================
                SIDE CARDS
            ================================================= */}

            <div className="side-cards">

              <div className="glass-card small-card">

                <h3>
                  Carbon Tracking
                </h3>

                <p>
                  Measure and reduce emissions
                  with precision.
                </p>

              </div>

              <div className="glass-card small-card">

                <h3>
                  Smart Recommendations
                </h3>

                <p>
                  AI-generated eco suggestions
                  for sustainable decisions.
                </p>

              </div>

            </div>

          </div>

          {/* =================================================
              POLLUTANTS
          ================================================= */}

          <section className="environment-section">

            <div className="section-heading">

              <div>
                <span>
                  AIR QUALITY
                </span>

                <h2>
                  What is in the air?
                </h2>
              </div>

              <p>
                Live pollutant concentrations
              </p>

            </div>

            <div className="environment-grid">

              {/* PM2.5 */}

              <div className="environment-card">

                <div className="environment-icon">
                  🌫️
                </div>

                <div>
                  <span>
                    PM2.5
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.pm25,
                      1
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

              {/* PM10 */}

              <div className="environment-card">

                <div className="environment-icon">
                  🫧
                </div>

                <div>
                  <span>
                    PM10
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.pm10,
                      1
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

              {/* CO */}

              <div className="environment-card">

                <div className="environment-icon">
                  🏭
                </div>

                <div>
                  <span>
                    CO
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.carbonMonoxide,
                      0
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

              {/* NO2 */}

              <div className="environment-card">

                <div className="environment-icon">
                  🧪
                </div>

                <div>
                  <span>
                    NO₂
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.nitrogenDioxide,
                      1
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

              {/* SO2 */}

              <div className="environment-card">

                <div className="environment-icon">
                  ⚗️
                </div>

                <div>
                  <span>
                    SO₂
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.sulphurDioxide,
                      1
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

              {/* O3 */}

              <div className="environment-card">

                <div className="environment-icon">
                  🟢
                </div>

                <div>
                  <span>
                    O₃
                  </span>

                  <strong>
                    {formatValue(
                      environment?.pollutants
                        ?.ozone,
                      1
                    )}
                  </strong>

                  <small>
                    μg/m³
                  </small>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              WEATHER
          ================================================= */}

          <section className="environment-section weather-section">

            <div className="section-heading">

              <div>
                <span>
                  WEATHER
                </span>

                <h2>
                  Current conditions
                </h2>
              </div>

              <p>
                Updated{" "}
                {environment?.updatedAt ||
                  "--"}
              </p>

            </div>

            <div className="weather-grid">

              {/* TEMPERATURE */}

              <div className="weather-card">

                <span className="weather-icon">
                  🌡️
                </span>

                <div>

                  <small>
                    Temperature
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.temperature,
                      1
                    )}
                    °C
                  </strong>

                </div>

              </div>

              {/* HUMIDITY */}

              <div className="weather-card">

                <span className="weather-icon">
                  💧
                </span>

                <div>

                  <small>
                    Humidity
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.humidity
                    )}
                    %
                  </strong>

                </div>

              </div>

              {/* PRESSURE */}

              <div className="weather-card">

                <span className="weather-icon">
                  🎈
                </span>

                <div>

                  <small>
                    Pressure
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.pressure,
                      0
                    )}{" "}
                    hPa
                  </strong>

                </div>

              </div>

              {/* WIND */}

              <div className="weather-card">

                <span className="weather-icon">
                  💨
                </span>

                <div>

                  <small>
                    Wind
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.windSpeed,
                      1
                    )}{" "}
                    km/h
                  </strong>

                  <em>
                    {
                      getWindDirection(
                        environment?.weather
                          ?.windDirection
                      )
                    }
                  </em>

                </div>

              </div>

              {/* UV */}

              <div className="weather-card">

                <span className="weather-icon">
                  ☀️
                </span>

                <div>

                  <small>
                    UV Index
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.uvIndex,
                      1
                    )}
                  </strong>

                </div>

              </div>

              {/* CLOUD */}

              <div className="weather-card">

                <span className="weather-icon">
                  ☁️
                </span>

                <div>

                  <small>
                    Cloud Cover
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.cloudCover
                    )}
                    %
                  </strong>

                </div>

              </div>

              {/* VISIBILITY */}

              <div className="weather-card">

                <span className="weather-icon">
                  👁️
                </span>

                <div>

                  <small>
                    Visibility
                  </small>

                  <strong>

                    {environment?.weather
                      ?.visibility !== null &&
                    environment?.weather
                      ?.visibility !== undefined
                      ? (
                          environment.weather
                            .visibility /
                          1000
                        ).toFixed(1)
                      : "--"}

                    {" "}
                    km

                  </strong>

                </div>

              </div>

              {/* FEELS LIKE */}

              <div className="weather-card">

                <span className="weather-icon">
                  🌤️
                </span>

                <div>

                  <small>
                    Feels Like
                  </small>

                  <strong>
                    {formatValue(
                      environment?.weather
                        ?.apparentTemperature,
                      1
                    )}
                    °C
                  </strong>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              CTA
          ================================================= */}

          <div className="cta">

            <Link
              to="/login"
              className="btn primary"
            >
              Launch Platform
            </Link>

            <Link
              to="/about"
              className="btn secondary"
            >
              Explore More
            </Link>

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section className="features">

        {[
          {
            title:
              "Real-Time Carbon Analytics",

            desc:
              "Track emissions instantly with advanced monitoring systems.",
          },

          {
            title:
              "Environmental Intelligence",

            desc:
              "Powerful AI insights designed for sustainable decisions.",
          },

          {
            title:
              "Smart AQI Monitoring",

            desc:
              "Live air quality data with pollutant and weather analysis.",
          },
        ].map((item, i) => (

          <div
            className="feature-card"
            key={i}
          >

            <div className="feature-inner">

              <div className="feature-line"></div>

              <h3>
                {item.title}
              </h3>

              <p>
                {item.desc}
              </p>

            </div>

          </div>

        ))}

      </section>

      {/* =====================================================
          VIDEO
      ====================================================== */}

      <section className="video-section">

        <div className="video-wrapper">

          <video
            autoPlay
            muted
            loop
            playsInline
          >

            <source
              src={videoFile}
              type="video/mp4"
            />

          </video>

        </div>

      </section>

    </div>
  );
}

export default Home;