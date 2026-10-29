// Vasudha Environmental Intelligence Assistant Service
// Powered by Groq AI API

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * AQI category helper for fallback and telemetry formatting
 */
const getAqiCategory = (aqi) => {
    if (aqi === null || aqi === undefined) return "AQI unavailable";
    if (aqi <= 50) return "Good 😊";
    if (aqi <= 100) return "Moderate 😐";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups 😷";
    if (aqi <= 200) return "Unhealthy 🚨";
    if (aqi <= 300) return "Very Unhealthy 🚨";
    return "Hazardous ☠️";
};

/**
 * Builds the comprehensive system prompt for the Groq AI model,
 * embedding live environmental telemetry (AQI, weather, pollutants) if available.
 */
const buildSystemPrompt = (environment) => {
    let telemetryInfo = "";

    if (environment) {
        const { aqi, pollutants, weather } = environment;
        const category = aqi != null ? getAqiCategory(aqi) : "Unknown";

        telemetryInfo = `
========================================
CURRENT REAL-TIME ENVIRONMENTAL CONDITIONS (LOCAL TO USER):
- AQI: ${aqi != null ? `${Math.round(aqi)} (${category})` : "Unavailable"}
- Temperature: ${weather?.temperature != null ? `${weather.temperature}°C` : "Unavailable"}
- Feels Like: ${weather?.apparentTemperature != null ? `${weather.apparentTemperature}°C` : "Unavailable"}
- Humidity: ${weather?.humidity != null ? `${weather.humidity}%` : "Unavailable"}
- Wind Speed: ${weather?.windSpeed != null ? `${weather.windSpeed} km/h` : "Unavailable"}
- UV Index: ${weather?.uvIndex != null ? weather.uvIndex : "Unavailable"}
- Conditions: ${weather?.cloudCover != null ? (weather.cloudCover > 60 ? "Cloudy" : weather.cloudCover > 20 ? "Partly cloudy" : "Clear") : "Normal"}
- Pollutants: PM2.5: ${pollutants?.pm25 ?? "--"} µg/m³, PM10: ${pollutants?.pm10 ?? "--"} µg/m³
========================================
Use these values naturally in your explanation when asked about current air quality, weather, or outdoor suitability.`;
    }

    return `You are "Vasudha Assistant" 🌱, a smart, friendly, and concise environmental AI assistant for the Vasudha sustainability platform.

CORE PRINCIPLES FOR YOUR RESPONSES:
1. BREVITY & CHAT-FRIENDLINESS:
   - This is a compact chat bubble. Keep responses concise, conversational, and scannable (around 60 to 120 words).
   - Deliver the direct answer in the very first sentence.
   - Use 2 to 3 bullet points maximum for actionable tips.
   - Never produce walls of text or overly repetitive checklists.

2. STRICT FORMATTING RULES (DO NOT VIOLATE):
   - NEVER output markdown tables (do NOT use |---|---|).
   - NEVER use markdown headers (# or ## or ### or ####). Use simple bold phrases for emphasis instead.
   - NEVER output markdown checkboxes (- [ ]).
   - NEVER display raw GPS coordinates (e.g. 13.1326 N, 77.5711 E). Simply say "in your area" or "locally".
   - Use clean, well-spaced bullet points (- or •) and pleasant emojis (🌱, 🌤️, 🚶, 🚲, ⚡).

3. OUTDOOR & TRIP GUIDANCE:
   - Give a clear, direct answer on whether it's good to head out based on the live AQI and temperature above.
   - Mention key conditions briefly (e.g., "AQI is 100 (Moderate) with 21.5°C").
   - Suggest 1 eco-friendly travel tip (e.g. public transit, cycling, or checking Vasudha's Carbon Calculator).

${telemetryInfo}`;
};

/**
 * Cleans up common markdown artifacts (tables, hashtags, checkboxes)
 * to ensure response renders beautifully in chat bubbles.
 */
const cleanBotReply = (text) => {
    if (!text) return "";
    return text
        // Remove markdown table divider lines |---|---|
        .replace(/^\s*\|[-:\s|]+\|\s*$/gm, "")
        // Clean table rows: convert | A | B | to clean text
        .replace(/^\s*\|(.+)\|\s*$/gm, (_, content) => {
            return content.split("|").map((col) => col.trim()).filter(Boolean).join(" • ");
        })
        // Remove markdown heading hashes (### Heading -> Heading)
        .replace(/^#{1,6}\s+/gm, "")
        // Remove markdown checkboxes (- [ ] -> •)
        .replace(/^-\s*\[[\sxX]\]\s*/gm, "• ")
        // Normalize bullet points to clean dots
        .replace(/^\*\s+/gm, "• ")
        .replace(/^-\s+/gm, "• ")
        // Remove raw coordinate patterns like "at 13.1326 N, 77.5711 E"
        .replace(/\bat\s+-?\d+\.\d+\s*[NS]?,\s*-?\d+\.\d+\s*[EW]?/gi, "in your area")
        // Trim excessive blank lines
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

/**
 * Fallback response generator in case GROQ_API_KEY is missing or the API is unreachable.
 */
const getFallbackResponse = (message, environment) => {
    const text = (message || "").toLowerCase().trim();

    if (text.includes("outside") || text.includes("walk") || text.includes("run") || text.includes("cycle")) {
        const aqi = environment?.aqi;
        if (aqi != null) {
            const roundedAqi = Math.round(aqi);
            const category = getAqiCategory(roundedAqi);
            return `🌱 Current AQI is ${roundedAqi} (${category}). ${
                roundedAqi <= 100
                    ? "It is generally fine to go outside for a walk or exercise!"
                    : "Air quality is elevated. It is recommended to limit strenuous outdoor activity."
            }`;
        }
        return "🌱 I couldn't retrieve the live AQI at the moment, but check local weather conditions before heading out!";
    }

    if (text.includes("aqi") || text.includes("air quality") || text.includes("pollution")) {
        if (environment?.aqi != null) {
            return `🌫️ Current AQI is ${Math.round(environment.aqi)} — ${getAqiCategory(environment.aqi)}.`;
        }
        return "🌫️ AQI (Air Quality Index) measures air pollution levels. Lower numbers mean cleaner, healthier air!";
    }

    if (text.includes("weather") || text.includes("temperature") || text.includes("temp")) {
        const w = environment?.weather;
        if (w) {
            return `🌤️ Current Weather:\n🌡️ Temperature: ${w.temperature ?? "--"}°C\n💧 Humidity: ${w.humidity ?? "--"}%\n💨 Wind: ${w.windSpeed ?? "--"} km/h\n☀️ UV Index: ${w.uvIndex ?? "--"}`;
        }
        return "🌤️ Weather data is currently unavailable. Please ensure location access is enabled.";
    }

    return "🌱 Hello! I am Vasudha Assistant. To activate full AI-powered responses with Groq, please configure `GROQ_API_KEY` in `server/.env`. I can help you with AQI, weather, carbon footprint tracking, and eco-friendly tips!";
};

/**
 * Main function: getChatbotResponse
 * Calls the Groq API (e.g. llama-3.3-70b-versatile) with system telemetry & multi-turn history.
 * Supports both ({ message, environment, history }) and (message, environment, history).
 */
const getChatbotResponse = async (input, maybeEnvironment = null, maybeHistory = []) => {
    let message = "";
    let environment = null;
    let history = [];

    if (typeof input === "object" && input !== null && ("message" in input)) {
        message = input.message;
        environment = input.environment || null;
        history = input.history || [];
    } else {
        message = input || "";
        environment = maybeEnvironment;
        history = maybeHistory;
    }
    const apiKey = process.env.GROQ_API_KEY?.trim();
    const configuredModel = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
    const candidateModels = [configuredModel, "openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"].filter(
        (v, i, a) => a.indexOf(v) === i
    );

    if (!apiKey) {
        console.warn("⚠️ [Chatbot] GROQ_API_KEY is not defined in server/.env. Using fallback response.");
        return getFallbackResponse(message, environment);
    }

    // Build the system prompt with live environmental context
    const systemPrompt = buildSystemPrompt(environment);

    // Sanitize conversation history (keep last 8 turns to stay focused and within token budgets)
    const sanitizedHistory = Array.isArray(history)
        ? history
              .filter((item) => item && typeof item.content === "string" && (item.role === "user" || item.role === "assistant"))
              .slice(-8)
              .map((item) => ({
                  role: item.role,
                  content: item.content.slice(0, 2000)
              }))
        : [];

    const messages = [
        { role: "system", content: systemPrompt },
        ...sanitizedHistory,
        { role: "user", content: message.slice(0, 2000) }
    ];

    for (const modelToTry of candidateModels) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelToTry,
                    messages,
                    temperature: 0.7,
                    max_tokens: 800,
                    top_p: 0.95
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Groq API Error Response (${modelToTry}):`, response.status, errorData);

                if (response.status === 401) {
                    return "⚠️ Groq API key is invalid or unauthorized. Please verify your `GROQ_API_KEY` in `server/.env`.";
                }
                if (response.status === 404) {
                    // Try next model
                    continue;
                }
                if (response.status === 429) {
                    return "⏳ Vasudha Assistant is receiving high traffic right now. Please try again in a few moments!";
                }

                return getFallbackResponse(message, environment);
            }

            const data = await response.json();
            const rawReply = data.choices?.[0]?.message?.content?.trim();

            if (rawReply) {
                return cleanBotReply(rawReply);
            }
        } catch (error) {
            console.error(`Groq API Request Error (${modelToTry}):`, error);
        }
    }

    return getFallbackResponse(message, environment);
};

export { getChatbotResponse, getAqiCategory };
