'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  MessageSquare, 
  Plus, 
  Trash,
  Save,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { ResponseTime } from '@/components/tools/ResponseTime'
import { Rule } from '@/components/tools/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import AgentDescription from '@/components/tools/agentDescription';

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
  const [isConfigExpanded, setIsConfigExpanded] = useState(true)
  const [isInputExpanded, setIsInputExpanded] = useState(true)
  const [savedAgents, setSavedAgents] = useState<Array<{
    id: string;
    name: string;
    agentEndpoint: string;
    headers: Record<string, string>;
  }>>([])
  const [ruleTemplates, setRuleTemplates] = useState<Record<string, Rule[]>>({});
  const [agentDescription, setAgentDescription] = useState('');
  const [userDescription, setUserDescription] = useState('');

  // New state to track edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // Load saved agents and rule templates on component mount
  useEffect(() => {
    const tests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    const agents = tests.map((test: any) => ({
      id: test.id,
      name: test.name,
      agentEndpoint: test.agentEndpoint,
      headers: test.headers
    }));
    setSavedAgents(agents);

    // Load rule templates
    const savedTemplates = JSON.parse(localStorage.getItem('ruleTemplates') || '{}');
    setRuleTemplates(savedTemplates);
  }, []);

  // Save rule templates whenever rules change
  useEffect(() => {
    if (testName) {
      const updatedTemplates = { ...ruleTemplates, [testName]: rules };
      setRuleTemplates(updatedTemplates);
      localStorage.setItem('ruleTemplates', JSON.stringify(updatedTemplates));
    }
  }, [rules, testName]);

  const loadAgent = (agentId: string) => {
    const tests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    const savedTest = tests.find((test: any) => test.id === agentId);
    if (!savedTest) return;

    setTestName(savedTest.name);
    setAgentEndpoint(savedTest.agentEndpoint);
    setManualInput(savedTest.input || '');
    setManualResponse(savedTest.expectedOutput || '');
    setAgentDescription(savedTest.agentDescription || '');
    setUserDescription(savedTest.userDescription || '');

    // Load associated rule templates if they exist
    const savedTemplates = JSON.parse(localStorage.getItem('ruleTemplates') || '{}');
    if (savedTemplates[savedTest.name]) {
      setRules(savedTemplates[savedTest.name]);
    } else {
      setRules([]);
    }
    
    // Convert headers object to array format
    const headerArray = Object.entries(savedTest.headers)
      .filter(([key]) => key !== 'Content-Type')
      .map(([key, value]) => ({ key, value: value as string }));
    
    setHeaders(headerArray.length ? headerArray : [{ key: '', value: '' }]);
    setIsConfigExpanded(true);
    setIsInputExpanded(true);
    
    // Set edit mode to true when loading an existing test
    setIsEditMode(true);
  };

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
    const existingTests = JSON.parse(localStorage.getItem('savedTests') || '[]');
    
    // Check if we're updating an existing test
    const existingTestIndex = existingTests.findIndex((test: any) => test.name === testName);
    
    const testCase = {
      id: existingTestIndex >= 0 ? existingTests[existingTestIndex].id : crypto.randomUUID(),
      name: testName,
      agentEndpoint,
      headers: getHeaders(),
      input: manualInput,
      expectedOutput: manualResponse,
      rules,
      responseTime,
      agentDescription,
      userDescription,
      timestamp: new Date().toISOString()
    };

    // Update or add the test case
    if (existingTestIndex >= 0) {
      existingTests[existingTestIndex] = testCase;
      alert("Test case updated successfully!");
    } else {
      existingTests.push(testCase);
      alert("Test case saved successfully!");
    }
    
    localStorage.setItem('savedTests', JSON.stringify(existingTests));
    
    // Save rule templates
    const updatedTemplates = { ...ruleTemplates, [testName]: rules };
    localStorage.setItem('ruleTemplates', JSON.stringify(updatedTemplates));
    
    // Refresh the saved agents list
    setSavedAgents(existingTests.map((test: any) => ({
      id: test.id,
      name: test.name,
      agentEndpoint: test.agentEndpoint,
      headers: test.headers
    })));

    // Optionally reset edit mode after saving
    setIsEditMode(false);
  };

  // Function to get rule templates for an agent
  const getRuleTemplatesForAgent = (agentName: string): Rule[] => {
    return ruleTemplates[agentName] || [];
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Manual Testing</h2>
        </div>
        <div className="flex gap-2">
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Load Saved Agent
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {savedAgents.length > 0 ? (
                savedAgents.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => loadAgent(agent.id)}
                    className="flex flex-col items-start"
                  >
                    <span>{agent.name}</span>
                    <span className="text-xs text-zinc-500">
                      {getRuleTemplatesForAgent(agent.name).length} saved rules
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No saved agents
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>     
          </div>
          <Input
            placeholder="Enter test name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-64 bg-black/20"
          />
          <Button onClick={saveTest} disabled={!manualResponse || !testName}>
            <Save className="mr-2 h-4 w-4" />
            {isEditMode ? "Update Test" : "Save Test"}
          </Button>
        </div>
      </div>
      <AgentDescription
          agentDescription={agentDescription}
          userDescription={userDescription}
          onAgentDescriptionChange={setAgentDescription}
          onUserDescriptionChange={setUserDescription}
        />
      <div className="grid grid-cols-12 gap-6">
        {/* Main Column - Configuration and Response */}
        <div className="col-span-8 space-y-4">
          {/* Agent Configuration Section */}
          <Card className="bg-black/40 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <CardTitle>Agent Configuration</CardTitle>
                      <CardDescription>Configure your AI agent endpoint and headers</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                      >
                        {isConfigExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            {isConfigExpanded && (
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
              </CardContent>
            )}
          </Card>

          {/* Input Section */}
          <Card className="bg-black/40 border-zinc-800">
            <CardHeader className="cursor-pointer" onClick={() => setIsInputExpanded(!isInputExpanded)}>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Input</CardTitle>
                  <CardDescription>Enter your test input</CardDescription>
                </div>
                {isInputExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {isInputExpanded && (
              <CardContent>
                <Textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Enter your test input..."
                  className="min-h-[200px] bg-black/20"
                />
                <Button 
                  onClick={testManually}
                  disabled={loading || !manualInput || !agentEndpoint}
                  className="w-full mt-4"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {loading ? 'Testing...' : 'Test Agent'}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Response Section */}
          <Card className="bg-black/40 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Response Details</CardTitle>
                {responseTime > 0 && <ResponseTime time={responseTime} />}
              </div>
            </CardHeader>
            <CardContent>
              {manualResponse ? (
                <div className="bg-black/20 rounded-lg font-mono">
                  {(() => {
                    try {
                      const parsed = JSON.parse(manualResponse);
                      const formatted = JSON.stringify(parsed, null, 2);
                      let indentLevel = 0;
                      
                      return formatted.split('\n').map((line, index) => {
                        // Track indent level
                        const openBraces = (line.match(/{/g) || []).length;
                        const closeBraces = (line.match(/}/g) || []).length;
                        indentLevel += openBraces - closeBraces;
                        
                        // Check if line contains a field
                        const fieldMatch = line.match(/^\s*"([^"]+)":/);
                        if (fieldMatch) {
                          const [_, fieldName] = fieldMatch;
                          const fullPath = getJsonPath(parsed, fieldName, line);
                          const value = getValueFromPath(parsed, fullPath);
                          const displayValue = line.split(':')[1].trim();
                          
                          return (
                            <div 
                              key={index} 
                              className="group/line relative hover:bg-zinc-800/50 px-4 py-1 first:rounded-t-lg last:rounded-b-lg border-l-2 border-transparent hover:border-emerald-500 transition-all duration-150"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-zinc-400 select-none">{' '.repeat(indentLevel * 2)}</span>
                                <span className="text-emerald-500/70 group-hover/line:text-emerald-400">{`"${fieldName}"`}</span>
                                <span className="text-zinc-400">:</span>
                                <span className="text-zinc-300 group-hover/line:text-white">{displayValue}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover/line:opacity-100 transition-opacity h-6 w-6 p-0 ml-auto hover:bg-emerald-500/20"
                                  onClick={() => {
                                    // Remove quotes and commas from the display value
                                    const cleanValue = displayValue.replace(/[",]/g, '').trim();
                                    setRules(prev => [...prev, {
                                      id: crypto.randomUUID(),
                                      path: fullPath,
                                      condition: typeof value === 'number' ? '=' : 'contains',
                                      value: cleanValue,
                                      isValid: false
                                    }]);
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div 
                            key={index} 
                            className="px-4 py-1 text-zinc-300"
                          >
                            <span className="text-zinc-400 select-none">{' '.repeat(indentLevel * 2)}</span>
                            {line.trim()}
                          </div>
                        );
                      });
                    } catch (e) {
                      return <div className="p-4 text-red-400">Invalid JSON format</div>;
                    }
                  })()}
                </div>
              ) : (
                <div className="text-zinc-500 text-center py-4">
                  Agent response will appear here...
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Rules */}
        <div className="col-span-4">
          <Card className="bg-black/40 border-zinc-800 sticky top-6">
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>Click + next to response fields to add rules</CardDescription>
            </CardHeader>
            <CardContent>
              {manualResponse ? (
                rules.length > 0 ? (
                  <div className="space-y-2">
                    {rules.map((rule, index) => (
                      <div 
                        key={rule.id} 
                        className="group bg-black/20 rounded-lg border border-zinc-800/50 hover:border-zinc-700/50 transition-colors"
                      >
                        <div className="p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-300">{rule.path}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setRules(rules.filter(r => r.id !== rule.id))}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <select 
                              value={rule.condition}
                              onChange={(e) => {
                                const newRules = [...rules];
                                newRules[index] = { ...rule, condition: e.target.value as Rule['condition'] };
                                setRules(newRules);
                              }}
                              className="bg-black/40 border border-zinc-800 text-sm py-1 px-2 rounded-md hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            >
                              <option value="chat">chat</option>
                              <option value="null">is null</option>
                              <option value="not_null">is not null</option>
                              <option value="=">=</option>
                              <option value="!=">!=</option>
                              <option value="contains">contains</option>
                              <option value="not_contains">does not contain</option>
                              <option value="starts_with">starts with</option>
                              <option value="ends_with">ends with</option>
                              <option value="matches">matches regex</option>
                              <option value=">">&gt;</option>
                              <option value=">=">&gt;=</option>
                              <option value="<">&lt;</option>
                              <option value="<=">&lt;=</option>
                              <option value="has_key">has key</option>
                              <option value="array_contains">array contains</option>
                              <option value="array_length">array length</option>
                            </select>
                            {!['null', 'not_null', 'chat'].includes(rule.condition) && (
                              <input
                                type="text"
                                value={rule.value}
                                onChange={(e) => {
                                  const newRules = [...rules];
                                  newRules[index] = { ...rule, value: e.target.value };
                                  setRules(newRules);
                                }}
                                className="flex-1 bg-black/40 border border-zinc-800 text-sm py-1 px-2 rounded-md hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-700"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 text-center py-8 px-4 bg-black/20 rounded-lg border border-dashed border-zinc-800">
                    Click + next to response fields to add validation rules
                  </div>
                )
              ) : (
                <div className="text-zinc-500 text-center py-8 px-4 bg-black/20 rounded-lg border border-dashed border-zinc-800">
                  Test the agent to add validation rules
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getJsonPath(obj: any, key: string, line: string): string {
  const paths: string[] = [];

  function traverse(current: any, currentPath: string[] = []) {
    if (current && typeof current === 'object') {
      Object.keys(current).forEach(k => {
        const newPath = [...currentPath, k];
        if (k === key) {
          paths.push(newPath.join('.'));
        }
        traverse(current[k], newPath);
      });
    }
  }
  traverse(obj);

  // Ensure that the correct path is returned by checking the JSON structure
  return paths.find(p => {
    const value = getValueFromPath(obj, p);
    return JSON.stringify(value, null, 2).split('\n')[0].includes(line.split(':')[1].trim());
  }) || paths[0] || key; // Default to the first found path if there's no exact match
}

function getValueFromPath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
