import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { LLMProvider, AnthropicModel, OpenAIModel } from './enums';
import { MODEL_CONFIGS } from './config';

interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
}

export class ModelFactory {
  static createLangchainModel(
    modelId: string, 
    apiKey: string, 
    options?: ModelOptions
  ): BaseChatModel {
    const config = MODEL_CONFIGS[modelId];
    if (!config) {
      throw new Error(`Model configuration not found for ${modelId}`);
    }

    const modelConfig = {
      temperature: options?.temperature || config.defaultTemperature,
      maxTokens: options?.maxTokens || config.maxTokens,
    };

    switch (config.provider) {
      case LLMProvider.Anthropic:
        return new ChatAnthropic({
          anthropicApiKey: apiKey,
          modelName: config.modelId,
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens,
        });
      case LLMProvider.OpenAI:
        return new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: config.modelId,
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens,
        });
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }
}