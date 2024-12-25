export interface BaseMetrics {
  correct: number;
  incorrect: number;
}

export interface TestMetrics extends BaseMetrics {
  total: number;
  passed: number;
  failed: number;
  chats: number;
}

export interface ChatMetrics extends BaseMetrics {
  correct: number;
  incorrect: number;
}

export type MetricVariant = 'success' | 'error' | 'neutral';

export interface MetricsDisplayProps {
  label: string;
  value: number;
  variant?: MetricVariant;
  className?: string;
} 