export interface PersonaMapping {
    id: string;
    endpointId: string;
    personaIds: string[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PersonaMappings {
    [endpointId: string]: PersonaMapping;
  }

  export interface PersonaEndpointMapping {
    [testId: string]: {
      endpointId: string;
      personaIds: string[];
      updatedAt: string;
    }
  }