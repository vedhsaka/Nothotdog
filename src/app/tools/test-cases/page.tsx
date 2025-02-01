'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash} from 'lucide-react';
import { ResponseTime } from '@/components/tools/ResponseTime';
import { TestCaseVariations } from '@/components/tools/TestCaseVariations';
import PersonaSelector from '@/components/tools/personaSelector';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface AgentCase {
  id: string;
  timestamp: string;
  name: string;
  agentEndpoint: string;
  responseTime: number;
  headers: Record<string, string>;
  input: string;
  expectedOutput: string;
  rules: any[];
}

export default function TestCasesPage() {
  const [selectedPersonas, setSelectedPersonas] = useLocalStorage<string[]>("selectedPersonas", []);
  const [agentCases, setAgentCases] = useState<AgentCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<AgentCase | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("");


  useEffect(() => {
    // Load saved agent cases from localStorage
    const cases = JSON.parse(localStorage.getItem('savedTests') || '[]');
    setAgentCases(cases);
  }, []);

  const handlePersonaChange = (personaIds: string[]) => {
    setSelectedPersonas(personaIds);
  };

  const handleCaseSelect = (test: AgentCase) => {
    setSelectedCase(test);
    setSelectedEndpoint(test.agentEndpoint);
  };
  


  const deleteAgentCase = (id: string) => {
    const updatedCases = agentCases.filter(test => test.id !== id);
    localStorage.setItem('savedTests', JSON.stringify(updatedCases));
    setAgentCases(updatedCases);
    if (selectedCase?.id === id) {
      setSelectedCase(null);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Left Column - Agent Cases */}
      <div className="col-span-4">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Agent Cases</CardTitle>
              <Badge variant="outline" className="bg-black/40">
                {agentCases.length} Cases
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-2">
              {agentCases.map((test) => (
                <div 
                  key={test.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedCase?.id === test.id 
                      ? 'bg-black/60 border border-zinc-700' 
                      : 'bg-black/20 hover:bg-black/30'
                  }`}
                  onClick={() => setSelectedCase(test)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{test.name || "Unnamed Test"}</h3>
                      <p className="text-sm text-zinc-400 mt-1 truncate max-w-[300px]">
                        Endpoint: {test.agentEndpoint}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {test.responseTime > 0 && <ResponseTime time={test.responseTime} />}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAgentCase(test.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {agentCases.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  No agent cases yet. Create a test from the Dashboard.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
 
      <div className="col-span-4">
        <TestCaseVariations selectedTest={selectedCase} />
      </div>
      <div className="col-span-4">
      <PersonaSelector 
          selectedEndpoint={selectedEndpoint} // Add this state if not present
          onPersonaChange={handlePersonaChange}
        />
      </div>
    </div>
  );
}