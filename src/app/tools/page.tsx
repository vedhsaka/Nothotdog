'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Plus, 
  Trash,
  Save
} from 'lucide-react'
import { ResponseTime } from '@/components/tools/ResponseTime'
import { RuleSystem } from '@/components/tools/RuleSystem'
import { Rule } from '@/components/tools/types'

interface Header {
  key: string;
  value: string;
}

export default function ToolsPage() {
  const [testName, setTestName] = useState('')
  const [agentEndpoint, setAgentEndpoint] = useState('')
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }])
  const [manualInput, setManualInput] = useState('')
  const [manualResponse, setManualResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [responseTime, setResponseTime] = useState(0)
  const [rules, setRules] = useState<Rule[]>([])

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '' }])
  }

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index))
  }

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers]
    newHeaders[index][field] = value
    setHeaders(newHeaders)
  }

  const getHeaders = () => {
    const headerObj: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    headers.forEach(header => {
      if (header.key && header.value) {
        headerObj[header.key] = header.value
      }
    })
    return headerObj
  }

  const testManually = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch(agentEndpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(JSON.parse(manualInput))
      });
      const data = await response.json();
      setManualResponse(JSON.stringify(data, null, 2));
      setResponseTime(Date.now() - startTime);
    } catch (error) {
      console.error('Test failed:', error);
      setManualResponse('Error: Failed to get response from agent');
    }
    setLoading(false);
  };

  const saveTest = () => {
    const testCase = {
      name: testName,
      agentEndpoint,
      headers: getHeaders(),
      input: manualInput,
      expectedOutput: manualResponse,
      rules,
      responseTime,
      timestamp: new Date().toISOString()
    };

    const existingTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    localStorage.setItem('savedTests', JSON.stringify([...existingTests, testCase]));
    alert('Test case saved successfully!');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Manual Testing</h2>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter test name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-64 bg-black/20"
          />
          <Button onClick={saveTest} disabled={!manualResponse || !testName}>
            <Save className="mr-2 h-4 w-4" />
            Save Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-zinc-800">
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Configure your AI agent endpoint and headers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Agent Endpoint</Label>
                <Input
                  value={agentEndpoint}
                  onChange={(e) => setAgentEndpoint(e.target.value)}
                  placeholder="https://your-agent-endpoint.com/api"
                  className="bg-black/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Headers</Label>
                  <Button variant="outline" size="sm" onClick={addHeader}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Header
                  </Button>
                </div>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Header key"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        className="flex-1 bg-black/20"
                      />
                      <Input
                        placeholder="Header value"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        className="flex-1 bg-black/20"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeHeader(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Input</Label>
                <Textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter your test input..."
                  className="min-h-[200px] bg-black/20"
                />
              </div>

              <Button 
                onClick={testManually}
                disabled={loading || !manualInput || !agentEndpoint}
                className="w-full"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {loading ? 'Testing...' : 'Test Agent'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Response */}
        <div className="space-y-6">
          <Card className="bg-black/40 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Response</CardTitle>
                {responseTime > 0 && <ResponseTime time={responseTime} />}
              </div>
            </CardHeader>
            <CardContent>
              {manualResponse ? (
                <RuleSystem
                  response={JSON.parse(manualResponse)}
                  rules={rules}
                  onRuleChange={setRules}
                />
              ) : (
                <div className="min-h-[200px] bg-black/20 rounded-lg flex items-center justify-center text-zinc-500">
                  Agent response will appear here...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}