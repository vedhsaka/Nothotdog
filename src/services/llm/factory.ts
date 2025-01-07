import { LLMService, LLMConfig } from './types';
import { ClaudeLLM } from './claude';

export type LLMProvider = 'claude';

export class LLMFactory {
  private static instances: Map<string, LLMService> = new Map();

  static getInstance(provider: LLMProvider = 'claude', config?: LLMConfig): LLMService {
    const key = `${provider}-${config?.apiKey || 'default'}`;
    
    if (!this.instances.has(key)) {
      switch (provider) {
        case 'claude':
          this.instances.set(key, new ClaudeLLM(config));
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    }

    return this.instances.get(key)!;
  }

  static clearInstances() {
    this.instances.clear();
  }
} 