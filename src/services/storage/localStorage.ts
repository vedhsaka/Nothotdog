import { TestRun } from '@/types/runs';
import { ConversationContext, TestScenario, TestVariations, SavedTest } from '@/types';
import { PersonaMapping, PersonaMappings } from '@/types/persona-mapping'

const STORAGE_KEYS = {
  TEST_VARIATIONS: 'testVariations',
  RULE_TEMPLATES: 'ruleTemplates',
  CONVERSATION_HISTORY: 'conversationHistory',
  CONVERSATION_METRICS: 'conversationMetrics',
  SAVED_TESTS: 'savedTests',
  PERSONA_MAPPINGS: 'personaMappings',
  LLM_KEY: 'llm_key',
  LLM_PROVIDER: 'llm_provider',
  LLM_MODEL: 'llm_model',
  LLM_KEY_NAME: 'llm_key_name'
} as const;

interface ConversationResult {
  scenarioId: string;
  history: TestScenario['steps'];
  context: ConversationContext;
  metrics: {
    totalTime: number;
    averageResponseTime: number;
    averageValidationScore: number;
    averageContextRelevance: number;
    completionRate: number;
    successRate: number;
  };
  timestamp: string;
}

interface LLMConfig {
  key: string;
  provider: string;
  model: string;
  keyName: string;
}

class LocalStorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
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

  getSavedTests(): SavedTest[] {
    return this.getItem<SavedTest[]>(STORAGE_KEYS.SAVED_TESTS, []);
  }

  setSavedTests(tests: SavedTest[]): void {
    this.setItem(STORAGE_KEYS.SAVED_TESTS, tests);
  }

  saveConversationResult(result: ConversationResult): void {
    const history = this.getConversationHistory();
    history.push(result);
    this.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, history);
    
    const metrics = this.getConversationMetrics();
    const scenarioMetrics = metrics[result.scenarioId] || {
      runs: 0,
      totalTime: 0,
      totalResponseTime: 0,
      totalValidationScore: 0,
      totalContextRelevance: 0,
      successfulRuns: 0
    };

    metrics[result.scenarioId] = {
      runs: scenarioMetrics.runs + 1,
      totalTime: scenarioMetrics.totalTime + result.metrics.totalTime,
      totalResponseTime: scenarioMetrics.totalResponseTime + result.metrics.averageResponseTime,
      totalValidationScore: scenarioMetrics.totalValidationScore + result.metrics.averageValidationScore,
      totalContextRelevance: scenarioMetrics.totalContextRelevance + result.metrics.averageContextRelevance,
      successfulRuns: scenarioMetrics.successfulRuns + (result.metrics.successRate >= 0.8 ? 1 : 0)
    };

    this.setItem(STORAGE_KEYS.CONVERSATION_METRICS, metrics);
  }

  getConversationHistory(): ConversationResult[] {
    return this.getItem<ConversationResult[]>(STORAGE_KEYS.CONVERSATION_HISTORY, []);
  }

  getConversationMetrics(): Record<string, {
    runs: number;
    totalTime: number;
    totalResponseTime: number;
    totalValidationScore: number;
    totalContextRelevance: number;
    successfulRuns: number;
  }> {
    return this.getItem(STORAGE_KEYS.CONVERSATION_METRICS, {});
  }

  getScenarioHistory(scenarioId: string): ConversationResult[] {
    return this.getConversationHistory().filter(result => result.scenarioId === scenarioId);
  }

  getScenarioMetrics(scenarioId: string) {
    const metrics = this.getConversationMetrics()[scenarioId];
    if (!metrics) return null;

    return {
      averageTime: metrics.totalTime / metrics.runs,
      averageResponseTime: metrics.totalResponseTime / metrics.runs,
      averageValidationScore: metrics.totalValidationScore / metrics.runs,
      averageContextRelevance: metrics.totalContextRelevance / metrics.runs,
      successRate: metrics.successfulRuns / metrics.runs
    };
  }

  clearConversationHistory(): void {
    this.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, []);
    this.setItem(STORAGE_KEYS.CONVERSATION_METRICS, {});
  }

  getTestRuns(): TestRun[] {
    return this.getItem<TestRun[]>('testRuns', []);
  }
  
  setTestRuns(runs: TestRun[]): void {
    this.setItem('testRuns', runs);
  }

  getPersonaMappings(): PersonaMappings {
    return this.getItem<PersonaMappings>(STORAGE_KEYS.PERSONA_MAPPINGS, {});
  }
  
  setPersonaMapping(mapping: PersonaMapping) {
    const mappings = this.getPersonaMappings();
    mappings[mapping.testId] = mapping;
    this.setItem(STORAGE_KEYS.PERSONA_MAPPINGS, mappings);
  }

  getLLMConfig(): LLMConfig | null {
    const key = this.getItem<string>(STORAGE_KEYS.LLM_KEY, '');
    const provider = this.getItem<string>(STORAGE_KEYS.LLM_PROVIDER, '');
    const model = this.getItem<string>(STORAGE_KEYS.LLM_MODEL, '');
    const keyName = this.getItem<string>(STORAGE_KEYS.LLM_KEY_NAME, '');

    if (!key || !provider || !model) {
      return null;
    }

    return {
      key,
      provider,
      model,
      keyName
    };
  }

  setLLMConfig(config: LLMConfig): void {
    this.setItem(STORAGE_KEYS.LLM_KEY, config.key);
    this.setItem(STORAGE_KEYS.LLM_PROVIDER, config.provider);
    this.setItem(STORAGE_KEYS.LLM_MODEL, config.model);
    this.setItem(STORAGE_KEYS.LLM_KEY_NAME, config.keyName);
  }

  clearLLMConfig(): void {
    window.localStorage.removeItem(STORAGE_KEYS.LLM_KEY);
    window.localStorage.removeItem(STORAGE_KEYS.LLM_PROVIDER);
    window.localStorage.removeItem(STORAGE_KEYS.LLM_MODEL);
    window.localStorage.removeItem(STORAGE_KEYS.LLM_KEY_NAME);
  }
}

export const storageService = new LocalStorageService();