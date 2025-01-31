'use client';

import PersonaSelector from "@/components/tools/personaSelector";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/useLocalStorage";

export default function PersonasPage() {
  const [selectedPersona, setSelectedPersona] = useLocalStorage<string | null>("selectedPersona", null);

  return (
      <div className="space-y-6">
        <PersonaSelector 
          selectedPersona={selectedPersona} 
          onSelectPersona={setSelectedPersona} 
        />
      </div>
  );
}