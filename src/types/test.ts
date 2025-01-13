export interface ConversationStep {
  role: 'user' | 'assistant';
  content: string;
  expectedOutput?: string;
  response?: string;
  metrics?: {
    responseTime: number;
    validationScore: number;
    contextRelevance: number;
  };
  validation?: {
    criteria?: string;
    stopOnFailure?: boolean;
  };
  branches?: {
    condition: string;
    steps: ConversationStep[];
  }[];
  validationPoints?: {
    contains?: string[];
    notContains?: string[];
    custom?: (response: string) => boolean;
    contextual?: {
      previousMessages?: number;
      pattern?: string;
    };
  };
  branch?: {
    condition: string;
    nextStep: string;
  }[];
  id: string;
  metadata?: {
    timeout?: number;
    retryCount?: number;
    importance?: 'critical' | 'normal' | 'optional';
  };
}

export interface ConversationContext {
  variables: Record<string, any>;
  messageHistory: ConversationStep[];
  currentPath: string[];
  metrics: {
    responseTime: number[];
    validationScores: number[];
    contextRelevance: number[];
    validationDetails?: {
      containsFailures?: string[];
      notContainsFailures?: string[];
      customFailure?: boolean;
    } | null;
  };
}

export interface TestScenario {
  scenario: string;
  type: 'conversation' | 'rule' | 'metric';
  steps: ConversationStep[];
  variables?: Record<string, any>;
  validation?: {
    criteria?: string;
    stopOnFailure?: boolean;
  };
  expectedOutput?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    timeout?: number;
    success_criteria?: {
      min_valid_responses?: number;
      max_invalid_responses?: number;
      required_context_score?: number;
    };
    expected_flow?: string[];
  };
  context?: ConversationContext;
}

export interface SavedTest {
  id: string;
  name: string;
  agentEndpoint: string;
  input: string;
  headers: Record<string, string>;
}

export interface TestVariation {
  id: string;
  testId: string;
  cases: TestScenario[];
  createdAt: string;
}

export interface TestVariations {
  [testId: string]: TestVariation[];
}
