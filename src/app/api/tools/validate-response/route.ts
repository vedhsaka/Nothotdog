import { NextResponse } from 'next/server';
import { anthropic, MODEL } from '@/lib/claude';

function getMessage(content: any): string {
  if (!content || !content[0]) {
    throw new Error('Invalid message content');
  }

  const block = content[0];
  if (block.type !== 'text') {
    throw new Error(`Unexpected content type: ${block.type}`);
  }

  let text = block.text;
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
  }
  
  return text;
}

export async function POST(req: Request) {
  try {
    const { actualResponse, expectedOutput, inputFormat, context, mode } = await req.json();

    if (mode === 'generate_input') {
      // Generate appropriate input based on scenario
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Given this test scenario: "${context}"
          
Generate a natural, conversational query that a user might ask to test this scenario.
The query should be clear and focused on testing the specific scenario.
Write it as if you are a real user asking a question to a real human.

The API expects input in exactly this format:
${inputFormat}

Generate an appropriate input that exactly matches this format structure.
Return only the formatted JSON, no explanation."`
        }]
      });

      return NextResponse.json(getMessage(message.content));
    }

    // Validate response
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Evaluate if this response satisfies the test scenario requirements.

Scenario: ${context}
Expected Behavior: ${expectedOutput}
Actual Response: ${actualResponse}

Consider:
1. Does the response address the core requirements of the scenario?
2. Is the information accurate and complete?
3. Is the response format appropriate?

Return JSON with:
{
  "isCorrect": true/false based on if response meets requirements,
  "explanation": Detailed explanation of why the response does or doesn't match expectations
}`
      }]
    });

    let validation;
    try {
      const textContent = getMessage(message.content);
      validation = JSON.parse(textContent);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      return NextResponse.json({
        isCorrect: false,
        explanation: "Failed to parse validation response"
      });
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { 
        isCorrect: false,
        explanation: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      },
      { status: 500 }
    );
  }
}