export const runtime = 'edge';

import { ModelFactory } from '@/services/llm/modelfactory';
import { AnthropicModel, OpenAIModel } from '@/services/llm/enums';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { NextResponse } from 'next/server'
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { getLLMConfigForActiveModel } from '@/utils/getLLMConfigForActiveModel';

const validationTemplate = ChatPromptTemplate.fromMessages([
  ["user", `You are a test validation system. Compare if the actual response matches the expected output semantically.
The responses don't need to match exactly, but they should convey the same meaning and information.

Expected Output:
{expectedOutput}

Actual Response:
{actualResponse}

Respond in this exact JSON format:
{
  "isCorrect": boolean,
  "explanation": "Detailed explanation of why the response matches or doesn't match"
}

Focus on semantic meaning rather than exact wording. Consider:
1. Core information/intent matches
2. Key details are present
3. No contradictions
4. Similar level of specificity`]
]);

export async function POST(req: Request) {
  try {
    const { actualResponse, expectedOutput } = await req.json()
    
    const config = getLLMConfigForActiveModel(req.headers);
    
    if (!config) {
      return NextResponse.json(
        { error: 'Missing or invalid LLM configuration' },
        { status: 400 }
      );
    }

    const model = ModelFactory.createLangchainModel(
      config.model as AnthropicModel | OpenAIModel,
      config.apiKey
    );

    const chain = RunnableSequence.from([
      validationTemplate,
      model,
      new JsonOutputParser<{
        isCorrect: boolean;
        explanation: string;
      }>()
    ]);

    const validation = await chain.invoke({
      expectedOutput,
      actualResponse
    });

    return NextResponse.json(validation);
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