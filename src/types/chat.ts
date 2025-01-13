import { ChatMetrics } from './metrics';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metrics: {
    responseTime: number;
    validationScore: number;
    contextRelevance: number;
  };
  expectedOutput?: string;
}

export interface TestChat {
  id: string;
  scenario: string;
  status: 'running' | 'passed' | 'failed';
  messages: ChatMessage[];
  metrics: {
    responseTime: number[];
    validationScores: number[];
    contextRelevance: number[];
    validationDetails?: {
      containsFailures?: string[];
      notContainsFailures?: string[];
      customFailure?: boolean;
    } | null;
  };
  error?: string | null;
  timestamp: string;
} 