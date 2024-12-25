import { api } from './client';
import { API_ROUTES } from './config';

interface ValidationResponse {
  isCorrect: boolean;
  explanation: string;
}

interface GenerateInputResponse {
  input: string;
}

export const toolsService = {
  validateResponse: async (agentResponse: unknown, expectedOutput: string): Promise<ValidationResponse> => {
    return api.post<ValidationResponse>(API_ROUTES.TOOLS.VALIDATE, {
      actualResponse: typeof agentResponse === 'object' ? JSON.stringify(agentResponse) : agentResponse,
      expectedOutput
    });
  },

  generateInput: async (scenario: string, inputFormat: string): Promise<string> => {
    const response = await api.post<GenerateInputResponse>(API_ROUTES.TOOLS.GENERATE_INPUT, {
      scenario,
      inputFormat
    });
    return response.input;
  },

  evaluateAgent: async (agentEndpoint: string, input: unknown, headers?: Record<string, string>) => {
    return api.post(agentEndpoint, input, { headers });
  }
}; 