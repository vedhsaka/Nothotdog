import { ChatAnthropic } from "@langchain/anthropic";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { LLMProvider } from './enums';
import { MODEL_CONFIGS } from './config';

export class ModelFactory {
  static createLangchainModel(modelId: string, apiKey: string): BaseChatModel {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      throw new Error(`Model configuration not found for ${modelId}`);
    }

    switch (config.provider) {
      case LLMProvider.Anthropic:
        return new ChatAnthropic({
          anthropicApiKey: apiKey,
          modelName: config.modelId,
          temperature: config.defaultTemperature,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}