const normalizeText = (message) => {
    return message
        .toLowerCase()
        .trim()
        .replace(/[?!.,;:'"()]/g, " ")
        .replace(/\s+/g, " ");
};


// Exact word / phrase matching
const containsAny = (text, keywords) => {
    return keywords.some((keyword) => {
        const pattern = new RegExp(
            `(^|\\s)${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
            "i"
        );

        return pattern.test(text);
    });
};


// Phrase matching where exact word boundaries are important
const containsPhrase = (text, phrases) => {
    return phrases.some((phrase) => {
        return text.includes(phrase);
    });
};


const getAqiCategory = (aqi) => {
    if (aqi === null || aqi === undefined) {
        return "AQI unavailable";
    }

    if (aqi <= 50) {
        return "Good 😊";
    }

    if (aqi <= 100) {
        return "Moderate 😐";
    }

    if (aqi <= 150) {
        return "Unhealthy for Sensitive Groups 😷";
    }

    if (aqi <= 200) {
        return "Unhealthy 🚨";
    }

    if (aqi <= 300) {
        return "Very Unhealthy 🚨";
    }

    return "Hazardous ☠️";
};


const getOutdoorAdvice = (aqi) => {
    if (aqi === null || aqi === undefined) {
        return "🌱 I couldn't retrieve the current AQI, so I can't provide a current outdoor recommendation.";
    }

    if (aqi <= 50) {
        return `🌱 The current AQI is ${Math.round(
            aqi
        )} — Good 😊. Outdoor activities such as walking, running and cycling are generally suitable based on the current air-quality reading.`;
    }

    if (aqi <= 100) {
        return `🌱 The current AQI is ${Math.round(
            aqi
        )} — Moderate 😐. A normal walk is generally reasonable. If you are sensitive to air pollution, consider reducing prolonged or intense exercise.`;
    }

    if (aqi <= 150) {
        return `⚠️ The current AQI is ${Math.round(
            aqi
        )} — Unhealthy for Sensitive Groups 😷. Sensitive individuals should consider limiting prolonged or intense outdoor activity.`;
    }

    if (aqi <= 200) {
        return `🚨 The current AQI is ${Math.round(
            aqi
        )} — Unhealthy. Consider reducing prolonged outdoor activity, especially intense exercise.`;
    }

    if (aqi <= 300) {
        return `🚨 The current AQI is ${Math.round(
            aqi
        )} — Very Unhealthy. It is better to avoid prolonged outdoor activity while air quality remains this poor.`;
    }

    return `☠️ The current AQI is ${Math.round(
        aqi
    )} — Hazardous. Avoid outdoor activity while these conditions persist.`;
};


const getChatbotResponse = (
    message,
    environmentData = null
) => {

    const text = normalizeText(message);


    /*
    ========================================================
    1. GREETINGS
    ========================================================
    */

    if (
        containsAny(text, [
            "hello",
            "hi",
            "hii",
            "hiii",
            "hey",
            "heyy",
            "namaste",
            "namaskar"
        ]) ||
        containsPhrase(text, [
            "good morning",
            "good afternoon",
            "good evening"
        ])
    ) {
        return "Hello! 👋 I'm Vasudha Assistant 🌱. I can help you understand air quality, AQI, weather, outdoor activities, carbon footprint, electricity, sustainability and eco-friendly decisions.";
    }

    if (
        containsPhrase(text, [
            "thank you",
            "thankyou",
            "thanks",
            "thank u",
            "thankyou so much",
            "thanks a lot",
            "thank you so much"
        ]) ||
        containsAny(text, [
            "thx",
            "ty"
        ])
    ) {
        return "You're very welcome! 🌱💚 I'm always happy to help you make greener decisions.";
    }

    if (
        containsPhrase(text, [
            "who are you",
            "what are you",
            "what is vasudha",
            "tell me about yourself",
            "what can you do",
            "how can you help",
            "help me"
        ]) ||
        containsAny(text, [
            "your name"
        ])
    ) {
        return "🌱 I'm Vasudha Assistant — the environmental intelligence assistant of Vasudha. I can help you with live AQI, air quality, weather, outdoor activity guidance, carbon footprint, electricity conservation and sustainability tips.";
    }


    if (
        containsPhrase(text, [
            "what is aqi",
            "what does aqi mean",
            "explain aqi",
            "aqi meaning",
            "aqi scale",
            "aqi levels",
            "how does aqi work"
        ])
    ) {
        return "🌫️ AQI stands for Air Quality Index. It is a numerical indicator used to communicate how clean or polluted the air is. Generally, a lower AQI indicates better air quality, while a higher AQI indicates greater pollution.";
    }
    if (
        containsAny(text, [
            "aqi"
        ]) ||
        containsPhrase(text, [
            "air quality",
            "air pollution",
            "pollution level",
            "pollution today",
            "how polluted",
            "how clean is the air",
            "is the air clean",
            "air condition",
            "air conditions",
            "air status",
            "pollution status"
        ])
    ) {

        if (
            environmentData?.aqi !== null &&
            environmentData?.aqi !== undefined
        ) {

            const aqi =
                Math.round(environmentData.aqi);

            const category =
                getAqiCategory(environmentData.aqi);

            return `🌫️ Current AQI: ${aqi}

Status: ${category}

Based on the current reading, the air quality is ${category}.`;
        }

        return "🌫️ I couldn't retrieve the current AQI right now. Please try again.";
    }


    /*
    ========================================================
    6. OUTDOOR ACTIVITIES
    ========================================================
    */

    if (
        containsPhrase(text, [
            "go outside",
            "going outside",
            "go out",
            "take a walk",
            "morning walk",
            "evening walk",
            "play outside",
            "sports outside"
        ]) ||
        containsAny(text, [
            "outside",
            "walk",
            "walking",
            "run",
            "running",
            "jog",
            "jogging",
            "exercise",
            "workout",
            "cycling",
            "cycle",
            "bike",
            "biking",
            "outdoor",
            "outdoors"
        ])
    ) {
        return getOutdoorAdvice(
            environmentData?.aqi
        );
    }


    /*
    ========================================================
    7. WEATHER
    ========================================================
    */

    if (
        containsPhrase(text, [
            "current weather",
            "weather today",
            "weather conditions",
            "what is the weather",
            "how is the weather",
            "temperature today"
        ]) ||
        containsAny(text, [
            "weather",
            "temperature",
            "temp",
            "hot",
            "cold",
            "humid",
            "humidity",
            "wind",
            "windy",
            "forecast"
        ])
    ) {

        if (environmentData?.weather) {

            const weather =
                environmentData.weather;

            return `🌤️ Current Weather\n\n🌡️ Temperature: ${weather.temperature ?? "--"
                }°C\n💧 Humidity: ${weather.humidity ?? "--"
                }%\n💨 Wind: ${weather.windSpeed ?? "--"
                } km/h\n☀️ UV Index: ${weather.uvIndex ?? "--"
                }\n☁️ Cloud Cover: ${weather.cloudCover ?? "--"
                }%`;
        }

        return "🌤️ I couldn't retrieve the current weather data.";
    }


    /*
    ========================================================
    8. POLLUTANTS
    ========================================================
    */

    if (
        containsPhrase(text, [
            "what pollutants",
            "which pollutants",
            "pollutant levels",
            "pollution details",
            "what is in the air",
            "what is in air",
            "carbon monoxide",
            "nitrogen dioxide",
            "sulphur dioxide",
            "sulfur dioxide"
        ]) ||
        containsAny(text, [
            "pollutants",
            "pollutant",
            "pm25",
            "pm10",
            "no2",
            "so2",
            "o3"
        ])
    ) {

        const p =
            environmentData?.pollutants;

        if (p) {

            return `🌫️ Current Air Pollutants\n\nPM2.5: ${p.pm25 ?? "--"
                } μg/m³\nPM10: ${p.pm10 ?? "--"
                } μg/m³\nCO: ${p.carbonMonoxide ?? "--"
                } μg/m³\nNO₂: ${p.nitrogenDioxide ?? "--"
                } μg/m³\nSO₂: ${p.sulphurDioxide ?? "--"
                } μg/m³\nO₃: ${p.ozone ?? "--"
                } μg/m³`;
        }

        return "🌫️ Pollutant data is currently unavailable.";
    }


    /*
    ========================================================
    9. CARBON FOOTPRINT
    ========================================================
    */

    if (
        containsPhrase(text, [
            "carbon footprint",
            "reduce carbon",
            "reduce co2",
            "reduce co₂",
            "carbon emission",
            "carbon emissions",
            "greenhouse gas",
            "greenhouse gases",
            "my footprint"
        ]) ||
        containsAny(text, [
            "carbon",
            "co2",
            "emission",
            "emissions",
            "footprint"
        ])
    ) {

        return "🌱 You can reduce CO₂ emissions by using public transport, walking or cycling for short trips, reducing unnecessary electricity consumption, improving energy efficiency, avoiding unnecessary fuel use and reducing waste. You can also use Vasudha's Carbon Calculator and Tracker to measure your impact.";
    }


    /*
    ========================================================
    10. ELECTRICITY / ENERGY
    ========================================================
    */

    if (
        containsPhrase(text, [
            "save electricity",
            "saving electricity",
            "reduce electricity",
            "electricity consumption",
            "electricity usage",
            "energy consumption",
            "energy usage",
            "save energy",
            "reduce energy",
            "power consumption",
            "power usage"
        ]) ||
        containsAny(text, [
            "electricity",
            "energy",
            "appliance",
            "appliances",
            "fan",
            "fridge",
            "refrigerator"
        ]) ||
        containsPhrase(text, [
            "air conditioner"
        ]) ||
        containsAny(text, [
            "ac"
        ])
    ) {

        return "⚡ You can save electricity by switching off unused appliances, reducing unnecessary AC usage, using energy-efficient appliances, avoiding standby power, making better use of natural light and monitoring your electricity consumption.";
    }


    /*
    ========================================================
    11. ECO / SUSTAINABILITY
    ========================================================
    */

    if (
        containsPhrase(text, [
            "eco tip",
            "eco tips",
            "green tip",
            "green tips",
            "environment tip",
            "environmental tip",
            "how can i help earth",
            "how can i help environment",
            "save environment",
            "protect environment",
            "save earth",
            "protect earth",
            "go green",
            "green lifestyle",
            "eco friendly",
            "eco-friendly"
        ]) ||
        containsAny(text, [
            "sustainability",
            "sustainable",
            "environment",
            "green"
        ])
    ) {

        return "🌍 Here are some simple actions:\n\n🚶 Walk or cycle for short trips\n🚌 Prefer public transport when practical\n⚡ Save electricity and avoid standby power\n💧 Reduce unnecessary water usage\n♻️ Reuse and recycle materials\n🥤 Reduce single-use plastic\n🌱 Track your carbon footprint\n🌳 Support tree planting and local environmental initiatives";
    }


    /*
    ========================================================
    12. LOCATION
    ========================================================
    */

    if (
        containsPhrase(text, [
            "my location",
            "my area",
            "where am i",
            "current location",
            "near me",
            "around me",
            "live data",
            "local air"
        ]) ||
        containsAny(text, [
            "location"
        ])
    ) {

        if (
            environmentData?.latitude !== undefined &&
            environmentData?.longitude !== undefined
        ) {
            return `📍 I'm using your current location to retrieve live environmental data.\n\nCurrent AQI: ${environmentData.aqi !== null
                    ? Math.round(environmentData.aqi)
                    : "--"
                }`;
        }

        return "📍 I couldn't access your current location. Please allow location access in your browser.";
    }


    /*
    ========================================================
    13. GOODBYE
    ========================================================
    */

    if (
        containsAny(text, [
            "bye",
            "goodbye"
        ]) ||
        containsPhrase(text, [
            "see you",
            "good night"
        ])
    ) {
        return "Goodbye! 🌱💚 Keep making small choices that create a greener future.";
    }


    /*
    ========================================================
    DEFAULT
    ========================================================
    */

    return "🤔 I'm not sure I understood that yet.\n\nTry asking me:\n\n🌫️ What's the current AQI?\n🌤️ What's the weather?\n🚶 Can I go for a walk?\n🚴 Is it okay to cycle?\n🧪 What pollutants are present?\n🌱 How can I reduce my CO₂?\n⚡ How do I save electricity?\n🌍 Give me some eco tips";
};


export { getChatbotResponse };