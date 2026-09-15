import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";

function ChatMessages({ messages, isTyping }) {
  return (
    <div className="chatbot-messages">

      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
        />
      ))}

      {isTyping && <TypingIndicator />}

    </div>
  );
}

export default ChatMessages;