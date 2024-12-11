import { z } from 'zod'

const TestCaseSchema = z.object({
  input: z.any(),
  expectedOutput: z.any(),
  description: z.string(),
  category: z.string().optional()
})

// in src/lib/validations.ts
  const GenerateTestsRequestSchema = z.object({
    inputExample: z.string(),
    expectedOutput: z.string(),
    agentDescription: z.string().optional().default('') // Make it optional with default value
  });

  const EvaluateAgentRequestSchema = z.object({
    agentEndpoint: z.string().url(),
    headers: z.record(z.string(), z.string()),
    testCases: z.array(TestCaseSchema)
  })

const AnalyzeResultsRequestSchema = z.object({
  results: z.array(z.object({
    testCase: TestCaseSchema,
    output: z.any(),
    responseTime: z.number(),
    isCorrect: z.boolean(),
    matchScore: z.number(),
    explanation: z.string(),
    error: z.string().nullable()
  }))
})

export function validateGenerateTestsRequest(data: unknown) {
  return GenerateTestsRequestSchema.parse(data)
}

export function validateEvaluateAgentRequest(data: unknown) {
  return EvaluateAgentRequestSchema.parse(data)
}

export function validateAnalyzeResultsRequest(data: unknown) {
  return AnalyzeResultsRequestSchema.parse(data)
}