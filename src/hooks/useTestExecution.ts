import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TestMessage, TestRun } from '@/types/runs';
import { ChatMessage, TestChat } from '@/types/chat';
import { useTestRuns } from './useTestRuns';
import { QaAgent } from '@/services/agents/claude/qaAgent';
import { AnthropicModel } from '@/services/llm/enums';

export type TestExecutionStatus = 'idle' | 'connecting' | 'running' | 'completed' | 'failed';
export type TestExecutionError = {
  message: string;
  code?: string;
  details?: string;
};

export function useTestExecution() {
  // Destructure runs and state management from useTestRuns:
  const { runs, addRun, updateRun, selectedRun, setSelectedRun } = useTestRuns();
  const [status, setStatus] = useState<TestExecutionStatus>('idle');
  const [error, setError] = useState<TestExecutionError | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<TestChat | null>(null);
  
  const [savedAgentConfigs, setSavedAgentConfigs] = useState<Array<{ id: string, name: string }>>([]);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/tools/agent-config");
        const data = await res.json();
        setSavedAgentConfigs(data.map((cfg: any) => ({
          id: cfg.id,
          name: cfg.name
        })));
      } catch (err) {
        console.error("Failed to fetch agent configs:", err);
      }
    }
    fetchAgents();
  }, []);

  const executeTest = async (testId: string) => {
    setStatus('connecting');
    setError(null);
    setProgress({ completed: 0, total: 0 });

    const resTests = await fetch('/api/tools/agent-config');
    const allTests = await resTests.json();

    const resPersonas = await fetch(`/api/persona-mapping?agentId=${testId}`);
    const personaMapping = await resPersonas.json();
    

    const resVariations = await fetch(`/api/tools/test-variations?testId=${testId}`);
    const testVariations = await resVariations.json();

    // const resRules = await fetch(`/api/validation-rules?name=${testToRun.name}`); // Create this endpoint if needed
    // const testRules = await resRules.json();


    const testToRun = allTests.find(t => t.id === testId);
    if (!testToRun) {
      throw new Error('Test configuration not found');
    }
    
    // const testVariations = variations[testId] || [];
    // const latestVariation = testVariations[testVariations.length - 1];
    // if (!latestVariation) {
    //   throw new Error('No test variations found');
    // }
    const scenarios = testVariations.testCases;
    // const scenarios = latestVariation.cases || [];
    const selectedPersonas = personaMapping.personaIds || [];
    const totalRuns = scenarios.length * selectedPersonas.length;

    try {
      setStatus('running');
      setProgress({ completed: 0, total: totalRuns });

      // Create and add a new test run
      const newRun: TestRun = {
        id: uuidv4(),
        name: testToRun.name,
        timestamp: new Date().toISOString(),
        status: 'running',
        metrics: {
          total: totalRuns,
          passed: 0,
          failed: 0,
          chats: totalRuns,
          correct: 0,
          incorrect: 0
        },
        chats: [],
        results: []
      };
      addRun(newRun);

      const completedChats: TestChat[] = [];
      setCurrentMessages([]);

      let completedCount = 0;
      for (const scenario of scenarios) {
        for (const personaId of selectedPersonas) {
          try {
            const agent = new QaAgent({
              headers: { ...testToRun.headers },
              modelId: AnthropicModel.Sonnet3_5,
              endpointUrl: testToRun.agentEndpoint,
              apiConfig: {
                inputFormat: testToRun.input ? JSON.parse(testToRun.input) : {},
                outputFormat: testToRun.expectedOutput ? JSON.parse(testToRun.expectedOutput) : {},
                rules: testRules
              },
              persona: personaId
            });

            const result = await agent.runTest(
              scenario.scenario,
              scenario.expectedOutput || ''
            );

            
            // Instead of manually constructing userMessage and assistantMessage:
            const messagesFromAgent: ChatMessage[] = result.conversation.allMessages.map((msg: TestMessage) => ({
              id: uuidv4(), // or reuse msg.id if available
              role: msg.role as "user" | "assistant", // ensure the role is correctly typed
              content: msg.content,
              timestamp: new Date().toISOString(), // or use msg.timestamp if provided
              metrics: msg.metrics || {
                responseTime: result.validation.metrics.responseTime,
                validationScore: msg.role === "assistant" ? (result.validation.passedTest ? 1 : 0) : 1,
              }
            }));

            // Update the UI conversation with the messages in the correct order:
            setCurrentMessages(prev => [...prev, ...messagesFromAgent]);


            const chat: TestChat = {
              id: uuidv4(),
              name: scenario.scenario,
              scenario: scenario.scenario,
              status: result.validation.passedTest ? 'passed' : 'failed',
              messages: result.conversation.allMessages,
              metrics: {
                correct: result.validation.passedTest ? 1 : 0,
                incorrect: result.validation.passedTest ? 0 : 1,
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

            completedChats.push(chat);
            newRun.metrics.passed += result.validation.passedTest ? 1 : 0;
            newRun.metrics.failed += result.validation.passedTest ? 0 : 1;
            newRun.metrics.correct += result.validation.passedTest ? 1 : 0;
            newRun.metrics.incorrect += result.validation.passedTest ? 0 : 1;
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
            completedChats.push(chat);
          }
          completedCount++;
          setProgress({ completed: completedCount, total: totalRuns });
        }
      }

      newRun.chats = completedChats;
      newRun.status = 'completed';
      updateRun(newRun);
      setSelectedRun(newRun);
      setStatus('completed');      
    } catch (error: any) {
      console.error('Test execution failed:', error);
      setStatus('failed');
      setError({ message: error.message, details: error.stack });
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
    isTyping,
    runs,
    selectedRun,
    setSelectedRun,
    selectedChat,
    setSelectedChat,
    savedAgentConfigs
  };
}
