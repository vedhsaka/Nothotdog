import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TestRun } from '@/types/runs';
import { ChatMessage, TestChat } from '@/types/chat';
import { useTestRuns } from './useTestRuns';
import { storageService } from '@/services/storage/localStorage';
import { QaAgent } from '@/services/agents/claude/qaAgent';
import { Rule } from '@/services/agents/claude/types';
import { AnthropicModel } from '@/services/llm/enums';

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
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const executeTest = async (testId: string) => {
    setStatus('connecting');
    setError(null);
    setProgress({ completed: 0, total: 0 });
    
    try {
      const allTests = storageService.getSavedTests();
      const rules = storageService.getRuleTemplates();
      console.log('All tests:', allTests);
      
      const testToRun = allTests.find(t => t.id === testId);
      console.log('Test to run:', testToRun);
      
      if (!testToRun) {
        throw new Error('Test configuration not found');
      }

      const testVariations = storageService.getTestVariations();
      const variations = testVariations[testId] || [];
      const latestVariation = variations[variations.length - 1];
      
      if (!latestVariation) {
        throw new Error('No test variations found');
      }

      const scenarios = latestVariation.cases || [];
      
      setProgress({ completed: 0, total: scenarios.length });
      
      // Initialize Claude Agent
      const agent = new QaAgent({
        headers: {
          ...testToRun.headers,
        },
        modelId: AnthropicModel.Sonnet3_5,
        endpointUrl: testToRun.agentEndpoint,
        apiConfig: {
          inputFormat: testToRun.input ? JSON.parse(testToRun.input) : {},
          outputFormat: testToRun.expectedOutput ? JSON.parse(testToRun.expectedOutput) : {},
          rules: testToRun.rules.map((rule: Rule) => ({ ...rule, isValid: rule.isValid ?? false }))
        }
      });

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
        chats: [],
        results: []
      };

      addRun(newRun);
      setStatus('running');

      const completedChats = new Map<string, TestChat>();

      setCurrentMessages([]);
      for (const [index, scenario] of scenarios.entries()) {
        try {
          console.log(`Executing scenario ${index + 1}/${scenarios.length}:`, scenario);
          
          // New: Show typing indicator
          setIsTyping(true);
  

          const result = await agent.runTest(
            scenario.scenario,
            scenario.expectedOutput || ''
          );
          const testMessage = result.conversation.humanMessage;
          setCurrentMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'user',
            content: testMessage,
            timestamp: new Date().toISOString(),
            metrics: {
              responseTime: result.validation.metrics.responseTime,
              validationScore: result.validation.passedTest ? 1 : 0
            }
          }]);
          console.log('Test result:', result);

          setIsTyping(false);
          setCurrentMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            content: result.conversation.chatResponse,
            timestamp: new Date().toISOString(),
            metrics: {
              responseTime: result.validation.metrics.responseTime,
              validationScore: result.validation.passedTest ? 1 : 0
            }
          }]);
          
          const chatId = uuidv4();
          const chat: TestChat = {
            id: chatId,
            name: scenario.scenario,
            scenario: scenario.scenario,
            status: result.validation.passedTest ? 'passed' : 'failed',
            messages: result.conversation.allMessages,
            metrics: {
              correct: result.validation.passedTest ? 1 : 0,
              incorrect: result.validation.passedTest? 0 : 1,
              responseTime: [result.validation.metrics.responseTime],
              validationScores: [result.validation.passedTest ? 1 : 0],
              contextRelevance: [1],
              validationDetails: {
                customFailure: !result.validation.passedTest,
                containsFailures: [],
                notContainsFailures: []
              }
            },
            timestamp: new Date().toISOString()
          };
          
          completedChats.set(scenario.scenario, chat);
          newRun.metrics.passed += result.validation.passedTest ? 1 : 0;
          newRun.metrics.failed += result.validation.passedTest ? 0 : 1;
          newRun.metrics.correct += result.validation.passedTest ? 1 : 0;
          newRun.metrics.incorrect += result.validation.passedTest ? 0 : 1;
          
          setProgress(prev => ({ ...prev, completed: index + 1 }));
          
        } catch (error: any) {
          console.error('Error in test execution:', error);
          const chat: TestChat = {
            id: uuidv4(),
            name: scenario.scenario,
            scenario: scenario.scenario,
            status: 'failed',
            messages: [],
            metrics: { 
              correct: 0,
              incorrect: 1,
              responseTime: [], 
              validationScores: [], 
              contextRelevance: [],
              validationDetails: {
                customFailure: true,
                containsFailures: [],
                notContainsFailures: []
              }
            },
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
    isExecuting: status === 'connecting' || status === 'running',
    currentMessages,
    isTyping
  };
}