import { getModelProvider } from '@/utils/modelUtils';
import { LLMProvider } from '@/services/llm/enums';

interface LLMConfig {
  provider: string;
  model: string;
  apiKey: string;
}

export function getLLMConfigForActiveModel(headers: Headers): LLMConfig | null {
  const activeModel = headers.get('active-model');
  if (!activeModel) return null;

  const provider = getModelProvider(activeModel);
  const llmConfigStr = headers.get('llm-config');
  if (!llmConfigStr) return null;

  try {
    const llmConfig = JSON.parse(llmConfigStr);
    const apiKey = llmConfig[provider];

    if (!apiKey) return null;

    return {
      provider,
      model: activeModel,
      apiKey
    };
  } catch {
    return null;
  }
}