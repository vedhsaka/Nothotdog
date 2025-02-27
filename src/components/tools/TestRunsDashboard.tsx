"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestMessage } from "@/types/runs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, ChevronDown } from "lucide-react";
import { useTestExecution } from "@/hooks/useTestExecution";
import WarningDialog from "@/components/config/WarningDialog";

function CollapsibleJson({ content }: { content: string }) {
  let formattedContent = content;
  try {
    if (
      typeof content === "string" &&
      (content.startsWith("{") || content.startsWith("["))
    ) {
      const parsed = JSON.parse(content);
      formattedContent = JSON.stringify(parsed, null, 2);
      return (
        <pre className="font-mono text-sm p-4 rounded-[var(--radius)] overflow-x-auto whitespace-pre-wrap max-w-full">
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
  const {
    runs,
    selectedRun,
    setSelectedRun,
    selectedChat,
    setSelectedChat,
    savedAgentConfigs,
    executeTest
  } = useTestExecution();

  const [showWarningDialog, setShowWarningDialog] = useState(false); // State to control the WarningDialog dialog
  const [testIdToExecute, setTestIdToExecute] = useState<string | null>(null); // State to store the test ID to execute after API key check

  // Wrap the original executeTest function
  // const executeTest = useCallback(
  //   async (testId: string) => {
  //     const apiKey = localStorage.getItem("anthropic_api_key");
  //     if (!apiKey) {
  //       // alert("API key is missing");
  //       setShowWarningDialog(true); // Show the warning dialog if API key is missing
  //       setTestIdToExecute(testId); // Store the test ID to execute later
  //       return; // **Crucially, RETURN here to prevent further execution!**
  //     }

  //     try {
  //       await baseExecuteTest(testId); // Call the original executeTest function
  //     } catch (error: any) {
  //       // More robust error checking
  //       if (error && typeof error === "object") {
  //         const errorMessage = (
  //           error.message || error.toString()
  //         ).toLowerCase();

  //         if (
  //           errorMessage.includes("401") &&
  //           errorMessage.includes("invalid x-api-key")
  //         ) {
  //           setShowWarningDialog(true);
  //           setTestIdToExecute(testId);
  //         } else {
  //           console.error("Error in test execution:", error);
  //         }
  //       } else {
  //         // Handle cases where the error is not an object with a message property
  //         console.error("Unexpected error format:", error);
  //       }
  //     }
  //   },
  //   [baseExecuteTest]
  // );

  // Function to be called after the WarningDialog dialog is closed
  const onWarningDialogClose = useCallback(() => {
    setShowWarningDialog(false);
    // If a test ID was stored, execute the test
    if (testIdToExecute) {
      executeTest(testIdToExecute); // Use the wrapped executeTest
      setTestIdToExecute(null); // Clear the stored test ID
    }
  }, [executeTest, testIdToExecute]);

  if (selectedChat) {
    return (
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedChat(null)}>
            ← Back to Run
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-green-500">
              {selectedChat.metrics.correct} Correct
            </span>
            <span className="text-red-500">
              {selectedChat.metrics.incorrect} Incorrect
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold">{selectedChat.name}</h2>
          <p className="text-sm text-zinc-400">
            View conversation and responses
          </p>
        </div>

        <div className="space-y-6 max-w-[800px] mx-auto">
          {selectedChat.messages.map((message: TestMessage) => (
            <div key={message.id} className="space-y-2">
              {message.role === "user" ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">👤</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="bg-blue-500/20 rounded-[var(--radius)]">
                      <CollapsibleJson content={message.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 overflow-hidden">
                    <div className="bg-emerald-500/10 rounded-[var(--radius)]">
                      <CollapsibleJson content={message.content} />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={message.isCorrect ? "outline" : "destructive"}
                        className={
                          message.isCorrect
                            ? "bg-green-500/10"
                            : "bg-red-500/10"
                        }
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
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Run #{selectedRun.name}</h2>
          <p className="text-sm text-zinc-400">
            All conversations in this test run
          </p>
        </div>

        <div className="space-y-2">
          {(selectedRun.chats || []).map((chat) => (
            <div
              key={chat.id}
              className="flex items-center p-4 bg-background border border-border rounded-[var(--radius)] cursor-pointer hover:bg-background/30"
              onClick={() => setSelectedChat(chat)}
            >
              <div className="w-[60%] truncate">
                <h3 className="font-medium truncate">{chat.name}</h3>
                <p className="text-sm text-zinc-400">
                  {chat.messages.length} messages
                </p>
              </div>

              <div className="w-[40%] flex items-center justify-end">
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
          <p className="text-sm text-zinc-400">
            History of all test executions
          </p>
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
            {savedAgentConfigs.length > 0 ? (
              savedAgentConfigs.map((test) => (
                <DropdownMenuItem 
                  key={test.id}
                  onSelect={() => executeTest(test.id)}
                  className="cursor-pointer"
                >
                  {test.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No saved tests found</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className="flex items-center p-4 bg-background border border-border rounded-[var(--radius)] cursor-pointer hover:bg-background/30"
            onClick={() => setSelectedRun(run)}
          >
            <div className="w-[30%] flex items-center gap-2">
              <span className="font-medium">{run.name}</span>
              <span className="text-zinc-400 text-sm">
                {new Date(run.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="w-[50%] flex items-center gap-4">
              <span className="text-zinc-400">
                Tests: {run.metrics.total || 0}
              </span>
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
      {showWarningDialog && (
        <WarningDialog
          isOpen={showWarningDialog}
          onClose={() => setShowWarningDialog(false)}
        />
      )}
    </div>
  );
}
