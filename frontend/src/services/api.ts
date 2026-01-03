import type {
  ApiResponse,
  QuestionRequest,
  QuestionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  MistakeRequest,
  MistakeResponse,
  HealthResponse,
  ToolsResponse,
} from '../types';

// API base URL - uses proxy in development, direct URL in production
const API_BASE = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001')
  : '';

class ApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  // Get available tools
  async getTools(): Promise<ToolsResponse> {
    return this.request<ToolsResponse>('/api/tools');
  }

  // Generate Question
  async generateQuestion(
    params: QuestionRequest
  ): Promise<ApiResponse<QuestionResponse>> {
    return this.request<ApiResponse<QuestionResponse>>(
      '/api/tools/generate-question',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  // Generate Embedding
  async generateEmbedding(
    params: EmbeddingRequest
  ): Promise<ApiResponse<EmbeddingResponse>> {
    return this.request<ApiResponse<EmbeddingResponse>>(
      '/api/tools/generate-embedding',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }

  // Explain Mistake
  async explainMistake(
    params: MistakeRequest
  ): Promise<ApiResponse<MistakeResponse>> {
    return this.request<ApiResponse<MistakeResponse>>(
      '/api/tools/explain-mistake',
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  }
}

// Export singleton instance
export const api = new ApiService();
