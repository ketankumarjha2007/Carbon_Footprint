function QuickQuestions({ onQuestionClick }) {
  const questions = [
    "Is it fine to go outside?",
    "How is the air quality?",
    "Can I go for a walk?",
    "How can I reduce my carbon footprint?",
    "Give me some eco tips"
  ];

  return (
    <div className="quick-questions">

      <p>Try asking:</p>

      <div className="quick-question-list">

        {questions.map((question) => (
          <button
            key={question}
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </button>
        ))}

      </div>

    </div>
  );
}

export default QuickQuestions;