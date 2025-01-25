export interface ConversationContext {
    variables: Record<string, any>;
    messageHistory: string[];
    currentPath: string[];
    metrics: {
      responseTime: number[];
      validationScores: number[];
      contextRelevance: number[];
    };
  }