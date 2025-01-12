export interface TestSet {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TestScenario {
  id: string;
  input: string;
  expectedOutput: string;
  type: 'transcript' | 'rule' | 'metric';
  metrics?: {
    sentimentAnalysis?: number;
    responseQuality?: number;
    hallucination?: number;
  };
}