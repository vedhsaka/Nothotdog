export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { validateAnalyzeResultsRequest } from '@/lib/validations';
import { AnthropicModel } from '@/services/llm/enums';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ModelFactory } from '@/services/llm/modelfactory';

interface AnalysisResult {
  categorizedResults: Record<string, {
    successRate: number;
    averageResponseTime: number;
  }>;
  insights: string[];
  summary: {
    overallSuccess: number;
    averageResponseTime: number;
    performance: string;
  };
  improvements: string[];
}

const analysisTemplate = ChatPromptTemplate.fromMessages([
  ["user", `Analyze these test results and provide insights:
{results}
Return the analysis as JSON with:
1. categorizedResults: Results grouped by test category with success rates and response times
2. insights: Array of strings with key findings and recommendations
3. summary: Overall metrics and performance assessment
4. improvements: Specific suggestions for improvement`]
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { results } = validateAnalyzeResultsRequest(body);

    if (!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY) {
      throw new Error('API key not configured');
    }

    const model = ModelFactory.createLangchainModel(
      AnthropicModel.Sonnet3_5,
      process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY
    );

    const analysisChain = RunnableSequence.from([
      analysisTemplate,
      model,
      new JsonOutputParser<AnalysisResult>()
    ]);

    const analysis = await analysisChain.invoke({
      results: JSON.stringify(results, null, 2)
    });

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze results' },
      { status: 500 }
    );
  }
}