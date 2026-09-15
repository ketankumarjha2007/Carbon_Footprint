const API_URL =
    "https://carbon-footprint-1-a5ae.onrender.com/api/chatbot";


const getUserLocation = () => {
    return new Promise((resolve) => {

        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {

                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });

            },

            (error) => {

                console.error(
                    "Chatbot Location Error:",
                    error
                );

                resolve(null);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    });
};


// =========================================================
// GET LIVE ENVIRONMENT DATA
// =========================================================

const getEnvironmentData = async (
    latitude,
    longitude
) => {

    try {

        // -----------------------------------------------------
        // AIR QUALITY
        // -----------------------------------------------------

        const airQualityUrl =
            `https://air-quality-api.open-meteo.com/v1/air-quality` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&hourly=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone` +
            `&forecast_hours=1` +
            `&timezone=auto`;


        // -----------------------------------------------------
        // WEATHER
        // -----------------------------------------------------

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${latitude}` +
            `&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,cloud_cover,visibility` +
            `&hourly=uv_index` +
            `&forecast_hours=1` +
            `&timezone=auto`;


        // -----------------------------------------------------
        // FETCH
        // -----------------------------------------------------

        const [
            airResponse,
            weatherResponse
        ] = await Promise.all([
            fetch(airQualityUrl),
            fetch(weatherUrl)
        ]);


        // -----------------------------------------------------
        // PARSE
        // -----------------------------------------------------

        const airData =
            airResponse.ok
                ? await airResponse.json()
                : null;

        const weatherData =
            weatherResponse.ok
                ? await weatherResponse.json()
                : null;


        // -----------------------------------------------------
        // AIR DATA
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // WEATHER DATA
        // -----------------------------------------------------

        const current =
            weatherData?.current;

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
                current?.visibility ?? null,

            uvIndex:
                hourly?.uv_index?.[0] ?? null
        };


        // -----------------------------------------------------
        // RETURN
        // -----------------------------------------------------

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
            longitude
        };

    } catch (error) {

        console.error(
            "Environment Fetch Error:",
            error
        );

        return null;
    }
};


// =========================================================
// SEND MESSAGE TO BOT
// =========================================================

const sendMessageToBot = async (message) => {

    try {

        // -----------------------------------------------------
        // GET LOCATION
        // -----------------------------------------------------

        const location =
            await getUserLocation();


        // -----------------------------------------------------
        // GET ENVIRONMENT DATA
        // -----------------------------------------------------

        let environment = null;


        if (location) {

            environment =
                await getEnvironmentData(
                    location.latitude,
                    location.longitude
                );
        }


        // -----------------------------------------------------
        // REQUEST BODY
        // -----------------------------------------------------

        const requestBody = {

            message,

            environment
        };


        // -----------------------------------------------------
        // SEND TO BACKEND
        // -----------------------------------------------------

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(requestBody)
            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Something went wrong"
            );
        }


        return data.response;


    } catch (error) {

        console.error(
            "Chatbot API Error:",
            error
        );


        return "⚠️ Sorry, I'm having trouble connecting right now. Please try again.";
    }
};


export default sendMessageToBot;