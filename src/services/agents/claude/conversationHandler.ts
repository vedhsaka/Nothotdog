import { Rule } from './types';

export class ConversationHandler {
  static extractTestMessage(response: string): string {
    const parts = response.split(/TEST_MESSAGE:/);
    if (parts.length < 2) return response.trim();
    
    const messagePart = parts[1].split(/\n/)[0];
    return messagePart ? messagePart.trim() : response.trim();
  }

  static extractConversationPlan(response: string): string[] | null {
    const parts = response.split(/CONVERSATION_PLAN:/);
    if (parts.length < 2) return null;
    
    const planPart = parts[1].split(/ANALYSIS:/)[0];
    if (!planPart.trim()) return null;
    
    return planPart
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  static extractChatResponse(apiResponse: any, rules: Rule[]): string {
    const chatRule = rules.find(rule => rule.condition === "chat");
    if (!chatRule) {
      throw new Error("No chat rule found in configuration");
    }

    const path = chatRule.path.split('.');
    let value = apiResponse;
    for (const key of path) {
      if (value === undefined || value === null) {
        throw new Error(`Invalid path ${chatRule.path} for response`);
      }
      value = value[key];
    }

    if (typeof value !== 'string') {
      throw new Error(`Chat response at path ${chatRule.path} is not a string`);
    }

    return value;
  }
}