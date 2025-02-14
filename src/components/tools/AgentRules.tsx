// components/tools/AgentRules.tsx
"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Rule } from "@/components/tools/types";

interface Props {
  manualResponse: string;
  rules: Rule[];
  setRules: (rules: Rule[]) => void;
}

export default function AgentRules({ manualResponse, rules, setRules }: Props) {
  return (
    <Card className="bg-black/40 border-zinc-800">
      <CardHeader>
        <CardTitle>Validation Rules</CardTitle>
        <CardDescription>Click + next to response fields to add rules</CardDescription>
      </CardHeader>
      <CardContent>
        {manualResponse ? (
          rules.length > 0 ? (
            <div>
              {rules.map((rule) => (
                <div key={rule.id}>
                  {rule.path} {rule.condition} {rule.value}
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
  );
}
