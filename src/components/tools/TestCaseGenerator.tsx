import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code } from 'lucide-react'
import { TestCase } from './types'

interface Props {
  onTestCasesGenerated: (testCases: TestCase[]) => void;
  agentDescription: string;  // Added this prop
}

export function TestCaseGenerator({ onTestCasesGenerated, agentDescription }: Props) {
  const [inputExample, setInputExample] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTestCases = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/tools/generate-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputExample, 
          expectedOutput,
          agentDescription // Include agent description in the request
        })
      })
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.details || data.error)
      }
      
      setTestCases(data.testCases || [])
      onTestCasesGenerated(data.testCases || [])
    } catch (error) {
      console.error('Failed to generate test cases:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate test cases')
      setTestCases([])
      onTestCasesGenerated([])
    }
    setLoading(false)
  }

  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <CardTitle>Test Case Generator</CardTitle>
        <CardDescription>Create sophisticated test cases using Claude</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label>Input Example</Label>
            <Textarea
              value={inputExample}
              onChange={(e) => setInputExample(e.target.value)}
              placeholder="Enter an example input..."
              className="mt-2"
            />
          </div>
          <div>
            <Label>Expected Output</Label>
            <Textarea
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              placeholder="Enter the expected output..."
              className="mt-2"
            />
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={generateTestCases}
          disabled={loading || !inputExample || !expectedOutput}
          className="w-full"
        >
          <Code className="mr-2 h-4 w-4" />
          {loading ? 'Generating...' : 'Generate Test Cases'}
        </Button>
        
        {testCases.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium">Generated Test Cases:</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {testCases.map((testCase, index) => (
                <div key={index} className="p-3 bg-black/60 rounded-lg">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-zinc-400">{testCase.description}</p>
                    {testCase.category && (
                      <span className="text-xs bg-zinc-800 px-2 py-1 rounded">
                        {testCase.category}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs space-y-1">
                    <p><span className="text-zinc-500">Input:</span> {JSON.stringify(testCase.input)}</p>
                    <p><span className="text-zinc-500">Expected:</span> {JSON.stringify(testCase.expectedOutput)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}