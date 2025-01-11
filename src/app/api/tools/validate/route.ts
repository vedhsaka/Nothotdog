export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { anthropic } from '../../../../lib/claude'

export async function POST(req: Request) {
  try {
    const { actualResponse, expectedOutput } = await req.json()

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a test validation system. Compare if the actual response matches the expected output semantically.
The responses don't need to match exactly, but they should convey the same meaning and information.

Expected Output:
${expectedOutput}

Actual Response:
${actualResponse}

Respond in this exact JSON format:
{
  "isCorrect": boolean,
  "explanation": "Detailed explanation of why the response matches or doesn't match"
}

Focus on semantic meaning rather than exact wording. Consider:
1. Core information/intent matches
2. Key details are present
3. No contradictions
4. Similar level of specificity`
      }]
    })

    const validation = JSON.parse(message.content[0].type === 'text' ? message.content[0].text : '{}')

    return NextResponse.json(validation)
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to validate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 