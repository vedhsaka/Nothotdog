import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChattyExplorer } from '@/services/agents/personas/variants/chattyExplorer';
import { DirectProfessional } from '@/services/agents/personas/variants/directProfessional';
import { ImpatientUser } from '@/services/agents/personas/variants/impatientUser';
import { TechnicalExpert } from '@/services/agents/personas/variants/technicalExpert';

const PERSONAS = [ChattyExplorer, DirectProfessional, ImpatientUser, TechnicalExpert];

interface PersonaSelectorProps {
  selectedPersonas: string[];
  onSelectPersona: (personaId: string) => void;
}

export default function PersonaSelector({ selectedPersonas, onSelectPersona }: PersonaSelectorProps) {
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
                onClick={() => onSelectPersona(persona.id)}
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