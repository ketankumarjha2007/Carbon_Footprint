import { getChatbotResponse } from "../services/chatbotService.js";
const chatWithBot = async (req, res) => {

    try {

        const {
            message,
            environment
        } = req.body;


        if (!message || !message.trim()) {

            return res.status(400).json({

                success: false,

                message:
                    "Please enter a message."
            });
        }


        const response =
            getChatbotResponse(
                message,
                environment
            );


        return res.status(200).json({

            success: true,

            response
        });


    } catch (error) {

        console.error(
            "Chatbot Error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Something went wrong. Please try again."
        });
    }
};


export { chatWithBot };