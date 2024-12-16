// import React, { useState, useEffect } from 'react';
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Play } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { MessageDisplay } from "@/components/common/MessageDisplay";
// import { StatusBadge } from "@/components/common/StatusBadge";

// interface TestCase {
//   id: string;
//   scenario: string;
//   expectedOutput: string;
//   sourceTestId: string;
// }

// interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
//   expectedOutput?: string;
//   isCorrect?: boolean;
//   explanation?: string;
// }

// type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';

// interface TestRun {
//   id: string;
//   name: string;
//   timestamp: string;
//   status: TestRunStatus;
//   agentEndpoint: string;
//   headers: Record<string, string>;
//   testCases: TestCase[];
//   messages: ChatMessage[];
// }

// export function ChatTestRunner() {
//   const [runs, setRuns] = useState<TestRun[]>([]);
//   const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
//   const [isRunning, setIsRunning] = useState(false);
//   const [expandedMessages, setExpandedMessages] = useState<{[key: string]: boolean}>({});

//   useEffect(() => {
//     loadTestRuns();
//   }, []);

//   const loadTestRuns = () => {
//     // Load saved agent configuration
//     const savedTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
//     const agentConfig = savedTests[2] || {};
//     const savedFormat = savedTests.body.originalInput;
  
//     // Load test variations
//     const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    
//     // Create test runs from saved variations
//     const newRuns = Object.entries(savedVariations).map(([sourceId, testCases]) => ({
//       id: crypto.randomUUID(),
//       name: `Test Run for ${sourceId}`,
//       timestamp: new Date().toISOString(),
//       status: 'pending' as TestRunStatus,
//       agentEndpoint: agentConfig.agentEndpoint || '',
//       headers: agentConfig.headers || {},
//       testCases: (testCases as any[]).map(tc => ({
//         id: tc.id,
//         scenario: tc.scenario,
//         expectedOutput: tc.expectedOutput,
//         sourceTestId: tc.sourceTestId
//       })) satisfies TestCase[],
//       messages: [] as ChatMessage[]
//     }));
  
//     setRuns(newRuns);
//   };

// // In ChatTestRunner.tsx, modify the runTests function:

//   const runTests = async (run: TestRun) => {
//     if (!run.agentEndpoint) {
//       console.error('No agent endpoint configured');
//       return;
//     }

//     setIsRunning(true);
//     const updatedRun: TestRun = {
//       ...run,
//       status: 'running',
//       messages: []
//     };
//     setSelectedRun(updatedRun);

//     try {
//       // Initialize the conversation context
//       let conversationContext = '';

      // for (const testCase of run.testCases) {
      //   // Step 1: Generate appropriate input for this scenario
      //   const inputResponse = await fetch('/api/tools/validate-response', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       context: testCase.scenario,
      //       mode: 'generate_input',
      //       previousContext: conversationContext
      //     })
      //   });

      //   if (!inputResponse.ok) {
      //     throw new Error('Failed to generate input');
      //   }

      //   const { input } = await inputResponse.json();

      //   // Add user message
      //   const userMessage: ChatMessage = {
      //     role: 'user',
      //     content: input,
      //     expectedOutput: testCase.expectedOutput
      //   };
      //   updatedRun.messages = [...updatedRun.messages, userMessage];
      //   setSelectedRun({ ...updatedRun });

      //   try {
      //     // Send request to agent
      //     const response = await fetch(run.agentEndpoint, {
      //       method: 'POST',
      //       headers: {
      //         'Content-Type': 'application/json',
      //         ...run.headers
      //       },
      //       body: input
      //       // body: JSON.stringify({ 
      //       //   input,
      //       //   context: conversationContext // Add conversation context to agent request
      //       // })
      //     });

      //     if (!response.ok) {
      //       throw new Error(`Agent request failed: ${response.statusText}`);
      //     }

      //     const agentResponse = await response.json();

      //     // Update conversation context
      //     conversationContext += `User: ${input}\nAssistant: ${agentResponse.output || agentResponse.response}\n`;

      //     // Validate response against expected output
      //     const validationResponse = await fetch('/api/tools/validate-response', {
      //       method: 'POST',
      //       headers: { 'Content-Type': 'application/json' },
      //       body: JSON.stringify({
      //         actualResponse: agentResponse.output || agentResponse.response,
      //         expectedOutput: testCase.expectedOutput,
      //         context: testCase.scenario,
      //         conversationContext // Add conversation context to validation
      //       })
      //     });

      //     if (!validationResponse.ok) {
      //       throw new Error('Validation request failed');
      //     }

      //     const validation = await validationResponse.json();

      //     // Add assistant message with validation
      //     const assistantMessage: ChatMessage = {
      //       role: 'assistant',
      //       content: agentResponse.output || agentResponse.response,
      //       isCorrect: validation.isCorrect,
      //       explanation: validation.explanation
      //     };
      //     updatedRun.messages = [...updatedRun.messages, assistantMessage];
      //     setSelectedRun({ ...updatedRun });

      //   } catch (error) {
      //     console.error('Test execution error:', error);
      //     const errorMessage: ChatMessage = {
      //       role: 'assistant',
      //       content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
      //       isCorrect: false
      //     };
      //     updatedRun.messages = [...updatedRun.messages, errorMessage];
      //     setSelectedRun({ ...updatedRun });
      //   }
      // }

//       updatedRun.status = 'completed';
//       setSelectedRun(updatedRun);
//       setRuns(prev => prev.map(r => r.id === run.id ? updatedRun : r));

//       // Save results
//       const savedRuns = JSON.parse(localStorage.getItem('testRuns') || '[]');
//       localStorage.setItem('testRuns', JSON.stringify([...savedRuns, updatedRun]));

//     } catch (error) {
//       console.error('Run failed:', error);
//       updatedRun.status = 'failed';
//       setSelectedRun(updatedRun);
//       setRuns(prev => prev.map(r => r.id === run.id ? updatedRun : r));
//     }

//     setIsRunning(false);
//   };

//   const toggleExpanded = (messageIndex: number) => {
//     setExpandedMessages(prev => ({
//       ...prev,
//       [messageIndex]: !prev[messageIndex]
//     }));
//   };

//   return (
//     <div className="grid grid-cols-12 gap-6 p-6">
//       <div className="col-span-3">
//         <Card className="bg-black/40 border-zinc-800">
//           <CardHeader>
//             <CardTitle>Test Runs</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-2">
//               {runs.map((run) => (
//                 <div
//                   key={run.id}
//                   className={cn(
//                     "p-4 rounded-lg cursor-pointer transition-colors",
//                     selectedRun?.id === run.id 
//                       ? "bg-black/60 border border-zinc-700" 
//                       : "bg-black/20 hover:bg-black/30"
//                   )}
//                   onClick={() => setSelectedRun(run)}
//                 >
//                   <div className="flex justify-between items-start">
//                     <div>
//                       <h3 className="font-medium">{run.name}</h3>
//                       <p className="text-sm text-zinc-400 mt-1">
//                         {new Date(run.timestamp).toLocaleString()}
//                       </p>
//                     </div>
//                     <StatusBadge status={run.status} />
//                   </div>
//                 </div>
//               ))}

//               {runs.length === 0 && (
//                 <div className="text-center py-8 text-zinc-500">
//                   No test runs available. Create test cases first.
//                 </div>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="col-span-9">
//         <Card className="bg-black/40 border-zinc-800">
//           <CardHeader className="flex flex-row items-center justify-between">
//             <CardTitle>{selectedRun?.name || 'Select a test run'}</CardTitle>
//             {selectedRun && (
//               <Button 
//                 size="sm"
//                 onClick={() => runTests(selectedRun)}
//                 disabled={isRunning}
//               >
//                 <Play className="w-4 h-4 mr-2" />
//                 {isRunning ? 'Running...' : 'Run Tests'}
//               </Button>
//             )}
//           </CardHeader>
//           <CardContent>
//             {selectedRun ? (
//               <div className="h-[600px] overflow-y-auto pr-4">
//                 <div className="space-y-4">
//                   {selectedRun.messages.map((message, index) => (
//                     <MessageDisplay
//                       key={index}
//                       role={message.role}
//                       content={message.content}
//                       isCorrect={message.isCorrect}
//                       explanation={message.explanation}
//                       expectedOutput={message.expectedOutput}
//                       isExpanded={expandedMessages[index]}
//                       onToggleExpand={() => toggleExpanded(index)}
//                     />
//                   ))}
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-center justify-center h-[600px] text-zinc-500">
//                 Select a test run to view details
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// }

// export default ChatTestRunner;


import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageDisplay } from "@/components/common/MessageDisplay";
import { StatusBadge } from "@/components/common/StatusBadge";

interface TestCase {
  id: string;
  scenario: string;
  expectedOutput: string;
  sourceTestId: string;
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
  inputFormat?: string; // Reference format from manual testing
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
    const savedTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    if (!savedTests.length) return;
  
    const referenceTest = savedTests[0];
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    
    const newRuns = Object.entries(savedVariations).map(([sourceId, testCases]) => ({
      id: crypto.randomUUID(),
      name: `Test Run for ${sourceId}`,
      timestamp: new Date().toISOString(),
      status: 'pending' as TestRunStatus,
      agentEndpoint: referenceTest.agentEndpoint,
      headers: referenceTest.headers,
      inputFormat: referenceTest.input, // Store the exact input format as reference
      testCases: (testCases as any[]).map(tc => ({
        id: tc.id,
        scenario: tc.scenario,
        expectedOutput: tc.expectedOutput,
        sourceTestId: tc.sourceTestId
      })),
      messages: []
    }));
  
    setRuns(newRuns);
  };

  const runTests = async (run: TestRun) => {
    if (!run.agentEndpoint) {
      console.error('Missing agent configuration');
      return;
    }
  
    setIsRunning(true);
    const updatedRun: TestRun = {
      ...run,
      status: 'running' as TestRunStatus,
      messages: []
    };
    setSelectedRun(updatedRun);
  
    try {
      let conversation = '';
  
      for (const testCase of run.testCases) {
  
        // Step 1: Generate appropriate input for this scenario
        const inputResponse = await fetch('/api/tools/validate-response', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: testCase.scenario,
            mode: 'generate_input',
            previousContext: conversation,
            inputFormat: run.inputFormat
          })
        });
  
        if (!inputResponse.ok) {
          throw new Error('Failed to generate input');
        }
  
        const input = await inputResponse.json();
  
        // Add user message
        const userMessage: ChatMessage = {
          role: 'user',
          content: input,
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
            body: input
          });
  
          if (!response.ok) {
            throw new Error(`Agent request failed: ${response.statusText}`);
          }
  
          const agentResponse = await response.json();
  
          // Update conversation context
          conversation += `User: ${input}\nAssistant: ${agentResponse.output || agentResponse.response}\n`;
  
          // Validate response against expected output
          const validationResponse = await fetch('/api/tools/validate-response', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              actualResponse: agentResponse.output || agentResponse.response,
              expectedOutput: testCase.expectedOutput,
              context: testCase.scenario,
              conversation
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
  
      updatedRun.status = 'completed' as TestRunStatus;
      setSelectedRun(updatedRun);
      setRuns(prev => prev.map(r => r.id === run.id ? updatedRun : r));
  
      // Save results
      const savedRuns = JSON.parse(localStorage.getItem('testRuns') || '[]');
      localStorage.setItem('testRuns', JSON.stringify([...savedRuns, updatedRun]));
  
    } catch (error) {
      console.error('Run failed:', error);
      updatedRun.status = 'failed' as TestRunStatus;
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
                    <StatusBadge status={run.status} />
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
                    <MessageDisplay
                      key={index}
                      role={message.role}
                      content={message.content}
                      isCorrect={message.isCorrect}
                      explanation={message.explanation}
                      expectedOutput={message.expectedOutput}
                      isExpanded={expandedMessages[index]}
                      onToggleExpand={() => toggleExpanded(index)}
                    />
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