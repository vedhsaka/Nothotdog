import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash, Check, X, Save } from 'lucide-react';

interface GeneratedTestCase {
  id: string;
  sourceTestId: string;  // Links back to the original test case
  category?: string;
  input: string | { query: string };
  description: string;
  expectedOutput: string;
  isEditing: boolean;
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
  const [editingCase, setEditingCase] = useState<{
    input: string;
    expectedOutput: string;
  } | null>(null);

  // Load saved variations when a test is selected
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
          expectedOutput: selectedTest.expectedOutput,
          agentDescription: ''
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
          input: tc.input,
          description: tc.description,
          expectedOutput: tc.expectedOutput || '',
          category: tc.category,
          isEditing: false
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
      input: { query: '' },
      expectedOutput: '',
      description: '',
      isEditing: true,
      category: 'Custom'
    };
    
    const updatedCases = [...generatedCases, newCase];
    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.timestamp, updatedCases);
    setEditingCase({ input: '', expectedOutput: '' });
  };

  const startEditing = (testCase: GeneratedTestCase) => {
    setEditingCase({
      input: typeof testCase.input === 'object' ? testCase.input.query : testCase.input,
      expectedOutput: testCase.expectedOutput
    });
    setGeneratedCases(prev =>
      prev.map(tc =>
        tc.id === testCase.id ? { ...tc, isEditing: true } : tc
      )
    );
  };

  const saveEdit = (id: string) => {
    if (!selectedTest || !editingCase) return;
    
    const updatedCases = generatedCases.map(tc =>
      tc.id === id
        ? {
            ...tc,
            input: { query: editingCase.input },
            expectedOutput: editingCase.expectedOutput,
            isEditing: false
          }
        : tc
    );
    
    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.timestamp, updatedCases);
    setEditingCase(null);
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
                    placeholder="Describe the test scenario..."
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
                    placeholder="Describe expected behavior..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setGeneratedCases(prev =>
                        prev.map(tc =>
                          tc.id === testCase.id ? { ...tc, isEditing: false } : tc
                        )
                      );
                      setEditingCase(null);
                    }}
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
                      onClick={() => deleteTestCase(testCase.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Test Scenario</p>
                    <p className="text-sm text-zinc-400">
                    {typeof testCase.input === 'object' && 'query' in testCase.input 
                        ? testCase.input.query 
                        : String(testCase.input)}
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