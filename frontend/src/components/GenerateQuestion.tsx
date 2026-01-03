import { useState } from 'react';
import { api } from '../services/api';
import type { QuestionResponse } from '../types';

export function GenerateQuestion() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState(2);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.generateQuestion({ topic, difficulty });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to generate question');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="info-box">
        Generate Algebra 2 questions with multiple choice answers and step-by-step solutions.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="topic">Topic</label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., polynomials, factoring, quadratics"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            disabled={loading}
          >
            <option value={1}>1 - Very Simple</option>
            <option value={2}>2 - Moderate</option>
            <option value={3}>3 - Challenging</option>
            <option value={4}>4 - Advanced</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !topic.trim()}>
          {loading ? 'Generating...' : 'Generate Question'}
        </button>
      </form>

      {loading && (
        <div className="result loading">
          <div className="spinner"></div>
          <p>Generating question... This may take 10-30 seconds.</p>
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
            <span className="result-title">Generated Question</span>
            <span>Topic: {result.topic} | Difficulty: {result.difficulty}</span>
          </div>
          <div className="result-content">{result.raw}</div>
        </div>
      )}
    </div>
  );
}
