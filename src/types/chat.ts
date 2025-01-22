export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  expectedOutput?: string;
  isCorrect?: boolean;
  explanation?: string;
}


export interface ChatMessage {
  isCorrect: any;
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metrics?: {
    responseTime?: number;
    validationScore?: number;
    contextRelevance?: number;
  };
}

export interface TestResult {
  conversation: {
    chatId: string;
    messages: ChatMessage[];
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
      customFailure?: boolean;
      containsFailures?: string[];
      notContainsFailures?: string[];
    };
  };
  error?: string | null;
  timestamp: string;
}