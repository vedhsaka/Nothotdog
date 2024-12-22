export interface TestCase {
    input: any
    expectedOutput: any
    description: string
    category?: string
  }
  
  export interface EvaluationResult {
    testCase: TestCase
    output: any
    responseTime: number
    isCorrect: boolean
    matchScore: number
    explanation: string
    error: string | null
  }
  
  export interface Metrics {
    accuracy: number
    averageResponseTime: number
    averageMatchScore: number
    totalTests: number
    successfulTests: number
  }
  
  export interface Analysis {
    categorizedResults: {
      [key: string]: {
        successRate: number
        averageResponseTime: number
      }
    }
    insights: string[]
    improvements: string[]
    summary: {
      totalCategories: number
      overallSuccessRate: number
      averageResponseTime: number
    }
  }
  
  export interface LoadingState {
    generating: boolean
    evaluating: boolean
    analyzing: boolean
  }

  export interface TestScenario {
    scenario: string;
    expectedOutput: string;
    cases?: string[];
  }

  export interface Rule {
    id: string;
    path: string;
    operator: '=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith' | 'null' | 'not_null' | '!=' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches' | 'has_key' | 'array_contains' | 'array_length';
    value: string;
    isValid?: boolean;
  }