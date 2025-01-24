// Base Types
export type MessageRole = 'user' | 'assistant';
export type TestRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type MetricVariant = 'success' | 'error' | 'neutral';

// Message Interfaces
export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metrics?: MessageMetrics;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
}

// Metrics Interfaces
export interface MessageMetrics {
  responseTime?: number;
  validationScore?: number;
  contextRelevance?: number;
}

export interface BaseMetrics {
  correct: number;
  incorrect: number;
}

export interface TestMetrics extends BaseMetrics {
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

export interface ChatMetrics extends BaseMetrics {
  responseTime: number[];
  validationScores: number[];
  contextRelevance: number[];
  validationDetails?: {
    customFailure?: boolean;
    containsFailures?: string[];
    notContainsFailures?: string[];
  };
}

// Test Related Interfaces
export interface TestScenario {
  id: string;
  scenario: string;
  expectedOutput: string;
  type: 'transcript' | 'rule' | 'metric';
  metrics?: {
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

export interface TestChat {
  id: string;
  scenario: string;
  status: TestRunStatus;
  messages: Message[];
  metrics: ChatMetrics;
  error?: string | null;
  timestamp: string;
}

export interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: TestRunStatus;
  metrics: TestMetrics;
  chats: TestChat[];
  currentMessages?: Message[];
  results?: Array<{ scenarioId: string; responseTime: number }>;
}

// Agent Related Interfaces
export interface AgentConfig {
  id: string;
  name: string;
  endpoint: string;
  headers: Header[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Header {
  key: string;
  value: string;
}

export interface AgentOutput {
  id: string;
  agentId: string;
  input: string;
  output: string;
  timestamp: Date;
  responseTime?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Component Props Interfaces
export interface MetricsDisplayProps {
  label: string;
  value: number;
  variant?: MetricVariant;
  className?: string;
}

// Validation & Test Results
export interface Evaluation {
  scenario: string;
  expectedOutput: string;
}

export interface TestResult {
  conversation: {
    chatId: string;
    messages: Message[];
    rawInput: Record<string, any>;
    rawOutput: Record<string, any>;
    chatResponse: string;
  };
  validation: {
    passedTest: boolean;
    formatValid: boolean;
    conditionMet: boolean;
    metrics: {
      responseTime: number;
    };
  };
}