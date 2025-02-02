export const TEST_CASES_PROMPT = `Generate diverse test cases for an API. 
{context}

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

Each evaluation MUST have both scenario and expectedOutput as non-empty strings.`;
