"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ResponseTime } from "@/components/tools/ResponseTime";

interface Props {
  manualResponse: string;
  responseTime: number;
}

export default function AgentResponse({ manualResponse, responseTime }: Props) {
  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Response Details</CardTitle>
          {responseTime > 0 && <ResponseTime time={responseTime} />}
        </div>
      </CardHeader>
      <CardContent>
        {manualResponse ? (
          <div className="bg-black/20 rounded-lg font-mono p-4">
            {manualResponse}
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-4">
            Agent response will appear here...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
