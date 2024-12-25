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

export interface TestChat {
  id: string;
  name: string;
  messages: Message[];
  metrics: ChatMetrics;
} 