import { LLMProvider, AnthropicModel, OpenAIModel } from './enums';

interface ModelConfig {
  provider: LLMProvider;
  modelId: string;
  maxTokens: number;
  defaultTemperature: number;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  [AnthropicModel.Sonnet3_5]: {
    provider: LLMProvider.Anthropic,
    modelId: AnthropicModel.Sonnet3_5,
    maxTokens: 4096,
    defaultTemperature: 0.7
  },
  [OpenAIModel.GPT4]: {
    provider: LLMProvider.OpenAI,
    modelId: OpenAIModel.GPT4,
    maxTokens: 8192,
    defaultTemperature: 0.7
  },
  [OpenAIModel.GPT35Turbo]: {
    provider: LLMProvider.OpenAI,
    modelId: OpenAIModel.GPT35Turbo,
    maxTokens: 4096,
    defaultTemperature: 0.7
  }
};