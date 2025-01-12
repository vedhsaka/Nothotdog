import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity } from 'lucide-react'
import { TestCase, EvaluationResult } from './types'
import { formatPercentage, formatDuration } from '@/lib/utils'
import { agentTestApi } from '@/lib/api/agentTest'

interface Props {
  testCases: TestCase[]
  onEvaluationComplete: (results: EvaluationResult[]) => void
  agentEndpoint: string
  headers: Record<string, string>
}

export function AgentEvaluator({ testCases, onEvaluationComplete, agentEndpoint, headers }: Props) {
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([])
  const [loading, setLoading] = useState(false)


  const runEvaluation = async () => {
    setLoading(true)
    try {
      const response = await agentTestApi.evaluateAgent(agentEndpoint, testCases, headers)
      setEvaluationResults(response.results)
      onEvaluationComplete(response.results)
    } catch (error) {
      console.error('Failed to evaluate agent:', error)
    }
    setLoading(false)
  }

  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <CardTitle>Agent Evaluator</CardTitle>
        <CardDescription>Evaluate agent performance using Claude</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runEvaluation}
          disabled={loading || testCases.length === 0 || !agentEndpoint}
          className="w-full"
        >
          <Activity className="mr-2 h-4 w-4" />
          {loading ? 'Evaluating...' : 'Run Evaluation'}
        </Button>

        {evaluationResults.length > 0 && (
          <div className="space-y-2">
            {evaluationResults.map((result, index) => (
              <div key={index} className="p-3 bg-black/60 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Test Case {index + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {result.isCorrect ? 'Pass' : 'Fail'}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-2">{result.explanation}</p>
                <div className="mt-2 text-xs">
                  <p><span className="text-zinc-500">Match Score:</span> {formatPercentage(result.matchScore)}</p>
                  <p><span className="text-zinc-500">Response Time:</span> {formatDuration(result.responseTime)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}