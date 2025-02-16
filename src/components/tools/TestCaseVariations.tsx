import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash } from "lucide-react";
import { TestVariation } from "@/types/variations";
import { Loading } from "../common/Loading";

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
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (selectedTest) {
      const savedVariations = JSON.parse(
        localStorage.getItem("testVariations") || "{}"
      );
      const testVariations = savedVariations[selectedTest.id] || [];
      const latestVariation = testVariations[testVariations.length - 1];
      setGeneratedCases(latestVariation?.cases || []);
    }
  }, [selectedTest]);

  const generateTestCases = async () => {
    if (!selectedTest) return;
    // const apiKey = localStorage.getItem("anthropic_api_key");
    let apiKey = localStorage.getItem("anthropic_api_key");
    while (!apiKey) {
      apiKey = prompt("Anthropic API key not found. Please enter your API key");
    }

    setLoading(true);

    try {
      const response = await fetch("/api/tools/generate-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
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

      if (data.testCases) {
        const newCases = data.testCases.map((tc: any) => ({
          id: crypto.randomUUID(),
          sourceTestId: selectedTest.id,
          scenario: tc.scenario,
          expectedOutput: tc.expectedOutput || "",
        }));

        setGeneratedCases(newCases);
        saveVariations(selectedTest.id, newCases);
      }
    } catch (error) {
      console.error("Failed to generate test cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveVariations = (testId: string, cases: TestCase[]) => {
    if (!selectedTest) return;

    const savedVariations = JSON.parse(
      localStorage.getItem("testVariations") || "{}"
    );
    const testVariations = savedVariations[testId] || [];

    const variation: TestVariation = {
      id: crypto.randomUUID(),
      testId: selectedTest.id,
      sourceTestId: testId,
      timestamp: new Date().toISOString(),
      cases,
    };

    savedVariations[testId] = [...testVariations, variation];
    localStorage.setItem("testVariations", JSON.stringify(savedVariations));
  };

  const addNewTestCase = () => {
    if (!selectedTest) return;

    const newCase: TestCase = {
      id: crypto.randomUUID(),
      sourceTestId: selectedTest.id,
      scenario: "",
      expectedOutput: "",
    };

    setEditingId(newCase.id);
    setEditingState({
      scenario: "",
      expectedOutput: "",
    });
    setGeneratedCases([newCase, ...generatedCases]);
  };

  const startEditing = (testCase: TestCase) => {
    setEditingId(testCase.id);
    setEditingState({
      scenario: testCase.scenario,
      expectedOutput: testCase.expectedOutput,
    });
  };

  const saveEdit = () => {
    if (!selectedTest || !editingState || !editingId) return;

    const updatedCases = generatedCases.map((tc) =>
      tc.id === editingId
        ? {
            ...tc,
            scenario: editingState.scenario,
            expectedOutput: editingState.expectedOutput,
          }
        : tc
    );

    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.id, updatedCases);
    setEditingId(null);
    setEditingState(null);
  };

  const deleteTestCase = (id: string) => {
    if (!selectedTest) return;

    const updatedCases = generatedCases.filter((tc) => tc.id !== id);
    setGeneratedCases(updatedCases);
    saveVariations(selectedTest.id, updatedCases);

    // Remove from selectedIds if deleted
    setSelectedIds((prevSelected) =>
      prevSelected.filter((selectedId) => selectedId !== id)
    );
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
      setSelectedIds([]); // Deselect all if all are selected
    } else {
      setSelectedIds(generatedCases.map((test) => test.id)); // Select all
    }
  };

  const deleteSelectedCases = () => {
    if (!selectedTest) return;

    const updatedCases = generatedCases.filter(
      (tc) => !selectedIds.includes(tc.id)
    );
    setGeneratedCases(updatedCases);

    // Update local storage after deletion
    saveVariations(selectedTest.id, updatedCases);

    // Clear selection
    setSelectedIds([]);

    // Reset editing state if necessary
    if (editingId && selectedIds.includes(editingId)) {
      setEditingId(null);
      setEditingState(null);
    }
  };

  const showBulkActions = generatedCases.length > 1 && selectedIds.length > 0;

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="bg-black/40 border-zinc-800 max-h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
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

          {selectedTest &&
            (generatedCases.length > 0 ? (
              <Button size="sm" onClick={addNewTestCase}>
                <Plus className="h-4 w-4 mr-2" />
                Add Test Case
              </Button>
            ) : (
              <Button size="sm" onClick={generateTestCases} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Scenarios
              </Button>
            ))}
        </div>

        {showBulkActions && (
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={selectAllCases}>
              {selectedIds.length === generatedCases.length
                ? "Deselect All"
                : "Select All"}
            </Button>
            <Button
              size="sm"
              onClick={deleteSelectedCases}
              variant="destructive"
            >
              Delete Selected
            </Button>
          </div>
        )}
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
                <Card className="bg-black/20 border-zinc-800 p-4 flex-1">
                  <CardContent className="pt-4 space-y-4 flex-1">
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
                        className="mt-1 w-full"
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
                        className="mt-1 w-full"
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
