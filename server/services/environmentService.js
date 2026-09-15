const getEnvironmentData = async (latitude, longitude) => {
    try {
        // Open-Meteo Air Quality API
        const airQualityUrl =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
            `&forecast_hours=1` +
            `&timezone=auto`;

        // Open-Meteo Weather API
        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility,uv_index` +
            `&timezone=auto`;

        const [airResponse, weatherResponse] = await Promise.all([
            fetch(airQualityUrl),
            fetch(weatherUrl)
        ]);

        if (!airResponse.ok) {
            throw new Error("Air quality request failed");
        }

        if (!weatherResponse.ok) {
            throw new Error("Weather request failed");
        }

        const airData = await airResponse.json();
        const weatherData = await weatherResponse.json();

        const airHourly = airData?.hourly;

        const aqi = airHourly?.us_aqi?.[0] ?? null;
        const pm25 = airHourly?.pm2_5?.[0] ?? null;
        const pm10 = airHourly?.pm10?.[0] ?? null;
        const carbonMonoxide =
            airHourly?.carbon_monoxide?.[0] ?? null;
        const nitrogenDioxide =
            airHourly?.nitrogen_dioxide?.[0] ?? null;
        const sulphurDioxide =
            airHourly?.sulphur_dioxide?.[0] ?? null;
        const ozone = airHourly?.ozone?.[0] ?? null;

        const current = weatherData?.current;

        const weather = {
            temperature: current?.temperature_2m ?? null,
            humidity: current?.relative_humidity_2m ?? null,
            apparentTemperature:
                current?.apparent_temperature ?? null,
            pressure: current?.pressure_msl ?? null,
            windSpeed: current?.wind_speed_10m ?? null,
            windDirection:
                current?.wind_direction_10m ?? null,
            cloudCover:
                current?.cloud_cover ?? null,
            visibility:
                current?.visibility ?? null,
            uvIndex: current?.uv_index ?? null
        };

        // AQI status
        let aqiStatus = "AQI Unavailable";

        if (aqi !== null) {
            if (aqi <= 50) {
                aqiStatus = "Good Air Quality 😊";
            } else if (aqi <= 100) {
                aqiStatus = "Moderate Air Quality 😐";
            } else if (aqi <= 150) {
                aqiStatus =
                    "Unhealthy for Sensitive Groups 😷";
            } else if (aqi <= 200) {
                aqiStatus = "Unhealthy Air Quality 🚨";
            } else if (aqi <= 300) {
                aqiStatus = "Very Unhealthy Air 🚨";
            } else {
                aqiStatus = "Hazardous Air Quality ☠️";
            }
        }

        return {
            aqi,
            aqiStatus,

            pollutants: {
                pm25,
                pm10,
                carbonMonoxide,
                nitrogenDioxide,
                sulphurDioxide,
                ozone
            },

            weather,

            latitude,
            longitude,

            updatedAt: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

    } catch (error) {
        console.error(
            "Environment Service Error:",
            error
        );

        throw error;
    }
};

export { getEnvironmentData };