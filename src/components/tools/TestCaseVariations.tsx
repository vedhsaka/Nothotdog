import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash } from "lucide-react";
import { Loading } from "../common/Loading";
import { useTestVariations } from "@/hooks/useTestVariations";
import { TestVariation } from "@/types/variations";

interface TestCase {
  id: string;
  sourceTestId: string;
  scenario: string;
  expectedOutput: string;
}

interface EditingState {
  scenario: string;
  expectedOutput: string;
}

interface TestCaseVariationsProps {
  selectedTest: {
    id: string;
    input: string;
    expectedOutput: string;
  } | null;
}

export function TestCaseVariations({ selectedTest }: TestCaseVariationsProps) {
  const [generatedCases, setGeneratedCases] = useState<TestCase[]>([]);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { 
    variationData, 
    loading, 
    error, 
    addVariation,
    updateVariation,
    deleteVariation
  } = useTestVariations(selectedTest?.id);
  

  useEffect(() => {
    if (variationData && selectedTest) {
      setGeneratedCases(
        variationData.testCases.map(tc => ({
          ...tc,
          sourceTestId: selectedTest.id,
        }))
      );
    }
  }, [variationData, selectedTest]);



  const generateTestCases = async () => {
    if (!selectedTest) return;
    const apiKey = localStorage.getItem('anthropic_api_key');
    try {
      const response = await fetch("/api/tools/generate-tests", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-API-Key": apiKey || ''
        },
        body: JSON.stringify({
          inputExample: selectedTest.input,
          expectedOutput: selectedTest.expectedOutput,
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("Generation error:", data.error);
        return;
      }

      const newCases = data.testCases.map((tc: any) => ({

        id: crypto.randomUUID(),

        sourceTestId: selectedTest.id,

        scenario: tc.scenario,

        expectedOutput: tc.expectedOutput || "",

      }));

      const variation = {
        id: crypto.randomUUID(),
        testId: selectedTest.id,
        sourceTestId: selectedTest.id,
        timestamp: new Date().toISOString(),
        cases: newCases,
      };
      addVariation(variation);
      setGeneratedCases(newCases);
    } catch (error) {
      console.error("Failed to generate test cases:", error);
    } finally {
    }
  };

  const addNewTestCase = () => {
    if (!selectedTest) return;

    const newCase = {
      id: crypto.randomUUID(),
      sourceTestId: selectedTest.id,
      scenario: "",
      expectedOutput: "",
    };
    const updatedCases = [...generatedCases, newCase];

    setGeneratedCases(updatedCases);
    setEditingId(newCase.id);
    setEditingState({ scenario: "", expectedOutput: "" });
  };

  // const saveEdit = async () => {
  //   if (!selectedTest || !editingState || !editingId) return;
  
  //   const newTestCase: TestCase = {
  //     id: editingId,
  //     sourceTestId: selectedTest.id,
  //     scenario: editingState.scenario,
  //     expectedOutput: editingState.expectedOutput,
  //   };
  
  //   const variationPayload: TestVariation = {
  //     id: crypto.randomUUID(),
  //     testId: selectedTest.id,
  //     sourceTestId: selectedTest.id,
  //     timestamp: new Date().toISOString(),
  //     cases: [ newTestCase ],
  //   };
  
  //   await addVariation(variationPayload);
  //   setGeneratedCases(prev => [...prev, newTestCase]);
  //   setEditingId(null);
  //   setEditingState(null);
  // };
  
  const saveEdit = async () => {
    if (!selectedTest || !editingState || !editingId) return;
  
    const editedTestCase: TestCase = {
      id: editingId,
      sourceTestId: selectedTest.id,
      scenario: editingState.scenario,
      expectedOutput: editingState.expectedOutput,
    };
  
    const existsInServer =
      variationData &&
      variationData.testCases.some(tc => tc.id === editingId);
  
    const payload: TestVariation = {
      id: existsInServer ? editingId : crypto.randomUUID(),
      testId: selectedTest.id,
      sourceTestId: selectedTest.id,
      timestamp: new Date().toISOString(),
      cases: [editedTestCase],
    };
  
    try {
      if (existsInServer) {
        await updateVariation(payload);
      } else {
        await addVariation(payload);
      }
  
      setGeneratedCases(prev => {
        const index = prev.findIndex(tc => tc.id === editingId);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = editedTestCase;
          return updated;
        }
        return [...prev, editedTestCase];
      });
    } catch (error) {
      console.error("Failed to save edit:", error);
    } finally {
      setEditingId(null);
      setEditingState(null);
    }
  };
  
  
  
  const toggleSelectCase = (id: string) => {
    setSelectedIds((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((selectedId) => selectedId !== id)
        : [...prevSelected, id]
    );
  };

  const selectAllCases = () => {
    if (selectedIds.length === generatedCases.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(generatedCases.map((test) => test.id));
    }
  };

  // Replace your deleteTestCase and deleteSelectedCases functions with this unified function:
    const deleteTestCases = async (idsToDelete: string[]) => {
      if (!selectedTest) return;

      // Filter out the test cases that should be deleted
      const updatedCases = generatedCases.filter(tc => !idsToDelete.includes(tc.id));

      // Create a variation object with the remaining test cases.
      const variation = {
        id: crypto.randomUUID(),
        testId: selectedTest.id,
        sourceTestId: selectedTest.id,
        timestamp: new Date().toISOString(),
        cases: updatedCases,
      };

      // Call the deletion function from your hook (which sends a DELETE request)
      await deleteVariation(variation);

      // Update your state
      setGeneratedCases(updatedCases);
      setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));

      // If currently editing one of the test cases that was deleted, clear the editing state.
      if (editingId && idsToDelete.includes(editingId)) {
        setEditingId(null);
        setEditingState(null);
      }
    };

  
  const startEditing = (testCase: TestCase) => {
    setEditingId(testCase.id);
    setEditingState({
      scenario: testCase.scenario,
      expectedOutput: testCase.expectedOutput,
    });
  };

  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          {/* <CardTitle>Generated Scenarios</CardTitle>
          {selectedTest && (
            <Button size="sm" onClick={addNewTestCase}>
              <Plus className="h-4 w-4 mr-2" />
              Add Test Case
            </Button>
          )} */}
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <Loading size="lg" message="Generating test cases..." />
            </div>
          )}

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
                   disabled={loading}
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Generate Scenarios
                 </Button>
               )
             )} 
        </div>

        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={selectAllCases}>
            {selectedIds.length === generatedCases.length
              ? "Deselect All"
              : "Select All"}
          </Button>
          <Button size="sm" onClick={() => deleteTestCases(selectedIds)} variant="destructive">
            Delete Selected
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {generatedCases.map((testCase) => (
          <div key={testCase.id}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedIds.includes(testCase.id)}
                onChange={() => toggleSelectCase(testCase.id)}
                className="mr-2"
              />
              {editingId === testCase.id ? (
                <Card className="bg-black/20 border-zinc-800">
                  <CardContent className="pt-4 space-y-4">
                    <div>
                      <label className="text-sm text-zinc-400">
                        Test Scenario
                      </label>
                      <Textarea
                        value={editingState?.scenario || ""}
                        onChange={(e) =>
                          setEditingState((prev) => ({
                            ...prev!,
                            scenario: e.target.value,
                          }))
                        }
                        placeholder="Describe the test scenario in plain English..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400">
                        Expected Output
                      </label>
                      <Textarea
                        value={editingState?.expectedOutput || ""}
                        onChange={(e) =>
                          setEditingState((prev) => ({
                            ...prev!,
                            expectedOutput: e.target.value,
                          }))
                        }
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
                      <Button size="sm" onClick={saveEdit}>
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
                          <h4 className="text-sm font-medium text-zinc-400">
                            Test Scenario
                          </h4>
                          <p className="text-sm mt-1 text-white">
                            {testCase.scenario}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-zinc-400">
                            Expected Output
                          </h4>
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
                          onClick={() => deleteTestCases([testCase.id])}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}

        {!selectedTest && (
          <div className="text-center py-8 text-zinc-500">
            Select an agent case to generate variations.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TestCaseVariations;
