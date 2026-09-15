import { useState } from "react";
import ChatHeader from "./ChatHeader";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import QuickQuestions from "./QuickQuestions";
import sendMessageToBot from "../../services/chatbotService";
import "../../styles/chatbot.css";

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [thinkingStage, setThinkingStage] = useState("");

    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "bot",
            text: "Hello! 👋 I'm Vasudha Assistant. How can I help you with your environment today?"
        }
    ]);

    const thinkingStages = [
        "Understanding your question...",
        "Checking environmental data...",
        "Analyzing current conditions...",
        "Preparing your answer..."
    ];

    const sendMessage = async (message) => {
        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: message
        };

        setMessages((prev) => [...prev, userMessage]);

        setIsTyping(true);
        setThinkingStage(thinkingStages[0]);

        // Visual thinking sequence
        const stageTimer1 = setTimeout(() => {
            setThinkingStage(thinkingStages[1]);
        }, 500);

        const stageTimer2 = setTimeout(() => {
            setThinkingStage(thinkingStages[2]);
        }, 1000);

        const stageTimer3 = setTimeout(() => {
            setThinkingStage(thinkingStages[3]);
        }, 1500);

        try {
            const reply = await sendMessageToBot(message);

            // Make the thinking experience visible
            await new Promise((resolve) =>
                setTimeout(resolve, 500)
            );

            const botMessage = {
                id: Date.now() + 1,
                sender: "bot",
                text: reply
            };

            setMessages((prev) => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot Error:", error);

            const botMessage = {
                id: Date.now() + 1,
                sender: "bot",
                text: "⚠️ Sorry, something went wrong. Please try again."
            };

            setMessages((prev) => [...prev, botMessage]);

        } finally {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            clearTimeout(stageTimer3);

            setIsTyping(false);
            setThinkingStage("");
        }
    };

    return (
        <>
            {!isOpen && (
                <button
                    className="chatbot-floating-button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Vasudha Assistant"
                >
                    🌱
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">

                    <ChatHeader
                        onClose={() => setIsOpen(false)}
                    />

                    <ChatMessages
                        messages={messages}
                        isTyping={isTyping}
                    />

                    {/* Thinking / Analysis Status */}
                    {isTyping && (
                        <div className="vasudha-thinking">

                            <div className="thinking-avatar">
                                🌱
                            </div>

                            <div className="thinking-content">

                                <div className="thinking-title">
                                    Vasudha is thinking
                                    <span className="thinking-dots">
                                        <span>.</span>
                                        <span>.</span>
                                        <span>.</span>
                                    </span>
                                </div>

                                <div className="thinking-stage">
                                    <span className="thinking-pulse">
                                        ●
                                    </span>

                                    {thinkingStage}
                                </div>

                            </div>

                        </div>
                    )}

                    {messages.length === 1 && !isTyping && (
                        <QuickQuestions
                            onQuestionClick={sendMessage}
                        />
                    )}

                    <ChatInput onSend={sendMessage} />

                </div>
            )}
        </>
    );
}

export default Chatbot;