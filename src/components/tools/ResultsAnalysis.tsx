import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Analysis } from './types'

interface Props {
  analysis: Analysis | null
}

export function ResultsAnalysis({ analysis }: Props) {
  if (!analysis) return null

  return (
    <Card className="border border-border bg-background">
      <CardHeader>
        <CardTitle>Results Analysis</CardTitle>
        <CardDescription>AI-powered insights and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={Object.entries(analysis.categorizedResults).map(([category, data]) => ({
                name: category,
                successRate: data.successRate,
                responseTime: data.averageResponseTime
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="successRate" stroke="#10B981" name="Success Rate %" />
                <Line type="monotone" dataKey="responseTime" stroke="#F59E0B" name="Response Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Performance Insights</h3>
              <div className="space-y-2">
                {analysis.insights.map((insight, index) => (
                  <Alert key={index} className="bg-background/60 border-border">
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Suggested Improvements</h3>
              <div className="space-y-2">
                {analysis.improvements.map((improvement, index) => (
                  <Alert key={index} className="bg-background/60 border-border">
                    <AlertDescription>{improvement}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}