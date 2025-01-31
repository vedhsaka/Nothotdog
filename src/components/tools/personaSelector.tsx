import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChattyExplorer } from '@/services/agents/personas/variants/chattyExplorer';
import { DirectProfessional } from '@/services/agents/personas/variants/directProfessional';
import { ImpatientUser } from '@/services/agents/personas/variants/impatientUser';
import { TechnicalExpert } from '@/services/agents/personas/variants/technicalExpert';
import { cn } from "@/lib/utils";

const PERSONAS = [ChattyExplorer, DirectProfessional, ImpatientUser, TechnicalExpert];

interface PersonaSelectorProps {
  selectedPersona: string | null;
  onSelectPersona: (personaId: string) => void;
}

export default function PersonaSelector({ selectedPersona, onSelectPersona }: PersonaSelectorProps) {
  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <CardTitle>Select Testing Persona</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAS.map((persona) => (
            <Button
              key={persona.id}
              variant={selectedPersona === persona.id ? "default" : "outline"}
              className={cn(
                "h-auto p-4 flex flex-col items-start space-y-2",
                selectedPersona === persona.id && "bg-primary"
              )}
              onClick={() => onSelectPersona(persona.id)}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{persona.name}</span>
                {selectedPersona === persona.id && (
                  <Badge className="bg-emerald-500/20 text-emerald-400">Selected</Badge>
                )}
              </div>
              <p className="text-sm text-left text-zinc-400">
                {persona.description}
              </p>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}