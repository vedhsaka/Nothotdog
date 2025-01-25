import { LLMProvider, AnthropicModel } from './enums';
import { ModelConfig } from './types';

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  [AnthropicModel.Sonnet3_5]: {
    provider: LLMProvider.Anthropic,
    modelId: AnthropicModel.Sonnet3_5,
    name: 'Claude 3 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    defaultTemperature: 0.7
  }
};
