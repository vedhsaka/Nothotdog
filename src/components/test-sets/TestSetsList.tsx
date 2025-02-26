import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { TestSet } from '@/types/test-sets';
import { TestSetStorage } from '@/lib/storage';

export function TestSetsList() {
  const [testSets, setTestSets] = useState<TestSet[]>([]);

  useEffect(() => {
    const storedTestSets = TestSetStorage.getAll();
    const transformedTestSets = storedTestSets.map(storedTestSet => ({
      id: storedTestSet.id,
      name: storedTestSet.name || 'Default Name',
      description: storedTestSet.description || 'Default Description',
      scenarios: storedTestSet.scenarios || [],
      agentId: storedTestSet.agentId,
      agentName: storedTestSet.agentName,
      evaluations: storedTestSet.evaluations,
      createdAt: storedTestSet.createdAt
    }));
    setTestSets(transformedTestSets);
  }, []);

  return (
    <Card className="border border-border bg-background">
      <CardHeader>
        <CardTitle>Test Sets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testSets.map((testSet) => (
            <div
              key={testSet.id}
              className="p-4 bg-background rounded-[var(--radius)] hover:bg-background/30 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-white">{testSet.name}</h3>
                  <p className="text-sm text-zinc-400">{testSet.description}</p>
                </div>
                <div className="text-sm text-zinc-500">
                  {testSet.scenarios.length} scenarios
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}