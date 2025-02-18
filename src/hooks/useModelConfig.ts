import { useState, useEffect, useCallback } from 'react';
import { ModelConfig } from '@/services/llm/types';
import { MODEL_CONFIGS } from '@/services/llm/config';
import { AnthropicModel, OpenAIModel } from '@/services/llm/enums';
import { getModelProvider, castToModelType } from "@/utils/modelUtils";

export function useModelConfig() {
  const [selectedModelId, setSelectedModelId] = useState<AnthropicModel | OpenAIModel>(AnthropicModel.Sonnet3_5);

  useEffect(() => {
    const savedModel = localStorage.getItem('active_model');
    if (savedModel) {
      setSelectedModelId(castToModelType(savedModel));
    }
  }, []);

  const handleModelChange = useCallback((modelId: AnthropicModel | OpenAIModel) => {
    setSelectedModelId(modelId);
    localStorage.setItem('active_model', modelId);

    const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}');
    const provider = getModelProvider(modelId);
    
    if (!llmConfig[provider]) {
      console.warn(`No API key found for ${provider}`);
    }
  }, []);

  const currentConfig = MODEL_CONFIGS[selectedModelId];

  const getApiKeyForCurrentModel = useCallback(() => {
    const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}');
    const provider = getModelProvider(selectedModelId);
    return llmConfig[provider];
  }, [selectedModelId]);
  
  return {
    selectedModelId,
    setSelectedModelId: handleModelChange,
    currentConfig,
    availableModels: MODEL_CONFIGS,
    getApiKeyForCurrentModel
  };
}