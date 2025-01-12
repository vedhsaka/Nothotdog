'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestRun, TestChat } from '@/types/runs';
import { TestScenario } from './types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, ChevronDown, ChevronUp } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { agentTestApi } from '@/lib/api/agentTest';

const generateInputFromScenario = async (scenario: string, inputFormat: string) => {
  return agentTestApi.generateInput(scenario, inputFormat);
};

const validateResponse = async (response: any, expectedOutput: string) => {
  return agentTestApi.validateResponse(response, expectedOutput);
};

function CollapsibleJson({ content }: { content: string }) {
  // Try to parse and format JSON if possible
  let formattedContent = content;
  try {
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, 2);
    }
  } catch (e) {
    // Keep original content if parsing fails
  }

  return (
    <pre className="font-mono text-sm p-4 rounded-lg overflow-auto max-h-[200px]">
      {formattedContent}
    </pre>
  );
}

export function TestRunsDashboard() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [selectedChat, setSelectedChat] = useState<TestChat | null>(null);
  const [savedTests, setSavedTests] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    // Load saved runs
    const savedRuns = JSON.parse(localStorage.getItem('testRuns') || '[]');
    const validatedRuns = savedRuns.map((run: any) => ({
      ...run,
      metrics: {
        total: run.metrics?.total || 0,
        passed: run.metrics?.passed || 0,
        failed: run.metrics?.failed || 0,
        chats: run.metrics?.chats || 0
      },
      chats: (run.chats || []).map((chat: any) => ({
        ...chat,
        metrics: {
          correct: chat.metrics?.correct || 0,
          incorrect: chat.metrics?.incorrect || 0
        },
        messages: chat.messages || []
      }))
    }));
    setRuns(validatedRuns);

    // Load saved tests
    const tests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    setSavedTests(tests.map((test: any) => ({
      id: test.id,
      name: test.name || 'Unnamed Test'
    })));
  }, []);

  const runTest = async (testId: string) => {
    // Find the test details and its variations from localStorage
    const allTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    const testToRun = allTests.find((t: any) => t.id === testId);
    
    if (!testToRun) {
      console.error('Test not found');
      return;
    }

    // Get all variations for this test
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    const testVariations = savedVariations[testId] || [];
    const latestVariation = testVariations[testVariations.length - 1];
    const scenarios = latestVariation?.cases || [];

    // Create a new test run
    const newRun: TestRun = {
      id: uuidv4(),
      name: testToRun.name,
      timestamp: new Date().toISOString(),
      status: 'running',
      metrics: {
        total: scenarios.length,
        passed: 0,
        failed: 0,
        chats: scenarios.length
      },
      chats: [],
      results: []
    };

    // Add run to state immediately to show it in the UI
    setRuns(prev => [newRun, ...prev]);

    const updateRunInState = (updatedRun: TestRun) => {
      // Update React state
      setRuns(prev => {
        const existingRunIndex = prev.findIndex(run => run.id === updatedRun.id);
        if (existingRunIndex === -1) {
          return [updatedRun, ...prev];
        }
        return prev.map(run => run.id === updatedRun.id ? updatedRun : run);
      });
      
      // Update localStorage
      const existingRuns = JSON.parse(localStorage.getItem('testRuns') || '[]');
      const existingRunIndex = existingRuns.findIndex((run: TestRun) => run.id === updatedRun.id);
      
      let updatedRuns;
      if (existingRunIndex === -1) {
        // New run - add to start
        updatedRuns = [updatedRun, ...existingRuns];
      } else {
        // Update existing run
        updatedRuns = existingRuns.map((run: TestRun) => 
          run.id === updatedRun.id ? updatedRun : run
        );
      }
      
      localStorage.setItem('testRuns', JSON.stringify(updatedRuns));
    };

    try {
      // Create a Map to track completed chats
      const completedChats = new Map<string, TestChat>();

      // Run scenarios in parallel
      const scenarioPromises = scenarios.map(async (scenario: TestScenario) => {
        const chat: TestChat = {
          id: uuidv4(),
          name: scenario.scenario,
          messages: [],
          metrics: {
            correct: 0,
            incorrect: 0
          }
        };

        // Add initial user message to show progress
        chat.messages.push({
          id: uuidv4(),
          role: 'user',
          content: 'Generating input...',
          expectedOutput: scenario.expectedOutput
        });

        // Update UI immediately to show the chat started
        completedChats.set(chat.id, chat);
        newRun.chats = Array.from(completedChats.values());
        updateRunInState({...newRun});

        try {
          // Generate input
          const generatedInput = await generateInputFromScenario(scenario.scenario, testToRun.input);
          
          // Update user message with generated input
          chat.messages[0].content = generatedInput;
          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          updateRunInState({...newRun});

          // Make API call to the agent
          const response = await fetch(testToRun.agentEndpoint, {
            method: 'POST',
            headers: {
              ...testToRun.headers,
              'Content-Type': 'application/json'
            },
            body: generatedInput
          });

          if (!response.ok) {
            throw new Error(`Agent request failed: ${response.status}`);
          }

          const agentResponse = await response.json();
          
          // Add pending validation message
          chat.messages.push({
            id: uuidv4(),
            role: 'assistant',
            content: JSON.stringify(agentResponse, null, 2),
            isCorrect: false,
            explanation: 'Validating response...'
          });
          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          updateRunInState({...newRun});
          
          // Validate the response using LLM
          const validation = await validateResponse(agentResponse, scenario.expectedOutput);
          
          // Update agent's response with validation results
          chat.messages[1] = {
            ...chat.messages[1],
            isCorrect: validation.isCorrect,
            explanation: validation.explanation
          };

          // Update metrics
          if (validation.isCorrect) {
            chat.metrics.correct += 1;
            newRun.metrics.passed += 1;
          } else {
            chat.metrics.incorrect += 1;
            newRun.metrics.failed += 1;
          }

          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          updateRunInState({...newRun});

        } catch (error) {
          console.error('Scenario test failed:', error);
          chat.messages.push({
            id: uuidv4(),
            role: 'assistant',
            content: 'Error: Failed to get response from agent',
            isCorrect: false,
            explanation: 'Test execution failed'
          });
          chat.metrics.incorrect += 1;
          newRun.metrics.failed += 1;
          
          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          updateRunInState({...newRun});
        }

        return chat;
      });

      // Wait for all scenarios to complete
      await Promise.all(scenarioPromises);
      
      // Update final run status
      newRun.status = 'completed';
      updateRunInState({...newRun});
      
    } catch (error) {
      console.error('Test run failed:', error);
      newRun.status = 'failed';
      updateRunInState({...newRun});
    }
  };

  if (selectedChat) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedChat(null)}>
            ← Back to Run
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-green-500">{selectedChat.metrics.correct} Correct</span>
            <span className="text-red-500">{selectedChat.metrics.incorrect} Incorrect</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">{selectedChat.name}</h2>
          <p className="text-sm text-zinc-400">View conversation and responses</p>
        </div>

        <div className="space-y-6">
          {selectedChat.messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {message.role === 'user' ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1 overflow-hidden bg-zinc-800/50 rounded-lg">
                    <CollapsibleJson content={message.content} />
                  </div>
                  <div className="w-8 flex-shrink-0" />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-3 justify-end">
                    <div className="w-8 flex-shrink-0" />
                    <div className="flex-1 overflow-hidden bg-black/20 rounded-lg">
                      <CollapsibleJson content={message.content} />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">🤖</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-end mr-11">
                    <Badge variant={message.isCorrect ? "outline" : "destructive"} className={message.isCorrect ? "bg-green-500/10" : "bg-red-500/10"}>
                      {message.isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                    {message.explanation && (
                      <span className="text-sm text-zinc-400">{message.explanation}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedRun) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setSelectedRun(null)}>
              ← Back to Runs
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10">
              {selectedRun.metrics.passed} Passed
            </Badge>
            <Badge variant="outline" className="bg-red-500/10">
              {selectedRun.metrics.failed} Failed
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Run #{selectedRun.name}</h2>
          <p className="text-sm text-zinc-400">All conversations in this test run</p>
        </div>

        <div className="space-y-2">
          {(selectedRun.chats || []).map((chat) => (
            <div 
              key={chat.id} 
              className="flex items-center p-4 bg-black/20 border border-zinc-800 rounded-lg cursor-pointer hover:bg-black/30"
              onClick={() => setSelectedChat(chat)}
            >
              <div className="w-[60%] truncate">
                <h3 className="font-medium truncate">{chat.name}</h3>
                <p className="text-sm text-zinc-400">
                  {chat.messages.length} messages
                </p>
              </div>

              <div className="w-[40%] flex items-center justify-end gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-green-500">{chat.metrics.correct}</span>
                  <span className="text-zinc-400">Correct</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500">{chat.metrics.incorrect}</span>
                  <span className="text-zinc-400">Incorrect</span>
                </div>
                <span className="text-zinc-400">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Test Runs</h2>
          <p className="text-sm text-zinc-400">History of all test executions</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Run Test
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="cursor-pointer">
            {savedTests.length > 0 ? (
              savedTests.map((test) => (
                <DropdownMenuItem 
                  key={test.id}
                  onSelect={() => runTest(test.id)}
                  className="cursor-pointer"
                >
                  {test.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>
                No saved tests found
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {runs.map((run) => (
          <div 
            key={run.id} 
            className="flex items-center p-4 bg-black/20 border border-zinc-800 rounded-lg cursor-pointer hover:bg-black/30"
            onClick={() => setSelectedRun(run)}
          >
            <div className="w-[30%] flex items-center gap-2">
              <span className="font-medium">{run.name}</span>
              <span className="text-zinc-400 text-sm">
                {new Date(run.timestamp).toLocaleString()}
              </span>
            </div>
            
            <div className="w-[50%] flex items-center gap-4">
              <span className="text-zinc-400">Tests: {run.metrics.total || 0}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-green-500">✓</span>
                  <span>{run.metrics.passed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-500">✗</span>
                  <span>{run.metrics.failed}</span>
                </div>
              </div>
            </div>

            <div className="w-[20%] flex items-center justify-end gap-2">
              <Badge>{run.status}</Badge>
              <span className="text-zinc-400">→</span>
            </div>
          </div>
        ))}

        {runs.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No test runs yet. Generate and run some tests to get started.
          </div>
        )}
      </div>
    </div>
  );
} 