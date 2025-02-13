"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { TestCaseVariations } from "@/components/tools/TestCaseVariations";
import PersonaSelector from "@/components/tools/personaSelector";
import { AgentConfig } from "@/types";


export default function TestCasesPage() {
  const [agentCases, setAgentCases] = useState<AgentConfig[]>([]);
  const [selectedCase, setSelectedCase] = useState<AgentConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchSavedTests = async () => {
      try {
        const response = await fetch("/api/tools/agent-config");
        if (!response.ok) {
          throw new Error("Failed to fetch saved tests");
        }
        const data = await response.json();
        console.log(data);
        setAgentCases(data);
      } catch (error) {
        console.error("Error fetching saved tests:", error);
      }
    };
  
    fetchSavedTests();
  }, []);
  
  const handleCaseSelect = (test: AgentConfig) => {
    setSelectedCase(test);
  };

  const toggleSelectCase = (id: string) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const selectAllCases = () => {
    if (selectedIds.length === agentCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(agentCases.map((test) => test.id));
    }
  };

  // const deleteSelectedCases = () => {
  //   const updatedCases = agentCases.filter(
  //     (test) => !selectedIds.includes(test.id)
  //   );
  //   localStorage.setItem("savedTests", JSON.stringify(updatedCases));
  //   setAgentCases(updatedCases);
  //   setSelectedIds([]);
  //   if (selectedCase && selectedIds.includes(selectedCase.id)) {
  //     setSelectedCase(null);
  //   }
  // };

  // const deleteAgentCase = (id: string) => {
  //   const updatedCases = agentCases.filter((test) => test.id !== id);
  //   localStorage.setItem("savedTests", JSON.stringify(updatedCases));
  //   setAgentCases(updatedCases);
  //   if (selectedCase?.id === id) {
  //     setSelectedCase(null);
  //   }
  // };

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      <div className="col-span-4">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Agent Cases</CardTitle>
              <Badge variant="outline" className="bg-black/40">
                {agentCases.length} Cases
              </Badge>
            </div>
            <div className="flex mt-2">
              {/* <Button size="sm" onClick={selectAllCases}>
                {selectedIds.length === agentCases.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button size="sm"
                onClick={deleteSelectedCases}
                variant="destructive"
                className="ml-2"
              >
                Delete Selected
              </Button> */}
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-2">
              {agentCases.map((test) => (
                <div
                  key={test.id}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedCase?.id === test.id
                      ? "bg-black/60 border border-zinc-700"
                      : "bg-black/20 hover:bg-black/30"
                  }`}
                  onClick={() => handleCaseSelect(test)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(test.id)}
                        onChange={() => toggleSelectCase(test.id)}
                        className="mr-2"
                      />
                      <h3 className="font-medium">
                        {test.name || "Unnamed Test"}
                      </h3>
                    </div>
                    {/* <div className="flex items-center gap-4">
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
                    </div> */}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1 truncate max-w-[300px]">
                    Endpoint: {test.endpoint}
                  </p>
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
        <PersonaSelector selectedTest={selectedCase?.id || ""} />
      </div>
    </div>
  );
}
