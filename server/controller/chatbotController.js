import { getChatbotResponse } from "../services/chatbotService.js";

const chatWithBot = async (req, res) => {
    try {
        const { message, environment, history } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please enter a message."
            });
        }

        const response = await getChatbotResponse({
            message,
            environment,
            history
        });

        return res.status(200).json({
            success: true,
            response
        });

    } catch (error) {
        console.error("Chatbot Controller Error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while generating response. Please try again."
        });
    }
};

export { chatWithBot };