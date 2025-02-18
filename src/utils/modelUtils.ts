import { LLMProvider, AnthropicModel, OpenAIModel } from '@/services/llm/enums';

const MODEL_TO_PROVIDER_MAP = {
  [AnthropicModel.Sonnet3_5]: LLMProvider.Anthropic,
  [OpenAIModel.GPT4]: LLMProvider.OpenAI,
  [OpenAIModel.GPT35Turbo]: LLMProvider.OpenAI
};

export function getModelProvider(modelName: string): string {
  return MODEL_TO_PROVIDER_MAP[modelName as keyof typeof MODEL_TO_PROVIDER_MAP] || LLMProvider.OpenAI;
}

export function getActiveModelConfig(llmConfig: Record<string, string>, activeModel: string) {
  const provider = getModelProvider(activeModel);
  const apiKey = llmConfig[provider];
  
  if (!apiKey) return null;

  return {
    [provider]: apiKey
  };
}

export function castToModelType(modelName: string): AnthropicModel | OpenAIModel {
  if (Object.values(AnthropicModel).includes(modelName as AnthropicModel)) {
    return modelName as AnthropicModel;
  }
  if (Object.values(OpenAIModel).includes(modelName as OpenAIModel)) {
    return modelName as OpenAIModel;
  }
  return modelName.indexOf('gpt') !== -1 ? OpenAIModel.GPT4 : AnthropicModel.Sonnet3_5;
}