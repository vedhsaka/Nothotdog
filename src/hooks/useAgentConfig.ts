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

  const saveTest = () => {
    const existingTests = JSON.parse(localStorage.getItem("savedTests") || "[]");
    const existingTestIndex = existingTests.findIndex((test: any) => test.name === testName);

    const testCase = {
      id: existingTestIndex >= 0 ? existingTests[existingTestIndex].id : crypto.randomUUID(),
      name: testName,
      agentEndpoint,
      headers: Object.fromEntries(headers.map(h => [h.key, h.value])),
      input: manualInput,
      expectedOutput: manualResponse,
      rules,
      responseTime,
      agentDescription,
      userDescription,
      timestamp: new Date().toISOString(),
    };

    if (existingTestIndex >= 0) {
      existingTests[existingTestIndex] = testCase;
    } else {
      existingTests.push(testCase);
    }

    localStorage.setItem("savedTests", JSON.stringify(existingTests));
    localStorage.setItem("ruleTemplates", JSON.stringify({ ...ruleTemplates, [testName]: rules }));

    setSavedAgents(existingTests.map((test: any) => ({
      id: test.id,
      name: test.name,
      agentEndpoint: test.agentEndpoint,
      headers: test.headers
    })));
    
    setIsEditMode(false);
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
