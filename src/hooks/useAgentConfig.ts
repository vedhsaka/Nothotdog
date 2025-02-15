"use client";

import { useState, useEffect } from "react";
import { Rule } from "@/components/tools/types";

interface Header {
  key: string;
  value: string;
}

interface SavedAgent {
  id: string;
  name: string;
  agentEndpoint: string;
  headers: Record<string, string>;
}

export function useAgentConfig() {
  const [testName, setTestName] = useState("");
  const [agentEndpoint, setAgentEndpoint] = useState("");
  const [headers, setHeaders] = useState<Header[]>([{ key: "", value: "" }]);
  const [manualInput, setManualInput] = useState("");
  const [manualResponse, setManualResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [rules, setRules] = useState<Rule[]>([]);
  const [savedAgents, setSavedAgents] = useState<SavedAgent[]>([]);
  const [ruleTemplates, setRuleTemplates] = useState<Record<string, Rule[]>>({});
  const [agentDescription, setAgentDescription] = useState("");
  const [userDescription, setUserDescription] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);


  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch("/api/tools/agent-config");
        const data = await res.json();
        setSavedAgents(data.map((cfg: any) => ({
          id: cfg.id,
          name: cfg.name,
          agentEndpoint: cfg.endpoint,
          headers: cfg.headers
        })));
      } catch (err) {
        console.error("Failed to fetch agent configs:", err);
      }
    }
    fetchAgents();
  }, []);
  

  const loadAgent = async (agentId: string) => {
    try {
        const res = await fetch(`/api/tools/agent-config?id=${agentId}`);
        if (!res.ok) throw new Error("Failed to fetch agent config");
        const data = await res.json();
        if (!data) return;
        setManualInput(data.input || "");
        setManualResponse(data.expectedOutput || "");
        setTestName(data.name || "");
        setAgentEndpoint(data.endpoint || "");
        setHeaders(
            Object.entries(data.headers || {}).map(([key, value]) => ({
              key,
              value: value as string,
            }))
          );          
        setAgentDescription(data.agentDescription || "");
        setUserDescription(data.userDescription || "");
        setRules(data.rules || []);
        setManualInput(typeof data.inputFormat === 'object' ? JSON.stringify(data.inputFormat, null, 2) : data.inputFormat || "");
        setManualResponse(typeof data.latestOutput?.responseData === 'object'
            ? JSON.stringify(data.latestOutput.responseData, null, 2)
            : data.latestOutput?.responseData || ""
          );
        setResponseTime(data.latestOutput?.responseTime || 0);
        setIsEditMode(true);
        setCurrentAgentId(data.id);
    }
    catch (err) {
        console.error("Failed to load agent:", err);
    }
  };

  const testManually = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch(agentEndpoint, {
        method: "POST",
        headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
        body: JSON.stringify(JSON.parse(manualInput))
      });
      const data = await response.json();
      setManualResponse(JSON.stringify(data, null, 2));
      setResponseTime(Date.now() - startTime);
    } catch (error) {
      console.error("Test failed:", error);
      setManualResponse("Error: Failed to get response from agent");
    }
    setLoading(false);
  };

    const saveTest = async () => {
        const payload = {
        id: isEditMode ? currentAgentId : undefined,
        name: testName,
        endpoint: agentEndpoint,
        headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
        input: manualInput,
        agent_response: manualResponse,
        rules,
        responseTime,
        agentDescription,
        userDescription,
        timestamp: new Date().toISOString(),
        };
    
        try {
        const res = await fetch("/api/tools/agent-config", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        console.log(res);
        if (!res.ok) throw new Error("Failed to save agent config");
        // Optionally update your state with the new config info.
        setIsEditMode(false);
        } catch (error) {
        console.error("saveTest error:", error);
        }
    };
  

  return {
    testName, setTestName,
    agentEndpoint, setAgentEndpoint,
    headers, setHeaders,
    manualInput, setManualInput,
    manualResponse, setManualResponse,
    loading, responseTime, setResponseTime,
    rules, setRules,
    savedAgents, ruleTemplates,
    agentDescription, setAgentDescription,
    userDescription, setUserDescription,
    isEditMode, setIsEditMode,
    loadAgent, testManually, saveTest
  };
}
