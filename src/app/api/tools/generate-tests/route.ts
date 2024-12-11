import { NextResponse } from 'next/server'
import { anthropic, MODEL } from '@/lib/claude'
import { validateGenerateTestsRequest } from '@/lib/validations'

interface GeneratedTestCase {
  input: Record<string, string>;
  description: string;
  category: string;
}

function getMessage(content: any): string {
  if (!content || !content[0]) {
    throw new Error('Invalid message content')
  }

  const block = content[0]
  if (block.type !== 'text') {
    throw new Error(`Unexpected content type: ${block.type}`)
  }

  return block.text
}

function extractJSON(text: string): any {
    // Find the last complete closing brace
    const lastBraceIndex = text.lastIndexOf('}');
    if (lastBraceIndex === -1) {
      throw new Error('No valid JSON structure found');
    }
  
    // Find the last complete test case closing brace and bracket
    let truncatedText = text.substring(0, lastBraceIndex + 1) + ']';
    
    // Find the start of the array
    const arrayStart = truncatedText.indexOf('[');
    if (arrayStart === -1) {
      throw new Error('No array start found');
    }
  
    truncatedText = truncatedText.substring(arrayStart);
  
    try {
      return JSON.parse(truncatedText);
    } catch (e) {
      throw new Error('Failed to parse truncated JSON');
    }
  }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { inputExample, agentDescription } = validateGenerateTestsRequest(body)

    // Parse input example to understand the format
    const inputFormat = JSON.parse(inputExample)

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Generate diverse test cases for an API. 
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

Return only a JSON array where each test case object has:
- input: Exactly matching the format of the example
- description: Explaining what the test is checking
- category: The type of test case
Do not include expectedOutput.`
      }]
    })

    const responseText = getMessage(message.content)
    let testCases = extractJSON(responseText)

    // Validate each test case maintains the input format
    testCases = testCases.map((testCase: GeneratedTestCase) => {
      // Ensure format matches exactly
      const formattedInput: Record<string, string> = {}
      Object.keys(inputFormat).forEach(key => {
        formattedInput[key] = testCase.input[key] || ''
      })
      return {
        ...testCase,
        input: formattedInput
      }
    })

    return NextResponse.json({ testCases })
  } catch (error) {
    console.error('Test generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate test cases',
        details: error instanceof Error ? error.message : 'Unknown error',
        testCases: []
      }, 
      { status: 500 }
    )
  }
}