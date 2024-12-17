export interface TestSet {
  agentId: string;
  agentName: string;
  evaluations: Evaluation[];
  createdAt: Date;
}

export interface Evaluation {
  scenario: string;
  expectedOutput: string;
}