export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { validateGenerateTestsRequest } from '@/lib/validations';
import { jsonrepair } from 'jsonrepair';
import { AnthropicModel, OpenAIModel } from '@/services/llm/enums';
import { ModelFactory } from '@/services/llm/modelfactory';
import { TEST_CASES_PROMPT } from '@/services/prompts';
import { getLLMConfigForActiveModel } from '@/utils/getLLMConfigForActiveModel';

function extractJSON(text: string): any {
  try {
    const jsonStart = text.indexOf('[');
    if (jsonStart === -1) {
      const objStart = text.indexOf('{');
      if (objStart === -1) {
        console.warn('No JSON structure found');
        return { evaluations: [] };
      }
      text = text.slice(objStart);
    } else {
      text = text.slice(jsonStart);
    }
    
    const repaired = jsonrepair(text);
    const parsed = JSON.parse(repaired);
    
    if (Array.isArray(parsed)) {
      return { evaluations: parsed };
    }
    
    return parsed;
  } catch (e) {
    console.warn('JSON extraction failed:', e);
    return { evaluations: [] };
  }
}

interface Evaluation {
  scenario: string;
  expectedOutput: string;
}

function isValidEvaluation(evaluation: any): evaluation is Evaluation {
  return (
    evaluation &&
    typeof evaluation === 'object' &&
    typeof evaluation.scenario === 'string' &&
    evaluation.scenario.trim().length > 0 &&
    typeof evaluation.expectedOutput === 'string' &&
    evaluation.expectedOutput.trim().length > 0
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentDescription, userDescription } = validateGenerateTestsRequest(body);


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

    const context = `Agent Description: ${agentDescription || 'Not provided'}
User Description: ${userDescription || 'Not provided'}`;

    const prompt = TEST_CASES_PROMPT.replace('{context}', context);

    const response = await model.invoke([{
      role: 'user',
      content: prompt
    }]);

    // Log the response for debugging
    // console.log('Model response:', response.content);
      
    let evaluations = extractJSON(response.content as string);
    // console.log('Extracted evaluations:', evaluations);

    if (!evaluations?.evaluations || !Array.isArray(evaluations.evaluations)) {
      console.log('No evaluations array found, creating empty array');
      evaluations = { evaluations: [] };
    }

    const validEvaluations = evaluations.evaluations
      .filter(isValidEvaluation)
      .map((evaluation: Evaluation) => ({
        scenario: evaluation.scenario.trim(),
        expectedOutput: evaluation.expectedOutput.trim()
      }));

    // console.log('Valid evaluations:', validEvaluations);

    if (validEvaluations.length === 0) {
      return NextResponse.json({
        error: 'No valid test cases could be generated. Please try again.',
        details: 'The model response did not contain any valid test cases'
      }, { status: 400 });
    }

    return NextResponse.json({ 
      testCases: validEvaluations.map((evaluation: Evaluation) => ({
        id: crypto.randomUUID(),
        scenario: evaluation.scenario,
        expectedOutput: evaluation.expectedOutput
      }))
    });

  } catch (error: any) {
    console.error('Test generation error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to generate evaluations',
        details: typeof error === 'object' ? JSON.stringify(error) : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}