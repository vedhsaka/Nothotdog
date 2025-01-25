import { MessageRole } from './base';
import { MessageMetrics } from './metrics';

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