export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMService {
  chat(messages: Message[], config?: Partial<LLMConfig>): Promise<LLMResponse>;
  complete(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse>;
} 