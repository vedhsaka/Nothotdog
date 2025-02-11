
import { MessageRole, TestRunStatus } from './base';
import { Evaluation } from './test-sets';

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