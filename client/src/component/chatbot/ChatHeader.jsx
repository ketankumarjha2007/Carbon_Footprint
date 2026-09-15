function ChatHeader({ onClose }) {
  return (
    <div className="chatbot-header">
      <div className="chatbot-header-info">
        <div className="chatbot-avatar">
          🌱
        </div>

        <div>
          <h3>Vasudha Assistant</h3>
          <span>Environmental Assistant</span>
        </div>
      </div>

      <button
        className="chatbot-close"
        onClick={onClose}
        aria-label="Close chatbot"
      >
        ✕
      </button>
    </div>
  );
}

export default ChatHeader;