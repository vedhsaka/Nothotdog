'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash, Edit, Check, X, Plus } from 'lucide-react';
import { ResponseTime } from '@/components/tools/ResponseTime';
import { TestCaseVariations } from '@/components/tools/TestCaseVariations';

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

interface GeneratedTestCase {
  id: string;
  category?: string;
  input: {
    query: string;
  } | string;
  description: string;
  expectedOutput: string;
  isEditing: boolean;
}

export default function TestCasesPage() {
  const [agentCases, setAgentCases] = useState<AgentCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<AgentCase | null>(null);
  const [generatedTestCases, setGeneratedTestCases] = useState<GeneratedTestCase[]>([]);
  const [editingCase, setEditingCase] = useState<{
    input: string;
    expectedOutput: string;
  } | null>(null);

  useEffect(() => {
    // Load saved agent cases from localStorage
    const cases = JSON.parse(localStorage.getItem('savedTests') || '[]');
    setAgentCases(cases);
  }, []);

  const generateTestCases = async (sourceCase: AgentCase) => {
    try {
      const response = await fetch('/api/tools/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputExample: sourceCase.input,
          expectedOutput: sourceCase.expectedOutput,
          agentDescription: ''
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error('Generation error:', data.error);
        return;
      }
      
      if (data.testCases) {
        setGeneratedTestCases(data.testCases.map((tc: any) => ({
          id: crypto.randomUUID(),
          input: tc.input,
          description: tc.description,
          expectedOutput: tc.expectedOutput || '',
          category: tc.category,
          isEditing: false
        })));
      }
    } catch (error) {
      console.error('Failed to generate test cases:', error);
    }
  };

  const addNewTestCase = () => {
    const newCase: GeneratedTestCase = {
      id: crypto.randomUUID(),
      input: { query: '' },
      expectedOutput: '',
      description: '',
      isEditing: true,
      category: 'Custom'
    };
    setGeneratedTestCases([...generatedTestCases, newCase]);
    setEditingCase({ input: '', expectedOutput: '' });
  };

  const startEditing = (testCase: GeneratedTestCase) => {
    setEditingCase({
      input: typeof testCase.input === 'object' ? testCase.input.query : testCase.input,
      expectedOutput: testCase.expectedOutput
    });
    setGeneratedTestCases(prev =>
      prev.map(tc =>
        tc.id === testCase.id ? { ...tc, isEditing: true } : tc
      )
    );
  };

  const saveEdit = (id: string) => {
    if (!editingCase) return;
    setGeneratedTestCases(prev =>
      prev.map(tc =>
        tc.id === id
          ? {
              ...tc,
              input: { query: editingCase.input },
              expectedOutput: editingCase.expectedOutput,
              isEditing: false
            }
          : tc
      )
    );
    setEditingCase(null);
  };

  const cancelEdit = (id: string) => {
    setGeneratedTestCases(prev =>
      prev.map(tc =>
        tc.id === id ? { ...tc, isEditing: false } : tc
      )
    );
    setEditingCase(null);
  };

  const deleteGeneratedTest = (id: string) => {
    setGeneratedTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const saveGeneratedTests = () => {
    const savedTests = JSON.parse(localStorage.getItem('generatedTests') || '[]');
    const updatedTests = [...savedTests, ...generatedTestCases];
    localStorage.setItem('generatedTests', JSON.stringify(updatedTests));
    setGeneratedTestCases([]);
  };

  const deleteAgentCase = (timestamp: string) => {
    const updatedCases = agentCases.filter(test => test.timestamp !== timestamp);
    localStorage.setItem('savedTests', JSON.stringify(updatedCases));
    setAgentCases(updatedCases);
    if (selectedCase?.timestamp === timestamp) {
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
                  key={test.timestamp}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedCase?.timestamp === test.timestamp 
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
                          deleteAgentCase(test.timestamp);
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

      {/* Middle Column - Test Output */}
      <div className="col-span-4">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader>
            <CardTitle>Test Output</CardTitle>
            <CardDescription>View and analyze test results</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {selectedCase ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Input:</p>
                  <pre className="bg-black/20 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                    {typeof selectedCase.input === 'string' 
                      ? selectedCase.input 
                      : JSON.stringify(selectedCase.input, null, 2)
                    }
                  </pre>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-zinc-400">Expected Output:</p>
                  <pre className="bg-black/20 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                    {typeof selectedCase.expectedOutput === 'string'
                      ? selectedCase.expectedOutput
                      : JSON.stringify(selectedCase.expectedOutput, null, 2)
                    }
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-zinc-500">
                Select an agent case to view details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Generated Test Cases */}
      {/* <div className="col-span-4">
        <Card className="bg-black/40 border-zinc-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Generated Test Cases</CardTitle>
              <div className="flex gap-2">
                {generatedTestCases.length > 0 ? (
                  <Button 
                    size="sm"
                    onClick={saveGeneratedTests}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save All
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => generateTestCases(selectedCase!)}
                    disabled={!selectedCase}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Tests
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-4">
              {generatedTestCases.map((testCase) => (
                <div key={testCase.id} className="p-4 bg-black/20 rounded-lg">
                  {testCase.isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-zinc-400">Test Scenario:</label>
                        <Textarea
                          value={editingCase?.input || ''}
                          onChange={(e) => setEditingCase(prev => ({
                            ...prev!,
                            input: e.target.value
                          }))}
                          placeholder="Describe the test scenario in plain English..."
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-zinc-400">Expected Behavior:</label>
                        <Textarea
                          value={editingCase?.expectedOutput || ''}
                          onChange={(e) => setEditingCase(prev => ({
                            ...prev!,
                            expectedOutput: e.target.value
                          }))}
                          placeholder="Describe what should happen..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cancelEdit(testCase.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(testCase.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-2">
                        <Badge>{testCase.category || 'Test Case'}</Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(testCase)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteGeneratedTest(testCase.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Test Scenario</p>
                          <p className="text-sm text-zinc-400">
                            {typeof testCase.input === 'object' && testCase.input.query 
                              ? testCase.input.query 
                              : testCase.input}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Description</p>
                          <p className="text-sm text-zinc-400">
                            {testCase.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {generatedTestCases.length > 0 && (
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={addNewTestCase}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
              )}

              {generatedTestCases.length === 0 && !selectedCase && (
                <div className="text-center py-8 text-zinc-500">
                  Select an agent case to generate variations
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div> */}
      <div className="col-span-4">
        <TestCaseVariations selectedTest={selectedCase} />
      </div>
    </div>
  );
}