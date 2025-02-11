export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { validateGenerateTestsRequest } from '@/lib/validations';
import { jsonrepair } from 'jsonrepair';
import { AnthropicModel } from '@/services/llm/enums';
import { ModelFactory } from '@/services/llm/modelfactory';
import { TEST_CASES_PROMPT } from '@/services/prompts';
import { Evaluation } from '@/types/test-sets';


function extractJSON(text: string): any {
  try {
    // Find the array start
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
    
    // Repair and parse the JSON
    const repaired = jsonrepair(text);
    const parsed = JSON.parse(repaired);
    
    // If we got an array directly, wrap it
    if (Array.isArray(parsed)) {
      return { evaluations: parsed };
    }
    
    return parsed;
  } catch (e) {
    console.warn('JSON extraction failed:', e);
    return { evaluations: [] };
  }
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

    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      throw new Error('API key not found in request headers');
    }

    const model = ModelFactory.createLangchainModel(
      AnthropicModel.Sonnet3_5,
      apiKey
    );

    const context = `Agent Description: ${agentDescription || 'Not provided'}
User Description: ${userDescription || 'Not provided'}`;

    const prompt = TEST_CASES_PROMPT
      .replace('{context}', context)

      const response = await model.invoke([{
        role: 'user',
        content: prompt as string
       }]);
      
      let evaluations = extractJSON(response.content as string);


    // Validate the structure and filter out invalid entries
    if (!evaluations?.evaluations || !Array.isArray(evaluations.evaluations)) {
      evaluations = { evaluations: [] };
    }

    const validEvaluations = evaluations.evaluations
      .filter(isValidEvaluation)
      .map((evaluation: Evaluation) => ({
        scenario: evaluation.scenario.trim(),
        expectedOutput: evaluation.expectedOutput.trim()
      }));

    if (validEvaluations.length === 0) {
      throw new Error('No valid evaluations generated');
    }

    console.log(`Filtered ${evaluations.evaluations.length - validEvaluations.length} invalid evaluations`);

    return NextResponse.json({ 
      testCases: validEvaluations.map((evaluation: Evaluation) => ({
        id: crypto.randomUUID(),
        scenario: evaluation.scenario,
        expectedOutput: evaluation.expectedOutput
      })),
      stats: {
        total: evaluations.evaluations.length,
        valid: validEvaluations.length,
        filtered: evaluations.evaluations.length - validEvaluations.length
      }
    });
  } catch (error) {
    console.error('Test generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate evaluations',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}