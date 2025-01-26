export enum LLMProvider {
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  Azure = 'azure',
}

export enum AnthropicModel {
  Sonnet3_5 = 'claude-3-sonnet-20240229',
  Opus = 'claude-3-opus-20240229',
  Haiku = 'claude-3-haiku-20240307'
}

export enum OpenAIModel {
  GPT3_5Turbo = 'gpt-3.5-turbo',
  GPT4 = 'gpt-4',
  GPT4Turbo = 'gpt-4-turbo'
}