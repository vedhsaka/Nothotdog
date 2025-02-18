export enum LLMProvider {
  Anthropic = 'anthropic',
  OpenAI = 'openai',
}

export enum AnthropicModel {
  Sonnet3_5 = 'claude-3-sonnet-20240229'
}

export enum OpenAIModel {
  GPT4 = "gpt-4",
  GPT35Turbo = "gpt-3.5-turbo"
}

export interface ModelConfig {
  maxTokens: number;
  temperature: number;
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  [AnthropicModel.Sonnet3_5]: {
    maxTokens: 4096,
    temperature: 0.7
  },
  [OpenAIModel.GPT4]: {
    maxTokens: 8192,
    temperature: 0.7
  },
  [OpenAIModel.GPT35Turbo]: {
    maxTokens: 4096,
    temperature: 0.7
  }
};