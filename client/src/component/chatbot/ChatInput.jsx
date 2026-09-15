import { useState } from "react";

function ChatInput({ onSend }) {

  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    onSend(input.trim());

    setInput("");
  };

  return (
    <form
      className="chatbot-input-container"
      onSubmit={handleSubmit}
    >

      <input
        type="text"
        placeholder="Ask Vasudha..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        type="submit"
        disabled={!input.trim()}
      >
        ➤
      </button>

    </form>
  );
}

export default ChatInput;