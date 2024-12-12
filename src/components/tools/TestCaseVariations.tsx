import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash } from 'lucide-react';

interface GeneratedTestCase {
  id: string;
  sourceTestId: string;
  scenario: string;    // Plain English description of the test case
  expectedOutput: string;  // Plain English description of expected behavior
}

interface EditingState {
  scenario: string;
  expectedOutput: string;
}

interface TestCaseVariationsProps {
  selectedTest: {
    timestamp: string;
    input: string;
    expectedOutput: string;
  } | null;
}

export function TestCaseVariations({ selectedTest }: TestCaseVariationsProps) {
  const [generatedCases, setGeneratedCases] = useState<GeneratedTestCase[]>([]);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTest) {
      const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
      setGeneratedCases(savedVariations[selectedTest.timestamp] || []);
    }
  }, [selectedTest]);

  const generateTestCases = async () => {
    if (!selectedTest) return;

    try {
      const response = await fetch('/api/tools/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputExample: selectedTest.input,
          expectedOutput: selectedTest.expectedOutput
        })
      });

      const data = await response.json();
      if (data.error) {
        console.error('Generation error:', data.error);
        return;
      }
      
      if (data.testCases) {
        const newCases = data.testCases.map((tc: any) => ({
          id: crypto.randomUUID(),
          sourceTestId: selectedTest.timestamp,
          scenario: tc.scenario,
          expectedOutput: tc.expectedOutput || ''
        }));

        setGeneratedCases(newCases);
        saveVariations(selectedTest.timestamp, newCases);
      }
    } catch (error) {
      console.error('Failed to generate test cases:', error);
    }
  };

  const saveVariations = (testId: string, cases: GeneratedTestCase[]) => {
    const savedVariations = JSON.parse(localStorage.getItem('testVariations') || '{}');
    savedVariations[testId] = cases;
    localStorage.setItem('testVariations', JSON.stringify(savedVariations));
  };

  const addNewTestCase = () => {
    if (!selectedTest) return;
    
    const newCase: GeneratedTestCase = {
      id: crypto.randomUUID(),
      sourceTestId: selectedTest.timestamp,
      scenario: '',
      expectedOutput: ''
    };
    
    setEditingId(newCase.id);
    setEditingState({
      scenario: '',
      expectedOutput: ''
    });
    setGeneratedCases([...generatedCases, newCase]);
  };

  const startEditing = (testCase: GeneratedTestCase) => {
    setEditingId(testCase.id);
    setEditingState({
      scenario: testCase.scenario,
      expectedOutput: testCase.expectedOutput
    });
  };

  const saveEdit = () => {
    if (!selectedTest || !editingState || !editingId) return;
    
    const updatedCases = generatedCases.map(tc =>
      tc.id === editingId
        ? {
            ...tc,
            scenario: editingState.scenario,
            expectedOutput: editingState.expectedOutput
          }
        : tc
    );
    
    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.timestamp, updatedCases);
    setEditingId(null);
    setEditingState(null);
  };

  const deleteTestCase = (id: string) => {
    if (!selectedTest) return;
    
    const updatedCases = generatedCases.filter(tc => tc.id !== id);
    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.timestamp, updatedCases);
  };

  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Generated Test Cases</CardTitle>
          <div className="flex gap-2">
            {selectedTest && (
              generatedCases.length > 0 ? (
                <Button 
                  size="sm"
                  onClick={addNewTestCase}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={generateTestCases}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Tests
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {generatedCases.map((testCase) => (
          <div key={testCase.id}>
            {editingId === testCase.id ? (
              <Card className="bg-black/20 border-zinc-800">
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400">Test Scenario</label>
                    <Textarea
                      value={editingState?.scenario || ''}
                      onChange={(e) => setEditingState(prev => ({
                        ...prev!,
                        scenario: e.target.value
                      }))}
                      placeholder="Describe the test scenario in plain English..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400">Expected Output</label>
                    <Textarea
                      value={editingState?.expectedOutput || ''}
                      onChange={(e) => setEditingState(prev => ({
                        ...prev!,
                        expectedOutput: e.target.value
                      }))}
                      placeholder="Describe what should happen..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setEditingState(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveEdit}
                    >
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 border-zinc-800">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400">Test Scenario</h4>
                        <p className="text-sm mt-1 text-white">
                          {testCase.scenario}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-zinc-400">Expected Output</h4>
                        <p className="text-sm mt-1 text-zinc-300">
                          {testCase.expectedOutput}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(testCase)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTestCase(testCase.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {!selectedTest && (
          <div className="text-center py-8 text-zinc-500">
            Select an agent case to generate variations
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TestCaseVariations;