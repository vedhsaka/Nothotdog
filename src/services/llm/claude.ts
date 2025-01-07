import Anthropic from '@anthropic-ai/sdk';
import { LLMService, Message, LLMConfig, LLMResponse } from './types';

export enum ClaudeModel {
  OPUS = 'claude-3-opus-20240229',
  SONNET = 'claude-3-sonnet-20240229',
  HAIKU = 'claude-3-haiku-20240307',
  SONNET3_5 = 'claude-3-5-sonnet-20241022',
  HAIKU3_5 = 'claude-3-5-haiku-20241022'
}

const DEFAULT_MODEL = ClaudeModel.SONNET3_5;
const DEFAULT_MAX_TOKENS = 1024;

type AnthropicModel = Parameters<typeof Anthropic.prototype.messages.create>[0]['model'];

export class ClaudeLLM implements LLMService {
  private client: Anthropic;
  private defaultConfig: LLMConfig;

  constructor(config: LLMConfig = {}) {
    if (!config.apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Missing Anthropic API key');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    });

    // Validate model if provided
    if (config.model && !Object.values(ClaudeModel).includes(config.model as ClaudeModel)) {
      throw new Error(`Invalid Claude model: ${config.model}. Valid models are: ${Object.values(ClaudeModel).join(', ')}`);
    }

    this.defaultConfig = {
      model: config.model || DEFAULT_MODEL,
      maxTokens: config.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: config.temperature || 0.7,
    };
  }

  async chat(messages: Message[], config?: Partial<LLMConfig>): Promise<LLMResponse> {
    // Validate model if provided in config
    if (config?.model && !Object.values(ClaudeModel).includes(config.model as ClaudeModel)) {
      throw new Error(`Invalid Claude model: ${config.model}. Valid models are: ${Object.values(ClaudeModel).join(', ')}`);
    }

    const response = await this.client.messages.create({
      model: (config?.model || this.defaultConfig.model) as AnthropicModel,
      max_tokens: config?.maxTokens || this.defaultConfig.maxTokens || DEFAULT_MAX_TOKENS,
      temperature: config?.temperature || this.defaultConfig.temperature || 0.7,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    });

    return {
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
    };
  }

  async complete(prompt: string, config?: Partial<LLMConfig>): Promise<LLMResponse> {
    return this.chat([{ role: 'user', content: prompt }], config);
  }
} 