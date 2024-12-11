export interface TestRun {
  id: string;
  metrics: {
    overallSuccess: number;
    sentimentScores?: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  results: Array<{
    scenarioId: string;
    responseTime: number;
  }>;
} 