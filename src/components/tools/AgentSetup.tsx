"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash, Code, List } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Label } from "../ui/label";

interface Props {
  agentEndpoint: string;
  setAgentEndpoint: (value: string) => void;
  headers: { key: string; value: string }[];
  setHeaders: (headers: { key: string; value: string }[]) => void;
  body: string;
  setBody: (body: string) => void;
}

export default function AgentSetup({ agentEndpoint, setAgentEndpoint, headers, setHeaders, body, setBody }: Props) {
  const [activeTab, setActiveTab] = useState("headers");

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);
  const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold">Agent Configuration</CardTitle>
            <CardDescription>Configure your AI agent endpoint, headers, and request body</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label className="text-sm">Agent Endpoint</Label>
          <Input
            value={agentEndpoint ?? ""}
            onChange={(e) => setAgentEndpoint(e.target.value)}
            placeholder="https://your-agent-endpoint.com/api"
          />
        </div>

        <div className="flex space-x-2 border-b border-border">
          <button
            className={`
              px-4 py-2 text-sm font-medium border-b-2
              ${activeTab === "headers" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}
            `}
            onClick={() => setActiveTab("headers")}
          >
            Headers
          </button>
          <button
            className={`
              px-4 py-2 text-sm font-medium border-b-2
              ${activeTab === "body" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}
            `}
            onClick={() => setActiveTab("body")}
          >
            Body
          </button>
        </div>

        {activeTab === "headers" ? (
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-medium">Headers</h4>
              <Button variant="outline" size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-1" /> Add Header
              </Button>
            </div>
            {headers.map((header, index) => (
              <div key={index} className="flex gap-3 mt-2">
                <Input
                  placeholder="Header key"
                  value={header.key ?? ""}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={header.value ?? ""}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeHeader(index)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <h4 className="text-base font-medium mb-2">Request Body (JSON)</h4>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter JSON body here"
                className="
                w-full
                min-h-[160px]
                resize-y
                overflow-auto
                font-mono
                text-sm
              "
              />
              </div>
        )}
      </CardContent>
    </Card>
  );
}