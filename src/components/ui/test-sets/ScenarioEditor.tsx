import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { TestScenario } from './types';
import { MetricSelector } from './MetricSelector';

interface ScenarioEditorProps {
  scenario: TestScenario;
  onChange: (updated: TestScenario) => void;
  onDelete: () => void;
}

export function ScenarioEditor({ scenario, onChange, onDelete }: ScenarioEditorProps) {
  return (
    <Card className="bg-black/60 border-zinc-800">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Badge>{scenario.type}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <Textarea 
            placeholder="Input scenario"
            value={scenario.input}
            onChange={(e) => onChange({ ...scenario, input: e.target.value })}
          />
          <Textarea 
            placeholder="Expected output"
            value={scenario.expectedOutput}
            onChange={(e) => onChange({ ...scenario, expectedOutput: e.target.value })}
          />
          {scenario.type === 'metric' && (
            <div className="grid grid-cols-2 gap-2">
              <MetricSelector 
                scenario={scenario}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}