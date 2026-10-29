function formatMessageContent(text) {
  if (!text) return null;

  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    // Parse inline bold markdown: **bold text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);

    const renderedLine = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={partIdx} className="message-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    return (
      <span key={lineIdx} className="message-line">
        {renderedLine}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

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
        {formatMessageContent(message.text)}
      </div>
    </div>
  );
}

export default ChatMessage;
