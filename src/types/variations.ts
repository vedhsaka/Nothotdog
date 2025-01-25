export interface TestVariation {
    id: string;
    testId: string;
    timestamp: string;
    sourceTestId: string;
    cases: Array<{
      id: string;
      scenario: string;
      expectedOutput: string;
      sourceTestId: string;
    }>;
  }
  
  export interface TestVariations {
    [testId: string]: TestVariation[];
  }