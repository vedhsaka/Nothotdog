import { TestMessage } from "@/types/runs";
import { AnthropicModel, OpenAIModel } from "../../llm/enums";

export interface Rule {
  id: string;
  path: string;
  condition: string;
  value: string;
  isValid: boolean;
}

export interface ApiConfig {
  inputFormat: Record<string, any>;
  outputFormat: Record<string, any>;
  rules: Rule[];
}

export interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface QaAgentConfig {
  modelId: AnthropicModel | OpenAIModel;
  headers: Record<string, string>;
  endpointUrl: string;
  apiConfig: ApiConfig;
  persona?: string;
  modelOptions?: ModelOptions; 
}

export interface LLMConfig {
  keyName: string;
  apiKey: string;
  model: AnthropicModel | OpenAIModel;
}

export interface ConversationValidation {
  isCorrect: boolean;
  explanation: string;
}

export interface TestResult {
  conversation: {
    humanMessage: string;
    rawInput: Record<string, any>;
    rawOutput: Record<string, any>;
    chatResponse: string;
    allMessages: TestMessage[];
  };
  validation: {
    passedTest: boolean;
    formatValid: boolean;
    conditionMet: boolean;
    explanation: string;
    conversationValidation?: ConversationValidation;
    metrics: {
      responseTime: number;
    };
  };
}