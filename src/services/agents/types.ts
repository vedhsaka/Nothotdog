import { BaseMessage } from "@langchain/core/messages";

export interface Agent {
  call(input: string): Promise<AgentResponse>;
  reset(): void;
  getHistory(): Promise<BaseMessage[]>;
}

export interface AgentConfig {
  baseURL: string;
  headers: Record<string, string>;
}

export interface AgentResponse {
  response: string;
  messages: BaseMessage[];
}