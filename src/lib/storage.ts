export interface StoredTestSet {
  id: string;
  name: string;
  description: string;
  scenarios: Array<{ id: string; name: string }>;
  agentId: string;
  agentName: string;
  agentDescription?: string;
  evaluations: {
    scenario: string;
    expectedOutput: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const TestSetStorage = {
  save: (testSet: StoredTestSet) => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    
    if (testSet.id) {
      // Update existing
      const index = testSets.findIndex((t: StoredTestSet) => t.id === testSet.id);
      if (index !== -1) {
        testSets[index] = { 
          ...testSet, 
          updatedAt: new Date() 
        };
      }
    } else {
      // Create new
      testSets.push({
        ...testSet,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    localStorage.setItem('testSets', JSON.stringify(testSets));
  },
  
  getAll: (): StoredTestSet[] => {
    const stored = localStorage.getItem('testSets');
    return stored ? JSON.parse(stored) : [];
  },
  
  get: (id: string): StoredTestSet | null => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    return testSets.find((t: StoredTestSet) => t.id === id) || null;
  },
  
  delete: (id: string) => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    const newTestSets = testSets.filter((t: StoredTestSet) => t.id !== id);
    localStorage.setItem('testSets', JSON.stringify(newTestSets));
  }
};