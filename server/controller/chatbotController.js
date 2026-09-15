import { getChatbotResponse } from "../services/chatbotService.js";
import { getEnvironmentData } from "../services/environmentService.js";

const chatWithBot = async (req, res) => {
    try {
        const { message, latitude, longitude } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        let environmentData = null;

        // Get live environmental data when location is available.
        // If the environmental API fails, the chatbot should still work.
        if (latitude !== undefined && longitude !== undefined) {
            try {
                environmentData = await getEnvironmentData(
                    latitude,
                    longitude
                );
            } catch (error) {
                console.error(
                    "Environment Data Error:",
                    error.message
                );

                environmentData = null;
            }
        }

        const response = getChatbotResponse(
            message,
            environmentData
        );

        return res.status(200).json({
            success: true,
            response: response
        });

    } catch (error) {
        console.error("Chatbot Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong. Please try again."
        });
    }
};

export { chatWithBot };