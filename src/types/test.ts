export interface TestScenario {
  scenario: string;
  expectedOutput: string;
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
