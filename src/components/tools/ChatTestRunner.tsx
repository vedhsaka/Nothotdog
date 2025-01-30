import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageDisplay } from "@/components/common/MessageDisplay";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TestRun } from '@/types/runs';
import { ChatMessage } from '@/types/chat';
import { useTestExecution } from '@/hooks/useTestExecution';

interface ExtendedTestRun extends TestRun {
  agentEndpoint: string;
  headers: Record<string, string>;
  testCases: TestCase[];
  inputFormat?: string;
}

interface TestCase {
  id: string;
  scenario: string;
  expectedOutput: string;
  sourceTestId: string;
}

export function ChatTestRunner() {
  const [runs, setRuns] = useState<ExtendedTestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<ExtendedTestRun | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<{[key: string]: boolean}>({});
  const { executeTest, isExecuting, error, currentMessages, isTyping } = useTestExecution();

  useEffect(() => {
    loadTestRuns();
  }, []);

  const loadTestRuns = () => {
    const savedTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    if (!savedTests.length) return;
  
    const referenceTest = savedTests[0];
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    
    const newRuns = Object.entries(savedVariations).map(([sourceId, testCases]) => ({
      id: crypto.randomUUID(),
      name: `Test Run for ${sourceId}`,
      timestamp: new Date().toISOString(),
      status: 'running' as const,
      agentEndpoint: referenceTest.agentEndpoint,
      headers: referenceTest.headers,
      inputFormat: referenceTest.input,
      testCases: (testCases as any[]).map(tc => ({
        id: tc.id,
        scenario: tc.scenario,
        expectedOutput: tc.expectedOutput,
        sourceTestId: tc.sourceTestId
      })),
      chats: [],
      metrics: {
        total: 0,
        passed: 0,
        failed: 0,
        chats: 0,
        correct: 0,
        incorrect: 0
      },
      results: []
    }));
  
    setRuns(newRuns);
  };

  const runTests = async (run: ExtendedTestRun) => {
    if (!run.testCases[0]?.sourceTestId) {
      console.error('Missing source test ID');
      return;
    }

    try {
      await executeTest(run.testCases[0].sourceTestId);
    } catch (err) {
      console.error('Failed to execute test:', err);
    }
  };

  const toggleExpanded = (messageKey: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageKey]: !prev[messageKey]
    }));
  };

  const renderCurrentMessages = () => {
    if (!currentMessages.length && !isTyping) return null;
  
    return (
      <Card className="mb-4 border-emerald-500/20 bg-emerald-900/10">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <CardTitle className="text-sm text-emerald-400">Current Execution</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentMessages.map((message: ChatMessage) => (
            <MessageDisplay
              key={message.id}
              role={message.role}
              content={message.content}
              isCorrect={message.metrics?.validationScore ? message.metrics.validationScore >= 0.7 : undefined}
              explanation={message.metrics?.validationScore 
                ? `Response Time: ${message.metrics.responseTime}ms | Score: ${(message.metrics.validationScore * 100).toFixed(0)}%` 
                : undefined}
              isExpanded={expandedMessages[message.id]}
              onToggleExpand={() => toggleExpanded(message.id)}
            />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 p-4 bg-black/20 rounded">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-300" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-12 gap-4">
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
                    "p-2 rounded cursor-pointer hover:bg-black/20 transition-colors",
                    selectedRun?.id === run.id && "bg-black/20"
                  )}
                  onClick={() => setSelectedRun(run)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{run.name}</span>
                    <StatusBadge status={run.status} />
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">
                    {new Date(run.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-9">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{selectedRun?.name || 'Select a test run'}</CardTitle>
            {selectedRun && (
              <Button 
                size="sm"
                onClick={() => runTests(selectedRun)}
                disabled={isExecuting}
              >
                <Play className="w-4 h-4 mr-2" />
                {isExecuting ? 'Running...' : 'Run Tests'}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 text-red-400 rounded">
                {error.message}
              </div>
            )}
            {selectedRun ? (
              <div className="h-[600px] overflow-y-auto pr-4">
                <div className="space-y-4">
                  {selectedRun.chats.flatMap((chat, chatIndex) => 
                    chat.messages.map((message, messageIndex) => (
                      <MessageDisplay
                        key={`${chatIndex}-${messageIndex}`}
                        role={message.role}
                        content={message.content}
                        isCorrect={message.metrics?.validationScore ? message.metrics.validationScore >= 0.7 : undefined}
                        explanation={message.metrics?.validationScore 
                          ? `Validation Score: ${message.metrics.validationScore}` 
                          : undefined}
                        isExpanded={expandedMessages[`${chatIndex}-${messageIndex}`]}
                        onToggleExpand={() => toggleExpanded(`${chatIndex}-${messageIndex}`)}
                      />
                    ))
                  )}
                  {renderCurrentMessages()}
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