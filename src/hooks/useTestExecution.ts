import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TestRun } from '@/types/ui';
import { TestChat } from '@/types/chat';
import { useTestRuns } from './useTestRuns';
import { storageService } from '@/services/storage/localStorage';
import { ConversationManager } from '@/services/conversation/ConversationManager';
import { TestScenario } from '@/types/test';

export type TestExecutionStatus = 'idle' | 'connecting' | 'running' | 'completed' | 'failed';
export type TestExecutionError = {
  message: string;
  code?: string;
  details?: string;
};

export function useTestExecution() {
  const { addRun, updateRun } = useTestRuns();
  const [status, setStatus] = useState<TestExecutionStatus>('idle');
  const [error, setError] = useState<TestExecutionError | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });

  const executeTest = async (testId: string) => {
    setStatus('connecting');
    setError(null);
    setProgress({ completed: 0, total: 0 });
    
    try {
      const allTests = storageService.getSavedTests();
      console.log('All tests:', allTests);
      
      const testToRun = allTests.find(t => t.id === testId);
      console.log('Test to run:', testToRun);
      
      if (!testToRun) {
        throw new Error('Test configuration not found');
      }

      // Get API key from headers or environment
      console.log("came here");
      const apiKey = testToRun.headers?.['x-api-key'] || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
      console.log("came here 2");
      console.log(apiKey);
      console.log('Using API key:', apiKey ? 'Found' : 'Not found');
      
      if (!apiKey) {
        throw new Error('API key not found in test headers or environment. Please set NEXT_PUBLIC_ANTHROPIC_API_KEY in your .env file');
      }

      const testVariations = storageService.getTestVariations();
      console.log('Test variations:', testVariations);
      
      const variations = testVariations[testId] || [];
      console.log('Variations for test:', variations);
      
      const latestVariation = variations[variations.length - 1];
      console.log('Latest variation:', latestVariation);
      
      if (!latestVariation) {
        throw new Error('No test variations found');
      }

      const scenarios = latestVariation.cases || [];
      console.log('Scenarios to run:', scenarios);
      
      setProgress({ completed: 0, total: scenarios.length });

      const newRun: TestRun = {
        id: uuidv4(),
        name: testToRun.name,
        timestamp: new Date().toISOString(),
        status: 'running',
        metrics: {
          total: scenarios.length,
          passed: 0,
          failed: 0,
          chats: scenarios.length,
          correct: 0,
          incorrect: 0
        },
        chats: []
      };

      addRun(newRun);
      setStatus('running');

      const completedChats = new Map<string, TestChat>();
      
      for (const [index, scenario] of scenarios.entries()) {
        try {
          console.log(`Executing scenario ${index + 1}/${scenarios.length}:`, scenario);
          
          // Create conversation manager with the full test configuration
          const conversation = new ConversationManager(testToRun);
          
          // Convert scenario to TestScenario format
          const testScenario: TestScenario = {
            scenario: scenario.scenario,
            type: 'conversation',
            steps: [{
              id: uuidv4(),
              role: 'user',
              content: scenario.scenario,
              validation: {
                criteria: scenario.validation?.criteria || scenario.expectedOutput,
                stopOnFailure: true
              }
            }],
            metadata: {
              description: `Test case for ${testToRun.name}`,
              success_criteria: {
                min_valid_responses: 1,
                required_context_score: 0.7
              }
            }
          };

          console.log('Created test scenario:', testScenario);
          
          conversation.setConversation(testScenario);
          console.log('Set conversation');
          
          const result = await conversation.executeConversation();
          console.log('Conversation result:', result);
          
          const chat: TestChat = {
            id: uuidv4(),
            scenario: scenario.scenario,
            status: result.success ? 'passed' : 'failed',
            messages: result.history.map(step => ({
              id: step.id,
              role: step.role,
              content: step.role === 'assistant' ? step.response || '' : step.content,
              timestamp: new Date().toISOString(),
              metrics: {
                responseTime: step.metrics?.responseTime || 0,
                validationScore: step.metrics?.validationScore || 0,
                contextRelevance: step.metrics?.contextRelevance || 0
              },
              expectedOutput: step.expectedOutput
            })),
            metrics: {
              responseTime: result.metrics.responseTime,
              validationScores: result.metrics.validationScores,
              contextRelevance: result.metrics.contextRelevance
            },
            timestamp: new Date().toISOString()
          };
          
          completedChats.set(scenario.scenario, chat);
          newRun.metrics.passed += result.success ? 1 : 0;
          newRun.metrics.failed += result.success ? 0 : 1;
          newRun.metrics.correct += result.success ? 1 : 0;
          newRun.metrics.incorrect += result.success ? 0 : 1;
          
          setProgress(prev => ({ ...prev, completed: index + 1 }));
          
        } catch (error: any) {
          const chat: TestChat = {
            id: uuidv4(),
            scenario: scenario.scenario,
            status: 'failed',
            messages: [],
            metrics: { responseTime: [], validationScores: [], contextRelevance: [] },
            timestamp: new Date().toISOString(),
            error: error.message || 'Unknown error occurred'
          };
          
          completedChats.set(scenario.scenario, chat);
          newRun.metrics.failed += 1;
          newRun.metrics.incorrect += 1;
        }

        updateRun({
          ...newRun,
          chats: Array.from(completedChats.values()),
          status: completedChats.size === scenarios.length ? 'completed' : 'running'
        });
      }

      setStatus('completed');
      
    } catch (error: any) {
      console.error('Error executing test:', error);
      setStatus('failed');
      setError({
        message: error.message || 'Test execution failed',
        code: error.code,
        details: error.stack
      });
      throw error;
    }
  };

  const resetState = () => {
    setStatus('idle');
    setError(null);
    setProgress({ completed: 0, total: 0 });
  };

  return {
    executeTest,
    resetState,
    status,
    error,
    progress,
    isExecuting: status === 'connecting' || status === 'running'
  };
} 