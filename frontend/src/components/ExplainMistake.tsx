import { useState } from 'react';
import { api } from '../services/api';
import type { MistakeResponse } from '../types';

export function ExplainMistake() {
  const [question, setQuestion] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MistakeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !wrongAnswer.trim() || !correctAnswer.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.explainMistake({ question, wrongAnswer, correctAnswer });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to explain mistake');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = question.trim() && wrongAnswer.trim() && correctAnswer.trim();

  return (
    <div>
      <div className="info-box">
        Get educational explanations for why an answer is wrong, with step-by-step guidance.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="question">Math Question</label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="The math question that was asked..."
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="wrongAnswer">Student's Wrong Answer</label>
          <input
            id="wrongAnswer"
            type="text"
            value={wrongAnswer}
            onChange={(e) => setWrongAnswer(e.target.value)}
            placeholder="The incorrect answer given"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="correctAnswer">Correct Answer</label>
          <input
            id="correctAnswer"
            type="text"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="The correct answer"
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !isFormValid}>
          {loading ? 'Analyzing...' : 'Explain Mistake'}
        </button>
      </form>

      {loading && (
        <div className="result loading">
          <div className="spinner"></div>
          <p>Analyzing mistake... This may take 10-30 seconds.</p>
        </div>
      )}

      {error && (
        <div className="result error">
          <div className="result-header">
            <span className="result-title">Error</span>
          </div>
          <div className="result-content">{error}</div>
        </div>
      )}

      {result && (
        <div className="result">
          <div className="result-header">
            <span className="result-title">Explanation</span>
          </div>
          <div className="result-content">
            <strong>Question:</strong> {result.question}
            {'\n'}
            <strong>Wrong Answer:</strong> {result.wrongAnswer}
            {'\n'}
            <strong>Correct Answer:</strong> {result.correctAnswer}
            {'\n\n'}
            <strong>Explanation:</strong>
            {'\n'}
            {result.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
