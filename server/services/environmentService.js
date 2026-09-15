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
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover` +
            `&hourly=visibility,uv_index` +
            `&forecast_hours=1` +
            `&timezone=auto`;

        // =========================================================
        // FETCH BOTH APIs
        // =========================================================

        const [airResponse, weatherResponse] = await Promise.all([
            fetch(airQualityUrl),
            fetch(weatherUrl)
        ]);

        // =========================================================
        // CHECK RESPONSES
        // =========================================================

        if (!airResponse.ok) {
            const errorText = await airResponse.text();

            console.error(
                "Air Quality API Error:",
                airResponse.status,
                errorText
            );

            throw new Error("Air quality request failed");
        }

        if (!weatherResponse.ok) {
            const errorText = await weatherResponse.text();

            console.error(
                "Weather API Error:",
                weatherResponse.status,
                errorText
            );

            throw new Error("Weather request failed");
        }

        // =========================================================
        // PARSE DATA
        // =========================================================

        const airData = await airResponse.json();
        const weatherData = await weatherResponse.json();

        // =========================================================
        // AIR QUALITY DATA
        // =========================================================

        const airHourly = airData?.hourly;

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

        // =========================================================
        // CURRENT WEATHER
        // =========================================================

        const current =
            weatherData?.current;

        // =========================================================
        // HOURLY WEATHER
        // =========================================================

        const hourly =
            weatherData?.hourly;

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
                hourly?.visibility?.[0] ?? null,

            uvIndex:
                hourly?.uv_index?.[0] ?? null
        };

        // =========================================================
        // DEBUG LOG
        // =========================================================

        console.log("Chatbot Environment Data:", {
            aqi,
            weather
        });

        // =========================================================
        // RETURN SAME STRUCTURE USED BY CHATBOT
        // =========================================================

        return {
            aqi,

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

            updatedAt:
                new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                })
        };

    } catch (error) {
        console.error(
            "Environment Service Error:",
            error.message
        );

        throw error;
    }
};

export { getEnvironmentData };