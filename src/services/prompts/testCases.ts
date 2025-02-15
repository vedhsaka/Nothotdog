export const TEST_CASES_PROMPT = `
Generate 20+ diverse and unique test cases for an API using the exact input format below. The test cases must cover a wide range of scenarios without overlapping significantly. Each test case should have a clear and concise description of both the scenario and the expected behavior of the agent in plain English. The {context} placeholder should be treated as additional background information to be appended to each scenario as needed.

Ensure that:
1. Standard Valid Cases:  
   - Regular queries  
   - Common variations  
   - Different locations/contexts  

2. Edge Cases: 
   - Extremely long inputs (e.g., a string of 10,000 characters)  
   - Special characters  
   - Multiple entities in one query  
   - Mixes of numbers and letters  

3. AI Hallucination Tests: 
   - Made-up but plausible-sounding places/entities  
   - Realistic-looking data that doesn’t exist  
   - Future dates/events that are impossible  
   - Historical events with incorrect dates  

4. Error Cases:
   - Misspelled words  
   - Incorrect grammar  
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
   - Queries with multiple interpretations  
   - Location confusion (e.g., places with identical names)  
   - Time zone edge cases  
   - Conflicts between historical and current data  

Return only a JSON object with exactly the following format (do not include any additional fields or commentary):

{
  "evaluations": [
    {
      "scenario": "Plain English description of what we're testing. Must include reference to the {context} if applicable.",
      "expectedOutput": "Plain English description of what the agent should do or respond with in this scenario."
    }
  ]
}

Each evaluation MUST have both 'scenario' and 'expectedOutput' as non-empty strings.

Example JSON output:

{
  "evaluations": [
    {
      "scenario": "Test a query with an extremely long input string (e.g., 10,000 random characters) appended with the provided context.",
      "expectedOutput": "The agent should either truncate the input appropriately or return a clear error message explaining that the input is too long."
    },
    // ... at least 19 more unique test cases
  ]
}
`;

