import { Evaluation } from '.';
import { MessageRole } from './base';


export interface TestScenario {
  id: string;
  scenario: string;
  input: string
  expectedOutput: string;
  type: 'transcript' | 'rule' | 'metric';
  metrics?: {
    [key: string]: number | undefined;
    sentimentAnalysis?: number;
    responseQuality?: number;
    hallucination?: number;
  };
  steps?: ConversationStep[];
  sourceTestId?: string;
}

export interface ConversationStep {
  id: string;
  role: MessageRole;
  content: string;
  validationPoints?: {
    contains?: string[];
    notContains?: string[];
  };
  branch?: Array<{
    condition: string;
    nextStep: string;
  }>;
}

export interface TestSet {
  id: string;
  name: string;
  description: string;
  scenarios: TestScenario[];
  agentId: string;
  agentName: string;
  agentDescription?: string;
  evaluations: Evaluation[];
  createdAt: Date;
  updatedAt: Date;
}