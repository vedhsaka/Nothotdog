export interface Persona {
    id: string;
    name: string;
    description: string;
    traits: string[];
    systemPrompt: string;
    examples: string[];
    category: 'professional' | 'casual' | 'challenging' | 'specialized';
  }
  