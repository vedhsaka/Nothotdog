export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { LLMFactory, ClaudeModel } from '@/services/llm'
import { validateAnalyzeResultsRequest } from '@/lib/validations'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { results } = validateAnalyzeResultsRequest(body)

    const llm = LLMFactory.getInstance('claude', { model: ClaudeModel.SONNET3_5 });
    const response = await llm.complete(`Analyze these test results and provide insights:
${JSON.stringify(results, null, 2)}

Return the analysis as JSON with:
1. categorizedResults: Results grouped by test category with success rates and response times
2. insights: Array of strings with key findings and recommendations
3. summary: Overall metrics and performance assessment
4. improvements: Specific suggestions for improvement`);

    const analysis = JSON.parse(response.content)
    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze results' }, 
      { status: 500 }
    )
  }
}