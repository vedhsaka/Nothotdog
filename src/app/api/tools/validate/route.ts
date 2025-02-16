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
    const { actualResponse, expectedOutput } = await req.json();

    const config = getLLMConfigForActiveModel(req.headers);
    let model;

    if (config) {
      model = ModelFactory.createLangchainModel(
        config.model as AnthropicModel | OpenAIModel,
        config.apiKey
      );
    } else {
      let apiKey;
      
      if (typeof window !== 'undefined') {
        apiKey = localStorage.getItem('anthropic_api_key');
        if (!apiKey) {
          return NextResponse.json(
            { 
              error: 'Anthropic API key not found',
              details: 'Please add your API key in settings.'
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { 
            error: 'No valid LLM configuration found',
            details: 'Neither header configuration nor localStorage API key available'
          },
          { status: 400 }
        );
      }

      model = ModelFactory.createLangchainModel(
        AnthropicModel.Sonnet3_5,
        apiKey
      );
    }

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

    if (typeof window !== 'undefined') {
      try {
        const existingValidations = JSON.parse(localStorage.getItem('validationResults') || '[]');
        const newValidation = {
          ...validation,
          timestamp: new Date().toISOString(),
          expectedOutput,
          actualResponse
        };
        localStorage.setItem('validationResults', 
          JSON.stringify([...existingValidations, newValidation])
        );
      } catch (error) {
        console.warn('Failed to store validation result in localStorage:', error);
      }
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to validate response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}