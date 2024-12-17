import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/claude'

export async function POST(req: Request) {
  try {
    const { scenario, inputFormat } = await req.json()

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Given this input format:
${inputFormat}

Generate an input for this scenario:
${scenario}

The input should:
1. Follow the exact same structure/format as the example
2. Include relevant details from the scenario
3. Maintain all required fields and data types
4. Be valid JSON if the format is JSON

Return ONLY the generated input, nothing else.`
      }]
    })

    let input = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Clean up the input
    input = input.trim()
    
    // If it's JSON, validate it
    if (inputFormat.trim().startsWith('{') || inputFormat.trim().startsWith('[')) {
      try {
        // Parse and stringify to ensure valid JSON
        const parsed = JSON.parse(input)
        input = JSON.stringify(parsed)
      } catch (e) {
        console.error('Invalid JSON generated:', input)
        console.error('Parse error:', e)
        throw new Error('Generated input is not valid JSON')
      }
    }

    return NextResponse.json({ input })
  } catch (error) {
    console.error('Input generation error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate input',
        details: error instanceof Error ? error.message : 'Unknown error',
        // Add more debug info
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 