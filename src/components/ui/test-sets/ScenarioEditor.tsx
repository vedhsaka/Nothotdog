import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { ConversationStep, TestScenario } from '@/types/test';

interface ScenarioEditorProps {
  scenario: TestScenario;
  onChange: (updated: TestScenario) => void;
  onDelete: () => void;
}

export function ScenarioEditor({ scenario, onChange, onDelete }: ScenarioEditorProps) {
  const addConversationStep = () => {
    onChange({
      ...scenario,
      steps: [
        ...(scenario.steps || []),
        {
          id: crypto.randomUUID(),
          role: 'user',
          content: '',
          validationPoints: {
            contains: [],
            notContains: []
          }
        }
      ]
    });
  };

  const updateStep = (index: number, step: Partial<ConversationStep>) => {
    const newSteps = [...(scenario.steps || [])];
    newSteps[index] = { ...newSteps[index], ...step };
    onChange({ ...scenario, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = [...(scenario.steps || [])];
    newSteps.splice(index, 1);
    onChange({ ...scenario, steps: newSteps });
  };

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
        <div className="space-y-4">
          <Textarea 
            placeholder="Scenario description"
            value={scenario.scenario}
            onChange={(e) => onChange({ ...scenario, scenario: e.target.value })}
          />
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Conversation Flow</h4>
              <Button variant="ghost" size="sm" onClick={addConversationStep}>
                <Plus className="h-4 w-4 mr-2" />
                Add Step
              </Button>
            </div>
            
            {(scenario.steps || []).map((step, index) => (
              <Card key={index} className="bg-black/40 border-zinc-800">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant={step.role === 'user' ? 'default' : 'secondary'}>
                      {step.role}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Textarea 
                    placeholder="Message content"
                    value={step.content}
                    onChange={(e) => updateStep(index, { content: e.target.value })}
                  />
                  
                  {step.role === 'user' && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-zinc-400">Validation Points</h5>
                      <Textarea 
                        placeholder="Expected phrases (one per line)"
                        value={step.validationPoints?.contains?.join('\n') || ''}
                        onChange={(e) => updateStep(index, {
                          validationPoints: {
                            ...step.validationPoints,
                            contains: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                      />
                      <Textarea 
                        placeholder="Forbidden phrases (one per line)"
                        value={step.validationPoints?.notContains?.join('\n') || ''}
                        onChange={(e) => updateStep(index, {
                          validationPoints: {
                            ...step.validationPoints,
                            notContains: e.target.value.split('\n').filter(Boolean)
                          }
                        })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}