import { TestRun } from '@/types/ui';
import { TestChat } from '@/types/chat';
import { ChatMetrics, TestMetrics } from '@/types/metrics';

export interface TestScenario {
  id: string;
  scenario: string;
  expectedOutput: string;
}

export function calculateChatMetrics(chat: TestChat): ChatMetrics {
  return chat.messages.reduce(
    (metrics, message) => {
      if (message.role === 'assistant' && 'metrics' in message) {
        if ((message.metrics?.validationScore ?? 0) >= 0.7) {
          metrics.correct += 1;
        } else {
          metrics.incorrect += 1;
        }
      }
      return metrics;
    },
    { correct: 0, incorrect: 0 }
  );
}

export function calculateRunMetrics(chats: TestChat[]): TestMetrics {
  return chats.reduce(
    (metrics, chat) => {
      const chatMetrics = calculateChatMetrics(chat);
      metrics.passed += chatMetrics.correct;
      metrics.failed += chatMetrics.incorrect;
      metrics.total = metrics.passed + metrics.failed;
      metrics.chats = chats.length;
      metrics.correct = metrics.passed;
      metrics.incorrect = metrics.failed;
      return metrics;
    },
    { total: 0, passed: 0, failed: 0, chats: 0, correct: 0, incorrect: 0 }
  );
}

export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

export function getStatusColor(status: TestRun['status']): string {
  switch (status) {
    case 'running':
      return 'text-yellow-400';
    case 'completed':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
} 