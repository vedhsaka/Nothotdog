import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { AnthropicModel, OpenAIModel, MODEL_CONFIGS } from "./enums";

interface ModelOptions {
  temperature?: number;
  maxTokens?: number;
}

export class ModelFactory {
  static createLangchainModel(modelId: string, apiKey: string, options?: ModelOptions) {
    const defaultConfig = MODEL_CONFIGS[modelId] || {
      maxTokens: 4096,
      temperature: 0.7
    };

    const config = {
      temperature: options?.temperature || defaultConfig.temperature,
      maxTokens: options?.maxTokens || defaultConfig.maxTokens,
    };

    if (modelId.includes('gpt')) {
      return new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelId,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    } else {
      return new ChatAnthropic({
        anthropicApiKey: apiKey,
        modelName: modelId,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    }
  }
}
