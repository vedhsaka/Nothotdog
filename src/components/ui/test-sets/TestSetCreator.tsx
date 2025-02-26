import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TestSet } from './types';
import { TestScenario } from '@/types/test';
import { ScenarioEditor } from './ScenarioEditor';

export function TestSetCreator() {
  const [testSet, setTestSet] = useState<TestSet>({
    name: '',
    description: '',
    scenarios: [],
  });

  const addScenario = (type: TestScenario['type']) => {
    setTestSet(prev => ({
      ...prev,
      scenarios: [...prev.scenarios, {
        id: crypto.randomUUID(),
        scenario: '',
        input: '',
        expectedOutput: '',
        type,
      }]
    }));
  };

  return (
    <Card className="border border-border bg-background">
      <CardHeader>
        <CardTitle>Create Test Set</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input 
            placeholder="Test Set Name"
            value={testSet.name}
            onChange={(e) => setTestSet(prev => ({ ...prev, name: e.target.value }))}
          />
          <Textarea 
            placeholder="Description"
            value={testSet.description}
            onChange={(e) => setTestSet(prev => ({ ...prev, description: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button onClick={() => addScenario('transcript')}>Add Transcript</Button>
            <Button onClick={() => addScenario('rule')}>Add Rule</Button>
            <Button onClick={() => addScenario('metric')}>Add Metric</Button>
          </div>
          {testSet.scenarios.map((scenario) => (
            <ScenarioEditor 
              key={scenario.id}
              scenario={scenario}
              onChange={(updated) => {
                setTestSet(prev => ({
                  ...prev,
                  scenarios: prev.scenarios.map(s => 
                    s.id === scenario.id ? updated : s
                  )
                }));
              }}
              onDelete={() => {
                setTestSet(prev => ({
                  ...prev,
                  scenarios: prev.scenarios.filter(s => s.id !== scenario.id)
                }));
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
