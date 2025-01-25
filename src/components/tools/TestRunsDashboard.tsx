'use client';

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestRun, TestMessage } from '@/types/runs';
import { TestChat } from '@/types/chat'
import { TestScenario } from '@/types/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { ClaudeAgent } from '@/services/agents/claude/claudeAgent';

function CollapsibleJson({ content }: { content: string }) {
  let formattedContent = content;
  try {
    if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, 2);
      return (
        <pre className="font-mono text-sm p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-w-full">
          {formattedContent}
        </pre>
      );
    }
    return (
      <div className="p-4 whitespace-pre-wrap text-sm max-w-full">
        {content}
      </div>
    );
  } catch (e) {
    return (
      <div className="p-4 whitespace-pre-wrap text-sm max-w-full">
        {content}
      </div>
    );
  }
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
    const allTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    const testToRun = allTests.find((t: any) => t.id === testId);
    
    if (!testToRun) {
      console.error('Test not found');
      return;
    }
  
    const apiKey = testToRun.headers?.['x-api-key'] || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('API key not found');
      return;
    }
  
    const agent = new ClaudeAgent({
      headers: {
        ...testToRun.headers,
      },
      endpointUrl: testToRun.agentEndpoint,
      apiConfig: {
        inputFormat: JSON.parse(testToRun.input || '{}'),
        outputFormat: JSON.parse(testToRun.output || '{}'),
        rules: testToRun.rules || []
      }
    });
  
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    const testVariations = savedVariations[testId] || [];
    const latestVariation = testVariations[testVariations.length - 1];
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
      chats: [],
      results: []
    };
  
    setRuns(prev => [newRun, ...prev]);
  
    try {
      const completedChats = new Map<string, TestChat>();
  
      const scenarioPromises = scenarios.map(async (scenario: TestScenario) => {
        const chatId = uuidv4();
        const chat: TestChat = {
          id: chatId,
          name: scenario.scenario,
          scenario: scenario.scenario,
          status: 'running',
          messages: [],
          metrics: {
            correct: 0,
            incorrect: 0,
            responseTime: [],
            validationScores: [],
            contextRelevance: [],
            validationDetails: {
              customFailure: false,
              containsFailures: [],
              notContainsFailures: []
            }
          },
          timestamp: new Date().toISOString()
         };
      
        // Create a new agent for this scenario
        const scenarioAgent = new ClaudeAgent({
          headers: {
            ...testToRun.headers,
          },
          endpointUrl: testToRun.agentEndpoint,
          apiConfig: {
            inputFormat: JSON.parse(testToRun.input || '{}'),
            outputFormat: JSON.parse(testToRun.output || '{}'),
            rules: testToRun.rules || []
          }
        });
      
        try {
          // Make the API call
          const result = await scenarioAgent.runTest(
            scenario.scenario,
            scenario.expectedOutput || ''
          );

          // Add all request and response messages
          // result.conversation.allMessages.forEach((msg: TestMessage) => {
          //   chat.messages.push(
          //     {
          //       id: uuidv4(),
          //       chatId: chatId,
          //       role: 'user',
          //       content: JSON.stringify(msg.rawInput, null, 2),
          //       isCorrect: true,
          //       explanation: "API Request"
          //     },
          //     {
          //       id: uuidv4(),
          //       chatId: chatId,
          //       role: 'assistant',
          //       content: JSON.stringify(msg.rawOutput, null, 2),
          //       isCorrect: result.validation.passedTest,
          //       explanation: `Response Time: ${result.validation.metrics.responseTime}ms`
          //     }
          //   );
          // });

          messages: result.conversation.allMessages.map(msg => ({
            id: uuidv4(),
            chatId: chatId,
            role: 'user',
            content: msg.content,
            isCorrect: true,
            metrics: {
              responseTime: result.validation.metrics.responseTime
            }
          }))
      
          // Update metrics and store chat
          chat.metrics.correct = result.validation.passedTest ? 1 : 0;
          chat.metrics.incorrect = result.validation.passedTest ? 0 : 1;
          
          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          newRun.metrics.passed += result.validation.passedTest ? 1 : 0;
          newRun.metrics.failed += result.validation.passedTest ? 0 : 1;
          
          setRuns(prev => prev.map(run => 
            run.id === newRun.id ? {...newRun} : run
          ));
      
        } catch (error) {
          console.error('Scenario test failed:', error);
          chat.messages.push({
            id: uuidv4(),
            chatId: chatId,
            role: 'assistant',
            content: 'Error: Failed to execute conversation',
            isCorrect: false,
            explanation: 'Test execution failed'
          });
          chat.metrics.incorrect += 1;
          newRun.metrics.failed += 1;
          
          completedChats.set(chat.id, {...chat});
          newRun.chats = Array.from(completedChats.values());
          setRuns(prev => prev.map(run => 
            run.id === newRun.id ? {...newRun} : run
          ));
        }
      
        return chat;
      });
  
      await Promise.all(scenarioPromises);
      
      newRun.status = 'completed';
      setRuns(prev => prev.map(run => 
        run.id === newRun.id ? {...newRun} : run
      ));
      
    } catch (error) {
      console.error('Test run failed:', error);
      newRun.status = 'failed';
      setRuns(prev => prev.map(run => 
        run.id === newRun.id ? {...newRun} : run
      ));
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

        <div className="space-y-6 max-w-[800px] mx-auto">
          {selectedChat.messages.map((message: TestMessage) => (
            <div key={message.id} className="space-y-2">
              {message.role === 'user' ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="bg-blue-500/20 rounded-lg">
                      <CollapsibleJson content={message.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 overflow-hidden">
                    <div className="bg-emerald-500/10 rounded-lg">
                      <CollapsibleJson content={message.content} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge 
                        variant={message.isCorrect ? "outline" : "destructive"} 
                        className={message.isCorrect ? "bg-green-500/10" : "bg-red-500/10"}
                      >
                        {message.isCorrect ? "Correct" : "Incorrect"}
                      </Badge>
                      {message.explanation && (
                        <span className="text-xs text-zinc-400">
                          {message.explanation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">🤖</span>
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