export interface TestSet {
  id: string;
  name: string;
  description: string;
  agentId: string;
  agentName: string;
  evaluations: Evaluation[];
  createdAt: Date;
  scenarios: Array<{ id: string; name: string }>;
}

export interface Evaluation {
  scenario: string;
  expectedOutput: string;
}

interface StoredTestSet {
  id: string;
  name: string;
  description: string;
  scenarios: Array<{ id: string; name: string }>;
}