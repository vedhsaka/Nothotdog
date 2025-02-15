import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';
import { ChattyExplorer } from '@/services/agents/personas/variants/chattyExplorer';
import { DirectProfessional } from '@/services/agents/personas/variants/directProfessional';
import { ImpatientUser } from '@/services/agents/personas/variants/impatientUser';
import { TechnicalExpert } from '@/services/agents/personas/variants/technicalExpert';
import { storageService } from '@/services/storage/localStorage';
import { PersonaMapping, PersonaMappings } from '@/types/persona-mapping';


const PERSONAS = [ChattyExplorer, DirectProfessional, ImpatientUser, TechnicalExpert];

interface PersonaSelectorProps {
    selectedTest: string;
  }


export default function PersonaSelector({ selectedTest }: PersonaSelectorProps) {
    const [mappings, setMappings] = useState<PersonaMappings>(
        storageService.getPersonaMappings()
      );
    
      const selectedPersonas = mappings[selectedTest]?.personaIds || [];
    
      const handlePersonaSelect = (personaId: string) => {
        const newSelected = selectedPersonas.includes(personaId) 
          ? selectedPersonas.filter(id => id !== personaId)
          : [...selectedPersonas, personaId];
          
        const mapping: PersonaMapping = {
          id: uuidv4(),
          testId: selectedTest,
          personaIds: newSelected,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        storageService.setPersonaMapping(mapping);
        setMappings({...mappings, [selectedTest]: mapping});
      };

  return (
    <Card className="bg-black/40 border-zinc-800 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Select Testing Personas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          {PERSONAS.map((persona) => (
            <div key={persona.id} className="w-full">
              <Button
                variant={selectedPersonas.includes(persona.id) ? "default" : "outline"}
                className={cn(
                  "relative w-full h-auto p-4 flex flex-col items-start justify-start",
                  "text-left whitespace-normal break-words min-h-[80px]",
                  selectedPersonas.includes(persona.id) ? "bg-zinc-800/50 hover:bg-zinc-800/70" : "bg-black/20 hover:bg-black/30"
                )}
                onClick={() => handlePersonaSelect(persona.id)}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <h3 className="font-medium text-base text-white">{persona.name}</h3>
                  {selectedPersonas.includes(persona.id) && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 ml-2">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-400 w-full break-words">
                  {persona.description}
                </p>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}