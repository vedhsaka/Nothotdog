export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { LLMFactory, ClaudeModel } from '@/services/llm'
import { validateEvaluateAgentRequest } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agentEndpoint, headers, testCases } = validateEvaluateAgentRequest(body)

    const results = await Promise.all(testCases.map(async (testCase: any) => {
      const startTime = Date.now()
      const body = JSON.stringify({ input: testCase.input })

      try {
        // Test the agent
        const agentResponse = await fetch(agentEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body
        })
        
        const agentData = await agentResponse.json()
        const endTime = Date.now()
        const responseTime = endTime - startTime

        // Use Claude to evaluate the response
        const llm = LLMFactory.getInstance('claude', { model: ClaudeModel.SONNET3_5 });
        const response = await llm.complete(`Evaluate if this output matches the expected output and explain why:
Expected: ${JSON.stringify(testCase.expectedOutput)}
Actual: ${JSON.stringify(agentData.output)}

Return response as JSON with properties:
- isCorrect (boolean)
- explanation (string)
- matchScore (number between 0-100)`);

        const evaluation = JSON.parse(response.content)
        
        return {
          testCase,
          output: agentData.output,
          responseTime,
          isCorrect: evaluation.isCorrect,
          matchScore: evaluation.matchScore,
          explanation: evaluation.explanation,
          error: null
        }
      } catch (error) {
        return {
          testCase,
          output: null,
          responseTime: 0,
          isCorrect: false,
          matchScore: 0,
          explanation: 'Failed to get response from agent',
          error: 'Failed to get response from agent'
        }
      }
    }))

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate agent' },
      { status: 500 }
    )
  }
}