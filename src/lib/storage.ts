import { TestSet } from '@/types/test-sets';

export const TestSetStorage = {
  save: (testSet: TestSet) => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    
    if (testSet.id) {
      // Update existing
      const index = testSets.findIndex((t: TestSet) => t.id === testSet.id);
      if (index !== -1) {
        testSets[index] = { ...testSet, updatedAt: new Date() };
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
  
  getAll: (): TestSet[] => {
    const stored = localStorage.getItem('testSets');
    return stored ? JSON.parse(stored) : [];
  },
  
  get: (id: string): TestSet | null => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    return testSets.find((t: TestSet) => t.id === id) || null;
  },
  
  delete: (id: string) => {
    const stored = localStorage.getItem('testSets');
    const testSets = stored ? JSON.parse(stored) : [];
    const newTestSets = testSets.filter((t: TestSet) => t.id !== id);
    localStorage.setItem('testSets', JSON.stringify(newTestSets));
  }
};