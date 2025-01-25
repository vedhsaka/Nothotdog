import { BaseMemory } from "langchain/memory";
import { ChatMessage } from "@langchain/core/messages";
import { ConversationContext } from "@/types/context";

export class ConversationMemory extends BaseMemory {
  private context: ConversationContext;
  private messageHistory: ChatMessage[] = [];

  constructor(context?: ConversationContext) {
    super();
    this.context = context || {
      variables: {},
      messageHistory: [],
      currentPath: [],
      metrics: {
        responseTime: [],
        validationScores: [],
        contextRelevance: []
      }
    };
  }

  get memoryKeys() {
    return ["chat_history", "context"];
  }

  async loadMemoryVariables(): Promise<{
    chat_history: ChatMessage[];
    context: ConversationContext;
  }> {
    return {
      chat_history: this.messageHistory,
      context: this.context
    };
  }

  async saveContext(
    inputValues: { input: string },
    outputValues: { output: string }
  ): Promise<void> {
    this.messageHistory.push(
      new ChatMessage({ content: inputValues.input, role: "human" }),
      new ChatMessage({ content: outputValues.output, role: "assistant" })
    );
  }

  async clear(): Promise<void> {
    this.messageHistory = [];
    this.context = {
      variables: {},
      messageHistory: [],
      currentPath: [],
      metrics: {
        responseTime: [],
        validationScores: [],
        contextRelevance: []
      }
    };
  }

  setContext(context: ConversationContext): void {
    this.context = context;
  }

  getMessageHistory(): ChatMessage[] {
    return this.messageHistory;
  }
} 