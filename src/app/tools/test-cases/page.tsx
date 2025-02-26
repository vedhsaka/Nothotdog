"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestCaseVariations } from "@/components/tools/TestCaseVariations";
import { AgentConfig } from "@/types";


export default function TestCasesPage() {
  const [agentCases, setAgentCases] = useState<AgentConfig[]>([]);
  const [selectedCase, setSelectedCase] = useState<AgentConfig | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchSavedTests = async () => {
      try {
        const response = await fetch("/api/tools/agent-config");
        if (!response.ok) {
          throw new Error("Failed to fetch saved tests");
        }
        const data = await response.json();
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

  const showBulkActions = agentCases.length > 1 && selectedIds.length > 0;

  if (!isMounted) {
    return null;
  }

  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Agent Cases Column */}
      <div className="col-span-4">
        <Card className="bg-background border-border border max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Agent Cases</CardTitle>
              <Badge variant="outline" className="bg-background">
                {agentCases.length} Cases
              </Badge>
            </div>
            <div className="flex mt-2">
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-2">
              {agentCases.map((test) => (
                <div
                  key={test.id}
                  className={`p-4 rounded-[var(--radius)] cursor-pointer transition-colors ${
                    selectedCase?.id === test.id
                      ? "bg-background border border-zinc-700"
                      : "bg-background hover:bg-background"
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

      {/* Persona Selector Column moved to the middle */}
      <div className="col-span-4">
        <TestCaseVariations selectedTestId={selectedCase?.id || null} />
      </div>

      {/* Test Case Variations Column moved to the right */}
      <div className="col-span-4">
        <TestCaseVariations selectedTest={selectedCase} />
      </div>
    </div>
  );
}
