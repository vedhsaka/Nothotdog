import { useState, useCallback } from 'react';
import { ModelConfig } from '@/services/llm/types';
import { MODEL_CONFIGS } from '@/services/llm/config';
import { AnthropicModel } from '@/services/llm/enums';

export function useModelConfig() {
  const [selectedModelId, setSelectedModelId] = useState<string>(AnthropicModel.Sonnet3_5);

  const currentConfig = MODEL_CONFIGS[selectedModelId];
  
  return {
    selectedModelId,
    setSelectedModelId,
    currentConfig,
    availableModels: MODEL_CONFIGS
  };
}