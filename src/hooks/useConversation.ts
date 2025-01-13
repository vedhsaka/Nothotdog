import { useState, useCallback, useEffect } from 'react';
import { ConversationManager } from '@/services/conversation/ConversationManager';
import { ConversationStep, TestScenario, ConversationContext } from '@/types/test';

interface UseConversationProps {
  apiKey: string;
  onMetricsUpdate?: (metrics: ConversationContext['metrics']) => void;
}

export const useConversation = ({ apiKey, onMetricsUpdate }: UseConversationProps) => {
  console.log("apiKey", apiKey);
  const [manager] = useState(() => new ConversationManager({
    id: 'default',
    name: 'Default Test',
    agentEndpoint: 'https://api.anthropic.com/v1/messages',
    input: '',
    headers: {
      'x-api-key': apiKey
    }
  }));
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<ConversationStep | null>(null);
  const [history, setHistory] = useState<ConversationStep[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const startConversation = useCallback(async (scenario: TestScenario) => {
    setIsRunning(true);
    setError(null);
    setHistory([]);
    
    try {
      manager.setConversation(scenario);
      const result = await manager.executeConversation();
      
      setHistory(result.history);
      if (onMetricsUpdate) {
        onMetricsUpdate(result.metrics);
      }
      
      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      return false;
    } finally {
      setIsRunning(false);
    }
  }, [manager, onMetricsUpdate]);

  const executeStep = useCallback(async (step: ConversationStep) => {
    setCurrentStep(step);
    setError(null);
    
    try {
      const result = await manager.executeStep(step);
      setHistory(prev => [...prev, { ...step, response: result.response, metrics: result.metrics }]);
      
      if (onMetricsUpdate) {
        const prevMetrics = history[history.length - 1]?.metrics;
        onMetricsUpdate({
          responseTime: [result.metrics.responseTime],
          validationScores: [result.metrics.validationScore],
          contextRelevance: [result.metrics.contextRelevance]
        });
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      throw err;
    } finally {
      setCurrentStep(null);
    }
  }, [manager, history, onMetricsUpdate]);

  return {
    isRunning,
    currentStep,
    history,
    error,
    startConversation,
    executeStep
  };
}; 