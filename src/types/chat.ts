import { TestMessage } from "./runs";

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
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isCorrect? : boolean;
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
  name: string;
  scenario: string;
  status: 'running' | 'passed' | 'failed';
  messages: TestMessage[];
  metrics: {
    correct: number;
    incorrect: number;
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
  personaId: string;
}


// export interface TestChat {
//   id: string;
//   name: string;
//   scenario: string;
//   status: 'running' | 'passed' | 'failed';
//   messages: TestMessage[];
//   metrics: {
//     correct: number;
//     incorrect: number;
//     responseTime: number[];
//     validationScores: number[];
//     contextRelevance: number[];
//     validationDetails?: {
//       customFailure?: boolean;
//       containsFailures?: string[];
//       notContainsFailures?: string[];
//     };
//   };
//   error?: string | null;
//   timestamp: string;
// }