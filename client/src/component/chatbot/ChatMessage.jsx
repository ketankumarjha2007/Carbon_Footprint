function ChatMessage({ message }) {
  return (
    <div
      className={`chat-message ${
        message.sender === "user"
          ? "user-message"
          : "bot-message"
      }`}
    >
      {message.sender === "bot" && (
        <div className="message-avatar">
          🌱
        </div>
      )}

      <div className="message-content">
        {message.text}
      </div>
    </div>
  );
}

export default ChatMessage;