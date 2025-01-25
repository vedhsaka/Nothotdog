import { LLMProvider } from "./enums";

export interface ModelConfig {
    provider: LLMProvider;
    modelId: string;
    name: string;
    contextWindow: number;
    maxOutputTokens: number;
    defaultTemperature: number;
  }
  