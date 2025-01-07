export const runtime = 'edge';

import { NextResponse } from 'next/server'
import { LLMFactory, ClaudeModel } from '@/services/llm'
import { validateGenerateTestsRequest } from '@/lib/validations'
import { jsonrepair } from 'jsonrepair'

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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inputExample, agentDescription } = validateGenerateTestsRequest(body)

    const llm = LLMFactory.getInstance('claude', { model: ClaudeModel.SONNET3_5 });
    const response = await llm.complete(`Generate diverse test cases for an API. 
${agentDescription ? `Context: ${agentDescription}` : 'Context derived from example input below:'}

Input Format Example: ${inputExample}

Create 20+ varied test cases that maintain this exact input format structure but test different scenarios. Include:

1. Standard Valid Cases:
- Regular queries
- Common variations
- Different locations/contexts

2. Edge Cases:
- Very long inputs
- Special characters
- Multiple entities in query
- Numbers and mixed content

3. AI Hallucination Tests:
- Made-up but plausible-sounding places/entities
- Non-existent but realistic-looking data
- Future dates/events that don't exist yet
- Historical events with wrong dates

4. Error Cases:
- Misspelled words
- Wrong grammar
- Incomplete sentences
- Mixed languages
- Autocorrect-style errors

5. Boundary Testing:
- Empty or minimal queries
- Maximum length content
- Unicode characters
- Emojis
- HTML-like content
- SQL-like queries
- Special symbols

6. Context Confusion:
- Ambiguous queries
- Multiple possible interpretations
- Location confusion (places with same names)
- Time zone edge cases
- Historical vs current queries

Return only a JSON object in this exact format, ensuring all fields are non-null strings:
{
  "evaluations": [
    {
      "scenario": "Plain English description of what we're testing",
      "expectedOutput": "Plain English description of what the agent should do/respond with"
    }
  ]
}

Each evaluation MUST have both scenario and expectedOutput as non-empty strings.`);

    const tests = extractJSON(response.content);
    return NextResponse.json(tests);
  } catch (error) {
    console.error('Test generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tests' },
      { status: 500 }
    );
  }
}