"use client";

import { useAgentConfig } from "@/hooks/useAgentConfig";
import AgentSetup from "@/components/tools/AgentSetup";
import AgentInput from "@/components/tools/AgentInput";
import AgentResponse from "@/components/tools/AgentResponse";
import AgentRules from "@/components/tools/AgentRules";
import AgentDescription from "@/components/tools/agentDescription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

export default function ToolsPage() {
  const {
    testName,
    setTestName,
    agentEndpoint,
    setAgentEndpoint,
    headers,
    setHeaders,
    manualInput,
    setManualInput,
    manualResponse,
    loading,
    responseTime,
    rules,
    setRules,
    savedAgents,
    agentDescription,
    setAgentDescription,
    userDescription,
    setUserDescription,
    isEditMode,
    loadAgent,
    testManually,
    saveTest,
  } = useAgentConfig();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Manual Testing</h2>
        </div>
        <div className="flex gap-2">
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
                  <DropdownMenuItem key={agent.id} onClick={() => loadAgent(agent.id)}>
                    {agent.name}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved agents</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Input
            placeholder="Enter test name"
            value={testName ?? ""}
            onChange={(e) => setTestName(e.target.value)}
            className="w-64 bg-black/20"
          />
          <Button onClick={saveTest} disabled={!manualResponse || !testName}>
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
        <div className="col-span-8 space-y-4">
          <AgentSetup
            agentEndpoint={agentEndpoint}
            setAgentEndpoint={setAgentEndpoint}
            headers={headers}
            setHeaders={setHeaders}
          />
          <AgentInput
            manualInput={manualInput}
            setManualInput={setManualInput}
            agentEndpoint={agentEndpoint}
            testManually={testManually}
            loading={loading}
          />
          <AgentResponse manualResponse={manualResponse} responseTime={responseTime} />
        </div>
        <div className="col-span-4">
          <AgentRules manualResponse={manualResponse} rules={rules} setRules={setRules} />
        </div>
      </div>
    </div>
  );
}
