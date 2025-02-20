import { NextResponse } from 'next/server';
import { validateGenerateTestsRequest } from '@/lib/validations';
import { jsonrepair } from 'jsonrepair';
import { AnthropicModel } from '@/services/llm/enums';
import { ModelFactory } from '@/services/llm/modelfactory';
import { TEST_CASES_PROMPT } from '@/services/prompts';
import { Evaluation } from '@/types';
import { dbService } from '@/services/db';


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
    const testId = body.testId;

    if (!testId) {
      return NextResponse.json({ error: "Missing testId" }, { status: 400 });
    }

    const agentConfig = await dbService.getAgentConfig(testId);
    if (!agentConfig) {
      return NextResponse.json({ error: "Agent config not found" }, { status: 404 });
    }

    const agentDescription = agentConfig.agent_descriptions?.[0]?.description || "Not provided";
    const userDescription = agentConfig.agent_user_descriptions?.[0]?.description || "Not provided";

    console.log("Fetched descriptions:", { agentDescription, userDescription });

    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 401 });
    }

    const model = ModelFactory.createLangchainModel(AnthropicModel.Sonnet3_5, apiKey);

    const context = `Agent Description: ${agentDescription}
User Description: ${userDescription}`;

    const prompt = TEST_CASES_PROMPT.replace("{context}", context);

    const response = await model.invoke([
      {
        role: "user",
        content: prompt as string,
      },
    ]);

    let evaluations = extractJSON(response.content as string);

    if (!evaluations?.evaluations || !Array.isArray(evaluations.evaluations)) {
      evaluations = { evaluations: [] };
    }

    const validEvaluations = evaluations.evaluations
      .filter(isValidEvaluation)
      .map((evaluation: Evaluation) => ({
        scenario: evaluation.scenario.trim(),
        expectedOutput: evaluation.expectedOutput.trim(),
      }));

    if (validEvaluations.length === 0) {
      return NextResponse.json({ error: "No valid test cases generated" }, { status: 500 });
    }

    const variation = {
      id: crypto.randomUUID(),
      testId,
      sourceTestId: testId,
      timestamp: new Date().toISOString(),
      cases: validEvaluations.map((evaluation: Evaluation) => ({
        id: crypto.randomUUID(),
        sourceTestId: testId,
        scenario: evaluation.scenario,
        expectedOutput: evaluation.expectedOutput,
      })),
    };

    await dbService.createTestVariation(variation);

    return NextResponse.json({
      testCases: variation.cases,
      stats: {
        total: evaluations.evaluations.length,
        valid: validEvaluations.length,
        filtered: evaluations.evaluations.length - validEvaluations.length,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Test generation error:", error);
      return NextResponse.json({ error: "Failed to generate evaluations", details: error.message }, { status: 500 });
    } else {
      console.error("Test generation error:", error);
      return NextResponse.json({ error: "Failed to generate evaluations", details: "Unknown error" }, { status: 500 });
    }
  }
}
