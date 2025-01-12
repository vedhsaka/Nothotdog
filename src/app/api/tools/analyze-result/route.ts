export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { anthropic, MODEL } from '@/lib/claude'
import { validateAnalyzeResultsRequest } from '@/lib/validations'

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
    const { results } = validateAnalyzeResultsRequest(body)

    const analysisMessage = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Analyze these test results and provide insights:
${JSON.stringify(results, null, 2)}

Return the analysis as JSON with:
1. categorizedResults: Results grouped by test category with success rates and response times
2. insights: Array of strings with key findings and recommendations
3. summary: Overall metrics and performance assessment
4. improvements: Specific suggestions for improvement`
      }]
    })

    const analysis = JSON.parse(getMessage(analysisMessage.content))
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze results' }, 
      { status: 500 }
    )
  }
}