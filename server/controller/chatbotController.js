import { getChatbotResponse } from "../services/chatbotService.js";
import { getEnvironmentData } from "../services/environmentService.js";

const chatWithBot = async (req, res) => {
    try {
        const { message, latitude, longitude } = req.body;

        // Check if message exists
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        let environmentData = null;

        /*
         * If the frontend provides location,
         * get the current environmental data.
         */
        if (latitude !== undefined && longitude !== undefined) {
            environmentData = await getEnvironmentData(
                latitude,
                longitude
            );
        }

        // Generate chatbot response
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