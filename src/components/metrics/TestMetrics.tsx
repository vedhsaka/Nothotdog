import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TestRun } from '@/types/runs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TestMetricsProps {
  run: TestRun;
}

export function TestMetrics({ run }: TestMetricsProps) {
  // Calculate overall success rate
  const overallSuccess = run.metrics.total > 0 ? (run.metrics.passed / run.metrics.total) : 0;

  return (
    <Card className="border border-border bg-background">
      <CardHeader>
        <CardTitle>Test Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Overall Success Rate</h3>
            <Progress value={overallSuccess * 100} className="h-2" />
            <span className="text-sm text-zinc-400 mt-1">
              {(overallSuccess * 100).toFixed(1)}%
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Response Times</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={run.results}>
                  <XAxis dataKey="scenarioId" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#10b981" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {run.metrics.sentimentScores && (
            <div>
              <h3 className="text-sm font-medium mb-2">Sentiment Analysis</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-green-400">Positive</div>
                  <Progress 
                    value={run.metrics.sentimentScores.positive * 100} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="text-sm text-yellow-400">Neutral</div>
                  <Progress 
                    value={run.metrics.sentimentScores.neutral * 100} 
                    className="h-2" 
                  />
                </div>
                <div>
                  <div className="text-sm text-red-400">Negative</div>
                  <Progress 
                    value={run.metrics.sentimentScores.negative * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}