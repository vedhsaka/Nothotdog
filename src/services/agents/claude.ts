import { ChatAnthropic } from "@langchain/anthropic";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { AgentConfig, Agent, AgentResponse } from './types';
import { BaseMessage } from "@langchain/core/messages";

export class ClaudeAgent implements Agent {
  private model: ChatAnthropic;
  private chain: ConversationChain;
  private memory: BufferMemory;

  constructor(config: AgentConfig) {
    this.model = new ChatAnthropic({
      temperature: 0,
      anthropicApiKey: config.headers['x-api-key'],
      modelName: "claude-3-sonnet-20240229",
    });

    this.memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
      inputKey: "input",
      outputKey: "response",
    });

    this.chain = new ConversationChain({
      llm: this.model,
      memory: this.memory,
      verbose: true
    });
  }

  async call(input: string): Promise<AgentResponse> {
    const result = await this.chain.call({
      input
    });

    return {
      response: result.response,
      messages: await this.memory.chatHistory.getMessages()
    };
  }

  async getHistory(): Promise<BaseMessage[]> {
    return await this.memory.chatHistory.getMessages();
  }

  reset(): void {
    this.memory.clear();
  }
} 