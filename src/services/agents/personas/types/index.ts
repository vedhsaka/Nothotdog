// services/agents/personas/types/index.ts
export type PersonaType = 
  | 'chatty'
  | 'direct'
  | 'impatient' 
  | 'technical'
  | 'rude';

export interface Persona {
  id: PersonaType;
  name: string;
  description: string;
  systemPrompt: string;
  examples: string[];
}