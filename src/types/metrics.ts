// export interface BaseMetrics {
//   correct: number;
//   incorrect: number;
// }

// export interface TestMetrics extends BaseMetrics {
//   total: number;
//   passed: number;
//   failed: number;
//   chats: number;
// }

// export interface ChatMetrics extends BaseMetrics {
//   correct: number;
//   incorrect: number;
// }

// export type MetricVariant = 'success' | 'error' | 'neutral';

// export interface MetricsDisplayProps {
//   label: string;
//   value: number;
//   variant?: MetricVariant;
//   className?: string;
// } 


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
}