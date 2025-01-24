'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PersonaSelection {
  endpointId: string;
  personas: string[];
}

export default function PersonasPage() {
  const [selections, setSelections] = useLocalStorage<PersonaSelection[]>('persona-selections', []);
  
  const handleSelect = (endpointId: string, personaId: string) => {
    setSelections(prev => {
      const existing = prev.find(s => s.endpointId === endpointId);
      if (existing) {
        return prev.map(s => 
          s.endpointId === endpointId 
          ? {...s, personas: [...s.personas, personaId]}
          : s
        );
      }
      return [...prev, {endpointId, personas: [personaId]}];
    });
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {availablePersonas.map(persona => (
        <Card key={persona.id}>
          <div className="p-4">
            <h3>{persona.name}</h3>
            <p>{persona.description}</p>
            <Button onClick={() => handleSelect(currentEndpoint, persona.id)}>
              Select
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}