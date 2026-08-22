// ============================================================================
// SAVIA-OS AI SERVICE PROVIDER - TYPES & INTERFACES
// ============================================================================

export interface AIMessage {
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface AIRequest {
  prompt: string;
  history?: AIMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIResponse {
  text: string;
  modelUsed: string;
  latencyMs: number;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface AIChunk {
  deltaText: string;
  isComplete: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  generateText(input: AIRequest, signal?: AbortSignal): Promise<AIResponse>;
  streamText?(input: AIRequest, signal?: AbortSignal): AsyncIterable<AIChunk>;
}
