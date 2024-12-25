import { TestRun } from '@/types/ui';
import { SavedTest, TestVariations } from '@/types/test';

const STORAGE_KEYS = {
  SAVED_TESTS: 'savedTests',
  TEST_RUNS: 'testRuns',
  TEST_VARIATIONS: 'testVariations',
  RULE_TEMPLATES: 'ruleTemplates'
} as const;

class LocalStorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error);
      return defaultValue;
    }
  }

  private setItem(key: string, value: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error);
    }
  }

  getSavedTests(): SavedTest[] {
    return this.getItem<SavedTest[]>(STORAGE_KEYS.SAVED_TESTS, []);
  }

  setSavedTests(tests: SavedTest[]): void {
    this.setItem(STORAGE_KEYS.SAVED_TESTS, tests);
  }

  getTestRuns(): TestRun[] {
    return this.getItem<TestRun[]>(STORAGE_KEYS.TEST_RUNS, []);
  }

  setTestRuns(runs: TestRun[]): void {
    this.setItem(STORAGE_KEYS.TEST_RUNS, runs);
  }

  updateTestRun(updatedRun: TestRun): void {
    const runs = this.getTestRuns();
    const index = runs.findIndex(run => run.id === updatedRun.id);
    
    if (index !== -1) {
      runs[index] = updatedRun;
      this.setTestRuns(runs);
    }
  }

  getTestVariations(): TestVariations {
    return this.getItem<TestVariations>(STORAGE_KEYS.TEST_VARIATIONS, {});
  }

  setTestVariations(variations: TestVariations): void {
    this.setItem(STORAGE_KEYS.TEST_VARIATIONS, variations);
  }

  getRuleTemplates(): Record<string, unknown> {
    return this.getItem<Record<string, unknown>>(STORAGE_KEYS.RULE_TEMPLATES, {});
  }

  setRuleTemplates(templates: Record<string, unknown>): void {
    this.setItem(STORAGE_KEYS.RULE_TEMPLATES, templates);
  }
}

export const storageService = new LocalStorageService(); 