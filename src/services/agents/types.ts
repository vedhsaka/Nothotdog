import { BaseMessage } from "@langchain/core/messages";

export interface Agent {
  call(input: string): Promise<AgentResponse>;
  reset(): void;
}


export interface AgentResponse {
  response: string;
  messages: BaseMessage[];
}