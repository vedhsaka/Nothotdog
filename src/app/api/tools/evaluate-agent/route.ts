export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { validateTestRequest } from '@/lib/validations/testRequest';
import { AnthropicModel } from '@/services/llm/enums';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ModelFactory } from '@/services/llm/modelfactory';

const evaluationTemplate = ChatPromptTemplate.fromMessages([
  ["user", `Evaluate if this output matches the expected output and explain why:
Expected: {expectedOutput}
Actual: {actualOutput}
Return response as JSON with properties:
- isCorrect (boolean)
- explanation (string)
- matchScore (number between 0-100)`]
]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentEndpoint, testCases, headers } = body;
    
    // Get the saved test case to compare against
    const savedTestCase = testCases[0];
    
    // Validate request format
    if (!validateTestRequest(
      { input: savedTestCase.input, headers }, 
      { input: savedTestCase.input, headers: savedTestCase.headers }
    )) {
      return NextResponse.json(
        { error: 'Invalid request format - headers or body structure does not match saved test' },
        { status: 400 }
      );
    }

    const apiKey = localStorage.getItem('anthropic_api_key');
    if (!apiKey) {
      throw new Error('Anthropic API key not found. Please add your API key in settings.');
    }

    const model = ModelFactory.createLangchainModel(
      AnthropicModel.Sonnet3_5,
      apiKey
    );

    const evaluationChain = RunnableSequence.from([
      evaluationTemplate,
      model,
      new JsonOutputParser<{
        isCorrect: boolean;
        explanation: string;
        matchScore: number;
      }>()
    ]);

    const results = await Promise.all(testCases.map(async (testCase: any) => {
      const startTime = Date.now();
      const body = JSON.stringify({ input: testCase.input });

      try {
        // Test the agent
        const agentResponse = await fetch(agentEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body
        });
        const agentData = await agentResponse.json();
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Use Langchain chain for evaluation
        const evaluation = await evaluationChain.invoke({
          expectedOutput: JSON.stringify(testCase.expectedOutput),
          actualOutput: JSON.stringify(agentData.output)
        });

        return {
          testCase,
          output: agentData.output,
          responseTime,
          isCorrect: evaluation.isCorrect,
          matchScore: evaluation.matchScore,
          explanation: evaluation.explanation,
          error: null
        };
      } catch (error) {
        return {
          testCase,
          output: null,
          responseTime: 0,
          isCorrect: false,
          matchScore: 0,
          explanation: 'Failed to get response from agent',
          error: 'Failed to get response from agent'
        };
      }
    }));

    // Calculate metrics
    const totalTests = results.length;
    const successfulTests = results.filter(r => r.isCorrect).length;
    const averageResponseTime = results.reduce((acc, r) => acc + r.responseTime, 0) / totalTests;
    const averageMatchScore = results.reduce((acc, r) => acc + r.matchScore, 0) / totalTests;
    const accuracy = (successfulTests / totalTests) * 100;

    return NextResponse.json({
      results,
      metrics: {
        accuracy,
        averageResponseTime,
        averageMatchScore,
        totalTests,
        successfulTests
      }
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate agent' },
      { status: 500 }
    );
  }
}