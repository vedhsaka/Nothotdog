export interface PersonaMapping {
    id: string;
    testId: string;
    personaIds: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PersonaMappings {
    [testId: string]: PersonaMapping;
  }