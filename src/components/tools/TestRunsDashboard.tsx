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
import { QaAgent } from '@/services/agents/claude/qaAgent';
import { AnthropicModel, OpenAIModel } from '@/services/llm/enums';
import { storageService } from '@/services/storage/localStorage';
import { useTestExecution } from '@/hooks/useTestExecution';
import { ModelFactory } from '@/services/llm/modelfactory';

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
 const {
   runs,
   selectedRun,
   setSelectedRun,
   selectedChat,
   setSelectedChat,
   savedTests,
   executeTest
 } = useTestExecution();

 const runTest = async (testId: string) => {
    const llmConfig = JSON.parse(localStorage.getItem('llm_config') || '{}');
    const activeModel = localStorage.getItem('active_model');

    if (!activeModel) {
      console.error("No active model selected");
      return;
    }

    const provider = activeModel.includes('gpt') ? 'openai' : 'anthropic';
    const apiKey = llmConfig[provider];

    if (!apiKey) {
      console.error("No API key found for provider:", provider);
      return;
    }

    const selectedModel = provider === 'openai' ? OpenAIModel.GPT4 : AnthropicModel.Sonnet3_5;
    await executeTest(testId, selectedModel);
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