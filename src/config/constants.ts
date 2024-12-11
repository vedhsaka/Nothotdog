export const API_ENDPOINTS = {
    GENERATE_TESTS: '/api/tools/generate-tests',
    EVALUATE_AGENT: '/api/tools/evaluate-agent',
    ANALYZE_RESULTS: '/api/tools/analyze-results'
  } as const
  
  export const METRICS = {
    MIN_ACCURACY: 80,
    MAX_RESPONSE_TIME: 200,
    MIN_MATCH_SCORE: 70
  } as const
  
  export const DEFAULT_VALUES = {
    MAX_TEST_CASES: 5,
    TIMEOUT: 30000
  } as const