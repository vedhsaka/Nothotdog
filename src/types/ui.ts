import { TestMetrics } from './metrics';
import { ChatMessage, TestChat } from './chat';

export interface TestRun {
  id: string;
  name: string;
  timestamp: string;
  status: 'running' | 'completed' | 'failed';
  metrics: TestMetrics;
  chats: TestChat[];
  currentMessages?: ChatMessage[];
} 