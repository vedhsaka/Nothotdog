import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TestRun } from '@/types/ui';
import { TestChat } from '@/types/chat';
import { SavedTest, TestScenario } from '@/types/test';
import { toolsService } from '@/services/api/tools';
import { useTestRuns } from './useTestRuns';
import { storageService } from '@/services/storage/localStorage';

export function useTestExecution() {
  const { addRun, updateRun } = useTestRuns();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeTest = async (testId: string) => {
    setIsExecuting(true);
    
    try {
      const allTests = storageService.getSavedTests();
      const testToRun = allTests.find(t => t.id === testId);
      
      if (!testToRun) {
        throw new Error('Test not found');
      }

      const testVariations = storageService.getTestVariations();
      const variations = testVariations[testId] || [];
      const latestVariation = variations[variations.length - 1];
      const scenarios = latestVariation?.cases || [];

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

      const completedChats = new Map<string, TestChat>();
      await Promise.all(scenarios.map(scenario => executeScenario(scenario, testToRun, newRun, completedChats)));

      newRun.status = 'completed';
      updateRun(newRun);
      
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const executeScenario = async (
    scenario: TestScenario, 
    test: SavedTest, 
    run: TestRun,
    completedChats: Map<string, TestChat>
  ) => {
    const chat: TestChat = {
      id: uuidv4(),
      name: scenario.scenario,
      messages: [],
      metrics: {
        correct: 0,
        incorrect: 0
      }
    };

    // Add initial message
    chat.messages.push({
      id: uuidv4(),
      role: 'user',
      content: 'Generating input...',
      expectedOutput: scenario.expectedOutput
    });

    updateChatState(chat, run, completedChats);

    try {
      // Generate input
      const generatedInput = await toolsService.generateInput(scenario.scenario, test.input);
      chat.messages[0].content = generatedInput;
      updateChatState(chat, run, completedChats);

      // Execute test
      const response = await toolsService.evaluateAgent(test.agentEndpoint, JSON.parse(generatedInput), test.headers);

      // Add response message
      chat.messages.push({
        id: uuidv4(),
        role: 'assistant',
        content: JSON.stringify(response, null, 2),
        isCorrect: false,
        explanation: 'Validating response...'
      });

      updateChatState(chat, run, completedChats);
      
      // Validate response
      const validation = await toolsService.validateResponse(response, scenario.expectedOutput);
      
      // Update metrics
      chat.messages[1] = {
        ...chat.messages[1],
        isCorrect: validation.isCorrect,
        explanation: validation.explanation
      };

      if (validation.isCorrect) {
        chat.metrics.correct += 1;
        run.metrics.passed += 1;
      } else {
        chat.metrics.incorrect += 1;
        run.metrics.failed += 1;
      }

      updateChatState(chat, run, completedChats);

    } catch (error) {
      handleScenarioError(error, chat, run, completedChats);
    }
  };

  const updateChatState = (
    chat: TestChat, 
    run: TestRun, 
    completedChats: Map<string, TestChat>
  ) => {
    completedChats.set(chat.id, {...chat});
    run.chats = Array.from(completedChats.values());
    updateRun({...run});
  };

  const handleScenarioError = (
    error: unknown,
    chat: TestChat,
    run: TestRun,
    completedChats: Map<string, TestChat>
  ) => {
    console.error('Scenario failed:', error);
    chat.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: 'Error: Failed to get response from agent',
      isCorrect: false,
      explanation: error instanceof Error ? error.message : 'Unknown error'
    });

    chat.metrics.incorrect += 1;
    run.metrics.failed += 1;
    
    updateChatState(chat, run, completedChats);
  };

  return {
    executeTest,
    isExecuting
  };
} 