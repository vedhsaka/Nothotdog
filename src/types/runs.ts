import { MessageRole } from "./base";
import { TestChat } from "./chat";

interface Metrics {
  total: number;
  passed: number;
  failed: number;
  chats: number;
  correct: number;
  incorrect: number;
  sentimentScores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: TestRunStatus;
  metrics: Metrics;
  chats: TestChat[];
  results: Array<{ scenarioId: string; responseTime: number }>;
  agentId: string;
  createdBy: string;
}



export type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';

// export interface TestChat {
//   id: string;
//   name: string;
//   messages: TestMessage[];
//   metrics: {
//     correct: number;
//     incorrect: number;
//   };
// }

export interface TestMessage {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
  metrics?: {
    validationScore?: number;
    responseTime?: number;
  };
}