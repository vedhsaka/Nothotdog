import { Message } from './message';

export interface TestResult {
    conversation: {
      chatId: string;
      messages: Message[];
      rawInput: Record<string, any>;
      rawOutput: Record<string, any>;
      chatResponse: string;
    };
    validation: {
      passedTest: boolean;
      formatValid: boolean;
      conditionMet: boolean;
      metrics: {
        responseTime: number;
      };
    };
  }
  