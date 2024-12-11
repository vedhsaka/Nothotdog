import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, X, Check, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestCase {
  id: string;
  input: { query: string } | string;
  expectedOutput: string;
  description: string;
  category?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
}

type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';

interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: TestRunStatus;
  agentEndpoint: string;
  headers: Record<string, string>;
  testCases: TestCase[];
  messages: ChatMessage[];
}

interface AgentConfig {
  agentEndpoint: string;
  headers: Record<string, string>;
}

export function ChatTestRunner() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadTestRuns();
  }, []);

  const loadTestRuns = () => {
    // Load agent configuration
    const agentConfig = (JSON.parse(localStorage.getItem('savedTests') || '[]')[0] || {}) as AgentConfig;
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}') as Record<string, TestCase[]>;
    
    // Create test runs from saved variations
    const newRuns = Object.entries(savedVariations).map(([sourceId, testCases]) => ({
      id: crypto.randomUUID(),
      name: `Test Run for ${sourceId}`,
      timestamp: new Date().toISOString(),
      status: 'pending' as TestRunStatus,
      agentEndpoint: agentConfig.agentEndpoint || '',
      headers: agentConfig.headers || {},
      testCases: testCases,
      messages: [] as ChatMessage[]
    }));

    setRuns(newRuns);
  };

  const runTests = async (run: TestRun) => {
    if (!run.agentEndpoint) {
      console.error('No agent endpoint configured');
      return;
    }

    setIsRunning(true);
    const updatedRun: TestRun = {
      ...run,
      status: 'running',
      messages: []
    };
    setSelectedRun(updatedRun);

    try {
      for (const testCase of run.testCases) {
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: typeof testCase.input === 'object' ? testCase.input.query : testCase.input,
          expectedOutput: testCase.expectedOutput
        };
        updatedRun.messages = [...updatedRun.messages, userMessage];
        setSelectedRun({ ...updatedRun });

        try {
          // Send request to agent
          const response = await fetch(run.agentEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...run.headers
            },
            body: JSON.stringify(testCase.input)
          });

          if (!response.ok) {
            throw new Error(`Agent request failed: ${response.statusText}`);
          }

          const agentResponse = await response.json();

          // Validate response with Claude
          const validationResponse = await fetch('/api/tools/validate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actualResponse: agentResponse.response.text,
              expectedOutput: testCase.expectedOutput,
              context: testCase.description || 'Weather query response validation'
            })
          });

          if (!validationResponse.ok) {
            throw new Error('Validation request failed');
          }

          const validation = await validationResponse.json();

          // Add assistant message with validation
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: agentResponse.response.text,
            isCorrect: validation.isCorrect,
            explanation: validation.explanation
          };
          updatedRun.messages = [...updatedRun.messages, assistantMessage];
          setSelectedRun({ ...updatedRun });

        } catch (error) {
          console.error('Test execution error:', error);
          const errorMessage: ChatMessage = {
            role: 'assistant',
            content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
            isCorrect: false
          };
          updatedRun.messages = [...updatedRun.messages, errorMessage];
          setSelectedRun({ ...updatedRun });
        }
      }

      // Update run status
      updatedRun.status = 'completed';
      setSelectedRun(updatedRun);
      setRuns(prev => prev.map(r => r.id === run.id ? updatedRun : r));

      // Save results
      const savedRuns = JSON.parse(localStorage.getItem('testRuns') || '[]');
      localStorage.setItem('testRuns', JSON.stringify([...savedRuns, updatedRun]));
    } catch (error) {
      console.error('Run failed:', error);
      updatedRun.status = 'failed';
      setSelectedRun(updatedRun);
      setRuns(prev => prev.map(r => r.id === run.id ? updatedRun : r));
    }

    setIsRunning(false);
  };

  const toggleExpanded = (messageIndex: number) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Test Runs List */}
      <div className="col-span-3">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader>
            <CardTitle>Test Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.map((run) => (
                <div
                  key={run.id}
                  className={cn(
                    "p-4 rounded-lg cursor-pointer transition-colors",
                    selectedRun?.id === run.id 
                      ? "bg-black/60 border border-zinc-700" 
                      : "bg-black/20 hover:bg-black/30"
                  )}
                  onClick={() => setSelectedRun(run)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{run.name}</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {new Date(run.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant={run.status === 'completed' ? 'default' : 'secondary'}
                      className={cn(
                        run.status === 'running' && 'bg-yellow-500/20 text-yellow-400',
                        run.status === 'failed' && 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {run.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {runs.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  No test runs available. Create test cases first.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="col-span-9">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedRun?.name || 'Select a test run'}</CardTitle>
            {selectedRun && (
              <Button 
                size="sm"
                onClick={() => runTests(selectedRun)}
                disabled={isRunning}
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? 'Running...' : 'Run Tests'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedRun ? (
              <div className="h-[600px] overflow-y-auto pr-4">
                <div className="space-y-4">
                  {selectedRun.messages.map((message, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <div className={cn(
                        "flex gap-3 max-w-[80%]",
                        message.role === 'assistant' ? "ml-auto flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
                          message.role === 'user' ? "bg-zinc-700" : "bg-emerald-600"
                        )}>
                          {message.role === 'user' ? 'U' : 'A'}
                        </div>
                        <div className={cn(
                          "rounded-lg p-4",
                          message.role === 'user' 
                            ? "bg-zinc-800" 
                            : "bg-emerald-900/50"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          {message.role === 'assistant' && message.isCorrect !== undefined && (
                            <div className="flex items-center gap-2 mt-2">
                              {message.isCorrect ? (
                                <Badge variant="default" className="bg-emerald-500/20 text-emerald-400">
                                  <Check className="w-3 h-3 mr-1" />
                                  Correct
                                </Badge>
                              ) : (
                                <Badge variant="default" className="bg-red-500/20 text-red-400">
                                  <X className="w-3 h-3 mr-1" />
                                  Incorrect
                                </Badge>
                              )}
                            </div>
                          )}
                          {message.explanation && (
                            <p className="text-sm text-zinc-400 mt-2">
                              {message.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {message.expectedOutput && (
                        <div className="flex items-center gap-2 ml-11">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => toggleExpanded(index)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {expandedMessages[index] ? 'Hide Expected' : 'View Expected'}
                          </Button>
                          {expandedMessages[index] && (
                            <p className="text-sm text-zinc-400">{message.expectedOutput}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[600px] text-zinc-500">
                Select a test run to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ChatTestRunner;