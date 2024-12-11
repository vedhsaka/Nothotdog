export interface Rule {
  path: string;
  condition: '=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
}

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
  
  export interface TestResult {
    id: string;
    testSetId: string;
    scenarios: TestScenarioResult[];
    startedAt: Date;
    completedAt: Date;
    status: 'running' | 'completed' | 'failed';
  }
  
  export interface TestScenarioResult {
    scenarioId: string;
    output: string;
    metrics: {
      sentimentAnalysis?: number;
      responseQuality?: number;
      hallucination?: number;
      responseTime: number;
    };
    passed: boolean;
    error?: string;
  }
  
  export interface TestRun {
    id: string;
    testSetId: string;
    status: 'running' | 'completed' | 'failed';
    metrics: {
      overallSuccess: number;
    };
    startedAt: Date;
    headers?: Record<string, string>;
    input?: string;
  }
  
  export interface TestExecution {
    id: string;
    name: string;
    timestamp: string;
    agentEndpoint: string;
    headers: Record<string, string>;
    input: string;
    expectedOutput: string;
    rules: any[];
    responseTime?: number;
    actualOutput?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    error?: string;
    matchScore?: number;
  }