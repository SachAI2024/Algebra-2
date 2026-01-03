import { useState } from 'react';
import { api } from '../services/api';
import type { EmbeddingResponse } from '../types';

export function GenerateEmbedding() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmbeddingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.generateEmbedding({ text });
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error || 'Failed to generate embedding');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatEmbedding = (embedding: number[]): string => {
    const preview = embedding.slice(0, 10).map(n => n.toFixed(4)).join(', ');
    return `[${preview}, ... (${embedding.length - 10} more)]`;
  };

  return (
    <div>
      <div className="info-box">
        Generate 384-dimensional vector embeddings for semantic search and RAG systems.
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="text">Text to Embed</label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to generate embedding for..."
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading || !text.trim()}>
          {loading ? 'Generating...' : 'Generate Embedding'}
        </button>
      </form>

      {loading && (
        <div className="result loading">
          <div className="spinner"></div>
          <p>Generating embedding...</p>
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
            <span className="result-title">Embedding Generated</span>
          </div>
          <div className="result-content">
            <strong>Dimensions:</strong> {result.dimensions}
            {'\n'}
            <strong>Input Length:</strong> {result.textLength} characters
            {'\n\n'}
            <strong>Vector Preview:</strong>
            {'\n'}
            {formatEmbedding(result.embedding)}
            {'\n\n'}
            <strong>Full Vector (JSON):</strong>
            {'\n'}
            {JSON.stringify(result.embedding)}
          </div>
        </div>
      )}
    </div>
  );
}
