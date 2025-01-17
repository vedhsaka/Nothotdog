export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { anthropic, MODEL } from '@/lib/claude'
import { validateTestRequest } from '@/lib/validations/testRequest'

function getMessage(content: any): string {
  if (!content || !content[0]) {
    throw new Error('Invalid message content')
  }

  const block = content[0]
  if (block.type !== 'text') {
    throw new Error(`Unexpected content type: ${block.type}`)
  }

  return block.text
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { agentEndpoint, testCases, headers } = body

    // Get the saved test case to compare against
    const savedTestCase = testCases[0]

    // Validate request format
    if (!validateTestRequest({ input: savedTestCase.input, headers }, { input: savedTestCase.input, headers: savedTestCase.headers })) {
      return NextResponse.json(
        { error: 'Invalid request format - headers or body structure does not match saved test' },
        { status: 400 }
      )
    }

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
        const evaluationMessage = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `Evaluate if this output matches the expected output and explain why:
Expected: ${JSON.stringify(testCase.expectedOutput)}
Actual: ${JSON.stringify(agentData.output)}

Return response as JSON with properties:
- isCorrect (boolean)
- explanation (string)
- matchScore (number between 0-100)`
          }]
        })

        const evaluation = JSON.parse(getMessage(evaluationMessage.content))
        
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

    // Calculate metrics
    const totalTests = results.length
    const successfulTests = results.filter(r => r.isCorrect).length
    const averageResponseTime = results.reduce((acc, r) => acc + r.responseTime, 0) / totalTests
    const averageMatchScore = results.reduce((acc, r) => acc + r.matchScore, 0) / totalTests
    const accuracy = (successfulTests / totalTests) * 100

    return NextResponse.json({
      results,
      metrics: {
        accuracy,
        averageResponseTime,
        averageMatchScore,
        totalTests,
        successfulTests
      }
    })
  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'Failed to evaluate agent' }, 
      { status: 500 }
    )
  }
}