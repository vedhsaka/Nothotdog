export interface AgentConfig {
    id: string;
    name: string;
    endpoint: string;
    headers: Header[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface AgentOutput {
    id: string;
    agentId: string;
    input: string;
    output: string;
    timestamp: Date;
    responseTime?: number;
  }
  
  export type AgentCreateInput = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>;
  
  export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
  }

  export interface Header {
    key: string;
    value: string;
  }