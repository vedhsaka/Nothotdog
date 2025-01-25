// import { TestRun } from '@/types/ui';
// import { TestChat } from '@/types/chat';
// import { TestMetrics } from '@/types/metrics';
// import { ChatMetrics } from '@/types/metrics/validation';

// export interface ConversationContext {
//   variables: Record<string, any>;
//   messageHistory: any[];
//   currentPath: string[];
//   metrics: {
//     responseTime: number[];
//     validationScores: number[];
//     contextRelevance: number[];
//   };
// }

// export interface TestVariations {
//   [testId: string]: Array<{
//     id: string;
//     cases: TestScenario[];
//   }>;
// }

// export interface SavedTest {
//   id: string;
//   name: string;
//   agentEndpoint: string;
//   headers: Record<string, string>;
//   input?: string;
//   expectedOutput?: string;
//   rules: any[];
// }

// export interface TestScenario {
//   id: string;
//   scenario: string;
//   expectedOutput: string;
//   steps: Array<{
//     input: string;
//     output: string;
//     metrics?: {
//       responseTime: number;
//       validationScore: number;
//       contextRelevance: number;
//     };
//   }>;
// }

// export function calculateChatMetrics(chat: TestChat): ChatMetrics {
//   return chat.messages.reduce(
//     (metrics, message) => {
//       if (message.role === 'assistant' && 'metrics' in message) {
//         if ((message.metrics?.validationScore ?? 0) >= 0.7) {
//           metrics.correct += 1;
//         } else {
//           metrics.incorrect += 1;
//         }
//       }
//       return metrics;
//     },
//     { correct: 0, incorrect: 0 }
//   );
// }

// export function calculateRunMetrics(chats: TestChat[]): TestMetrics {
//   return chats.reduce(
//     (metrics, chat) => {
//       const chatMetrics = calculateChatMetrics(chat);
//       metrics.passed += chatMetrics.correct;
//       metrics.failed += chatMetrics.incorrect;
//       metrics.total = metrics.passed + metrics.failed;
//       metrics.chats = chats.length;
//       metrics.correct = metrics.passed;
//       metrics.incorrect = metrics.failed;
//       return metrics;
//     },
//     { total: 0, passed: 0, failed: 0, chats: 0, correct: 0, incorrect: 0 }
//   );
// }

// export function formatTimestamp(timestamp: string): string {
//   return new Date(timestamp).toLocaleString();
// }

// export function getStatusColor(status: TestRun['status']): string {
//   switch (status) {
//     case 'running':
//       return 'text-yellow-400';
//     case 'completed':
//       return 'text-green-400';
//     case 'failed':
//       return 'text-red-400';
//     default:
//       return 'text-gray-400';
//   }
// } 


import { Evaluation } from '.';
import { MessageRole, TestRunStatus } from './base';
import { ChatMetrics, TestMetrics } from './metrics';
import { Message } from './message';

export interface TestScenario {
  id: string;
  scenario: string;
  input: string
  expectedOutput: string;
  type: 'transcript' | 'rule' | 'metric';
  metrics?: {
    [key: string]: number | undefined;
    sentimentAnalysis?: number;
    responseQuality?: number;
    hallucination?: number;
  };
  steps?: ConversationStep[];
  sourceTestId?: string;
}

export interface ConversationStep {
  id: string;
  role: MessageRole;
  content: string;
  validationPoints?: {
    contains?: string[];
    notContains?: string[];
  };
  branch?: Array<{
    condition: string;
    nextStep: string;
  }>;
}

export interface TestSet {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
  agentId: string;
  agentName: string;
  agentDescription?: string;
  evaluations: Evaluation[];
  createdAt: Date;
  updatedAt: Date;
}

// export interface TestChat {
//   id: string;
//   scenario: string;
//   status: TestRunStatus;
//   messages: Message[];
//   metrics: ChatMetrics;
//   error?: string | null;
//   timestamp: string;
// }

// export interface TestRun {
//   id: string;
//   name: string;
//   timestamp: string;
//   status: TestRunStatus;
//   metrics: TestMetrics;
//   chats: TestChat[];
//   currentMessages?: Message[];
//   results?: Array<{ scenarioId: string; responseTime: number }>;
// }