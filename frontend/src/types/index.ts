// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tool types
export interface QuestionRequest {
  topic: string;
  difficulty: number;
}

export interface QuestionResponse {
  raw: string;
  topic: string;
  difficulty: number;
}

export interface EmbeddingRequest {
  text: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  textLength: number;
}

export interface MistakeRequest {
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
}

export interface MistakeResponse {
  explanation: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
}

// Health check
export interface HealthResponse {
  status: string;
  timestamp: string;
  hasApiKey: boolean;
}

// Tool info
export interface ToolParameter {
  type: string;
  required: boolean;
  description: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, ToolParameter>;
}

export interface ToolsResponse {
  tools: Tool[];
}
