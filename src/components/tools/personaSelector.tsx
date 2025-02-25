import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Persona } from '@/types/persona';

interface PersonaSelectorProps {
  selectedTest: string;
}

export default function PersonaSelector({ selectedTest }: PersonaSelectorProps) {
    const [mapping, setMapping] = useState<{ personaIds: string[] } | null>(null);
    const selectedPersonas = mapping?.personaIds || [];
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      fetch('/api/tools/personas')
        .then(res => res.json())
        .then(data => setPersonas(data))
        .catch(err => console.error("Error fetching personas:", err));
    }, []);
    
    useEffect(() => {
      if (!selectedTest) return;
      fetch(`/api/tools/persona-mapping?agentId=${selectedTest}`)
        .then(res => res.json())
        .then(data => setMapping(data))
        .catch(err => console.error("Error fetching persona mappings:", err));
    }, [selectedTest]);

    const handlePersonaSelect = async (personaId: string) => {
      if (!selectedTest) return;
      try {
        setLoading(true);
        
        if (selectedPersonas.includes(personaId)) {
          const res = await fetch('/api/tools/persona-mapping', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: selectedTest, personaId })
          });
          if (!res.ok) throw new Error('Failed to delete mapping');
          const data = await res.json();
          setMapping(data);
        } else {
          const res = await fetch('/api/tools/persona-mapping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: selectedTest, personaId })
          });
          if (!res.ok) throw new Error('Failed to create mapping');
          const data = await res.json();
          setMapping(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (selectedTest) {
      return (
        <Card className="bg-black/40 border-zinc-800 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Select Testing Personas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-3">
              {personas.map((persona) => (
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
}

