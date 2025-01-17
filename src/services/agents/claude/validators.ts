import { Rule } from './types';
import { ConversationHandler } from './conversationHandler';

export class ResponseValidator {
  static validateStructure(obj: any, template: any): boolean {
    if (!obj || typeof obj !== 'object') return false;

    for (const [key, expectedType] of Object.entries(template)) {
      if (!(key in obj)) return false;

      if (typeof expectedType === 'object' && expectedType !== null) {
        if (!this.validateStructure(obj[key], expectedType)) return false;
      } else {
        if (obj[key] === undefined) return false;
      }
    }
    return true;
  }

  static validateResponseFormat(response: any, outputFormat: any): boolean {
    try {
      return this.validateStructure(response, outputFormat);
    } catch (error) {
      console.error('Response format validation failed:', error);
      return false;
    }
  }

  static validateCondition(response: any, rules: Rule[]): boolean {
    try {
      const chatRule = rules.find(rule => rule.condition === "chat");
      if (!chatRule) return false;

      const chatResponse = ConversationHandler.extractChatResponse(response, rules);
      return chatResponse.includes(chatRule.value);
    } catch (error) {
      console.error('Condition validation error:', error);
      return false;
    }
  }
}