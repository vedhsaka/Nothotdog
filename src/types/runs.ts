interface Metrics {
  total: number;
  passed: number;
  failed: number;
  chats: number;
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
}

export type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TestChat {
  id: string;
  name: string;
  messages: TestMessage[];
  metrics: {
    correct: number;
    incorrect: number;
  };
}

export interface TestMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
} 