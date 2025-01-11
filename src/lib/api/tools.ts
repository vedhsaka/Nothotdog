import { API_ROUTES } from './config';

interface ValidationResponse {
  isCorrect: boolean;
  explanation: string;
}

interface GenerateInputResponse {
  input: string;
}

export const toolsApi = {
  validateResponse: async (agentResponse: unknown, expectedOutput: string): Promise<ValidationResponse> => {
    const response = await fetch(API_ROUTES.TOOLS.VALIDATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actualResponse: typeof agentResponse === 'object' ? JSON.stringify(agentResponse) : agentResponse,
        expectedOutput
      })
    });
    return response.json();
  },

  generateInput: async (scenario: string, inputFormat: string): Promise<string> => {
    const response = await fetch(API_ROUTES.TOOLS.GENERATE_INPUT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scenario,
        inputFormat
      })
    });
    const data = await response.json();
    return data.input;
  },

  evaluateAgent: async (agentEndpoint: string, input: unknown, headers?: Record<string, string>) => {
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(input)
    });
    return response.json();
  }
}; 