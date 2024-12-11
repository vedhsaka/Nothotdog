import { Select } from '@/components/ui/select';
import { TestScenario } from './types';

interface MetricSelectorProps {
  scenario: TestScenario;
  onChange: (updated: TestScenario) => void;
}

export function MetricSelector({ scenario, onChange }: MetricSelectorProps) {
  const metrics = [
    { label: 'Sentiment Analysis', value: 'sentimentAnalysis' },
    { label: 'Response Quality', value: 'responseQuality' },
    { label: 'Hallucination Check', value: 'hallucination' },
  ];

  return (
    <>
      {metrics.map(metric => (
        <div key={metric.value} className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">{metric.label}</label>
          <input 
            type="number"
            min="0"
            max="1"
            step="0.1"
            className="w-20 bg-black/40 border border-zinc-800 rounded p-1"
            value={scenario.metrics?.[metric.value] || 0}
            onChange={(e) => {
              onChange({
                ...scenario,
                metrics: {
                  ...scenario.metrics,
                  [metric.value]: parseFloat(e.target.value)
                }
              });
            }}
          />
        </div>
      ))}
    </>
  );
}