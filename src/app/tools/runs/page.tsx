// 'use client'

// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Play, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
// import { ResponseTime } from '@/components/tools/ResponseTime';
// import { TestExecution } from '@/types/test-sets';

// interface TestRun {
//   name: string;
//   timestamp: string;
//   agentEndpoint: string;
//   input: string;
//   expectedOutput: string;
//   rules: any[];
//   responseTime: number;
//   actualOutput?: string;
//   status: 'pending' | 'running' | 'completed' | 'failed';
//   error?: string;
//   matchScore?: number;
// }

// export default function RunsPage() {
//   const [tests, setTests] = useState<TestRun[]>([]);
//   const [isRunning, setIsRunning] = useState(false);
//   const [progress, setProgress] = useState(0);
  
//   useEffect(() => {
//     // Load tests that were selected for running
//     const testsToRun = JSON.parse(localStorage.getItem('testsToRun') || '[]');
//     setTests(testsToRun.map((test: any) => ({
//       ...test,
//       status: 'pending',
//       actualOutput: undefined,
//       error: undefined,
//       matchScore: undefined
//     })));
//   }, []);

//   const runTests = async () => {
//     setIsRunning(true);
//     setProgress(0);
    
//     const updatedTests = [...tests];
//     let completed = 0;

//     for (let i = 0; i < updatedTests.length; i++) {
//       const test = updatedTests[i] as TestExecution;
//       test.status = 'running';
//       setTests([...updatedTests]);

//       try {
//         // Run the test
//         const startTime = Date.now();
//         const response = await fetch(test.agentEndpoint, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             ...test.headers
//           },
//           body: test.input
//         });

//         const data = await response.json();
//         const endTime = Date.now();

//         // Evaluate the result using the rules
//         const matchScore = evaluateResponse(data, JSON.parse(test.expectedOutput), test.rules);

//         test.status = 'completed';
//         test.actualOutput = JSON.stringify(data, null, 2);
//         test.responseTime = endTime - startTime;
//         test.matchScore = matchScore;
//       } catch (error) {
//         test.status = 'failed';
//         test.error = error instanceof Error ? error.message : 'Unknown error occurred';
//       }

//       completed++;
//       setProgress((completed / updatedTests.length) * 100);
//       setTests([...updatedTests]);
//     }

//     setIsRunning(false);
//   };

//   const evaluateResponse = (actual: any, expected: any, rules: any[]): number => {
//     if (!rules || rules.length === 0) {
//       // Simple JSON comparison if no rules
//       return JSON.stringify(actual) === JSON.stringify(expected) ? 100 : 0;
//     }

//     // Evaluate based on rules
//     const passedRules = rules.filter(rule => {
//       const actualValue = getValueByPath(actual, rule.path);
//       switch (rule.condition) {
//         case '=': return actualValue === rule.value;
//         case '>': return Number(actualValue) > Number(rule.value);
//         case '<': return Number(actualValue) < Number(rule.value);
//         case '>=': return Number(actualValue) >= Number(rule.value);
//         case '<=': return Number(actualValue) <= Number(rule.value);
//         case 'contains': return String(actualValue).includes(rule.value);
//         case 'startsWith': return String(actualValue).startsWith(rule.value);
//         case 'endsWith': return String(actualValue).endsWith(rule.value);
//         default: return false;
//       }
//     });

//     return (passedRules.length / rules.length) * 100;
//   };

//   const getValueByPath = (obj: any, path: string): any => {
//     return path.split('.').reduce((acc, part) => acc?.[part], obj);
//   };

//   const getStatusIcon = (status: TestRun['status']) => {
//     switch (status) {
//       case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
//       case 'failed': return <XCircle className="h-4 w-4 text-red-400" />;
//       case 'running': return <Clock className="h-4 w-4 text-yellow-400 animate-spin" />;
//       default: return <AlertCircle className="h-4 w-4 text-zinc-400" />;
//     }
//   };

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h2 className="text-xl font-semibold">Test Runs</h2>
//           <p className="text-zinc-400">Execute and monitor your test cases</p>
//         </div>
//         <Button 
//           onClick={runTests}
//           disabled={isRunning || tests.length === 0}
//         >
//           <Play className="mr-2 h-4 w-4" />
//           Run All Tests
//         </Button>
//       </div>

//       {isRunning && (
//         <div className="mb-6">
//           <Progress value={progress} className="h-2" />
//           <p className="text-sm text-zinc-400 mt-2">
//             Running tests... {Math.round(progress)}% complete
//           </p>
//         </div>
//       )}

//       <div className="space-y-4">
//         {tests.map((test, index) => (
//           <Card key={index} className="bg-black/40 border-zinc-800">
//             <CardHeader>
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center gap-2">
//                   {getStatusIcon(test.status)}
//                   <CardTitle>{test.name}</CardTitle>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {test.responseTime > 0 && <ResponseTime time={test.responseTime} />}
//                   {test.matchScore !== undefined && (
//                     <Badge variant="outline" className={
//                       test.matchScore >= 90 ? 'bg-emerald-500/20 text-emerald-400' :
//                       test.matchScore >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
//                       'bg-red-500/20 text-red-400'
//                     }>
//                       {test.matchScore.toFixed(1)}% Match
//                     </Badge>
//                   )}
//                 </div>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-zinc-400 mb-2">Expected Output:</p>
//                   <pre className="text-xs bg-black/20 p-3 rounded-lg overflow-x-auto">
//                     {test.expectedOutput}
//                   </pre>
//                 </div>
//                 <div>
//                   <p className="text-sm text-zinc-400 mb-2">Actual Output:</p>
//                   {test.actualOutput ? (
//                     <pre className="text-xs bg-black/20 p-3 rounded-lg overflow-x-auto">
//                       {test.actualOutput}
//                     </pre>
//                   ) : (
//                     <div className="bg-black/20 p-3 rounded-lg text-zinc-500 text-center">
//                       Waiting for test execution...
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {test.error && (
//                 <Alert variant="destructive" className="mt-4">
//                   <AlertDescription>{test.error}</AlertDescription>
//                 </Alert>
//               )}
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// }


'use client';

import { ChatTestRunner } from '@/components/tools/ChatTestRunner';

export default function RunsPage() {
  return <ChatTestRunner />;
}