"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface Props {
  manualInput: string;
  setManualInput: (val: string) => void;
  agentEndpoint: string;
  testManually: () => Promise<void>;
  loading: boolean;
}

export default function AgentInput({ manualInput, setManualInput, agentEndpoint, testManually, loading }: Props) {
  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <CardTitle>Input</CardTitle>
        <CardDescription>Enter your test input</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={manualInput ?? ""}
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
          {loading ? "Testing..." : "Test Agent"}
        </Button>
      </CardContent>
    </Card>
  );
}
