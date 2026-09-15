const getEnvironmentData = async (latitude, longitude) => {
    try {
        const airQualityUrl =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
            `&forecast_hours=1` +
            `&timezone=auto`;

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility,uv_index` +
            `&timezone=auto`;

        // Fetch both APIs independently.
        const [airResponse, weatherResponse] = await Promise.allSettled([
            fetch(airQualityUrl),
            fetch(weatherUrl)
        ]);

        // -----------------------------
        // AIR QUALITY DATA
        // -----------------------------

        let aqi = null;
        let pm25 = null;
        let pm10 = null;
        let carbonMonoxide = null;
        let nitrogenDioxide = null;
        let sulphurDioxide = null;
        let ozone = null;

        if (
            airResponse.status === "fulfilled" &&
            airResponse.value.ok
        ) {
            const airData = await airResponse.value.json();

            const airHourly = airData?.hourly;

            aqi = airHourly?.us_aqi?.[0] ?? null;
            pm25 = airHourly?.pm2_5?.[0] ?? null;
            pm10 = airHourly?.pm10?.[0] ?? null;

            carbonMonoxide =
                airHourly?.carbon_monoxide?.[0] ?? null;

            nitrogenDioxide =
                airHourly?.nitrogen_dioxide?.[0] ?? null;

            sulphurDioxide =
                airHourly?.sulphur_dioxide?.[0] ?? null;

            ozone =
                airHourly?.ozone?.[0] ?? null;
        } else {
            console.error(
                "Air quality request failed:",
                airResponse.reason ||
                airResponse.value?.status
            );
        }

        // -----------------------------
        // WEATHER DATA
        // -----------------------------

        let weather = {
            temperature: null,
            humidity: null,
            apparentTemperature: null,
            pressure: null,
            windSpeed: null,
            windDirection: null,
            cloudCover: null,
            visibility: null,
            uvIndex: null
        };

        if (
            weatherResponse.status === "fulfilled" &&
            weatherResponse.value.ok
        ) {
            const weatherData =
                await weatherResponse.value.json();

            const current = weatherData?.current;

            weather = {
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
                    current?.uv_index ?? null
            };
        } else {
            console.error(
                "Weather request failed:",
                weatherResponse.reason ||
                weatherResponse.value?.status
            );
        }

        // -----------------------------
        // AQI STATUS
        // -----------------------------

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

        // Do NOT crash the chatbot if environmental APIs fail.
        return {
            aqi: null,
            aqiStatus: "AQI Unavailable",

            pollutants: {
                pm25: null,
                pm10: null,
                carbonMonoxide: null,
                nitrogenDioxide: null,
                sulphurDioxide: null,
                ozone: null
            },

            weather: {
                temperature: null,
                humidity: null,
                apparentTemperature: null,
                pressure: null,
                windSpeed: null,
                windDirection: null,
                cloudCover: null,
                visibility: null,
                uvIndex: null
            },

            latitude,
            longitude,

            updatedAt: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };
    }
};

export { getEnvironmentData };