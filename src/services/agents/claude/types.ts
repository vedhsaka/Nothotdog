import { TestMessage } from "@/types/runs";
import { LLMProvider } from "@/services/llm/enums";

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

export interface QaAgentConfig {
  provider: LLMProvider;
  modelId?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  headers: Record<string, string>;
  endpointUrl: string;
  apiConfig: ApiConfig;
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
    metrics: {
      responseTime: number;
    };
  };
}