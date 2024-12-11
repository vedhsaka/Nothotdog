// src/app/api/tools/validate-response/route.ts
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
  
    // Strip markdown code blocks if present
    let text = block.text;
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    }
    
    return text;
  }

  export async function POST(req: Request) {
    try {
      const { actualResponse, expectedOutput, context } = await req.json();
  
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: `Validate if this weather response is appropriate and correct.
  
  Context: ${context}
  Expected Criteria: A weather report should:
  - Provide accurate current weather information
  - Include temperature (in both C and F)
  - Include conditions (clouds, rain, etc.)
  - Include humidity, wind, pressure, and visibility
  - Handle any location or time references correctly
  - Be clearly formatted and readable
  
  Actual Response: ${actualResponse}
  
  Return JSON with:
  {
    "isCorrect": Whether the response meets weather reporting criteria,
    "explanation": Why the response is correct or incorrect,
    "matchScore": A score from 0-100 based on completeness and accuracy
  }`
        }]
      });
  
      let validation;
      try {
        const textContent = getMessage(message.content);
        console.log('Claude response:', textContent);
        validation = JSON.parse(textContent);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw content:', message.content);
        return NextResponse.json({
          isCorrect: false,
          explanation: "Failed to parse validation response",
          matchScore: 0
        });
      }
  
      return NextResponse.json(validation);
    } catch (error) {
      console.error('Validation error:', error);
      return NextResponse.json(
        { 
          isCorrect: false,
          explanation: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          matchScore: 0
        },
        { status: 500 }
      );
    }
  }