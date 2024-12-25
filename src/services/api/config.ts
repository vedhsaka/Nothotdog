export const API_ROUTES = {
  TOOLS: {
    EVALUATE_AGENT: '/api/tools/evaluate-agent',
    GENERATE_INPUT: '/api/tools/generate-input',
    VALIDATE: '/api/tools/validate'
  }
} as const;

export const API_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
} as const;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
} 