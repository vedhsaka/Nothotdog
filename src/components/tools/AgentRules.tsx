"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { Rule } from "@/services/agents/claude/types";
import { useState, useEffect, useMemo } from "react";

interface Props {
  manualResponse: string;
  rules: Rule[];
  setRules: (rules: Rule[]) => void;
  agentId: string | null;
}

export default function AgentRules({ manualResponse, rules, setRules, agentId }: Props) {
    const [originalRules, setOriginalRules] = useState<Rule[]>([]);

    useEffect(() => {
        setOriginalRules(rules);
      }, []);

      const hasChanges = useMemo(() => {
        return JSON.stringify(originalRules) !== JSON.stringify(rules);
      }, [originalRules, rules]);

    return (
        <Card className="border border-border bg-background  h-full">
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
                    key={rule.id || `${rule.path}-${index}`}
                    className="group bg-background rounded-[var(--radius)] border border-border/50 hover:border-zinc-700/50 p-3"
                    >
                    {/* Display the JSON path (read-only) */}
                    <div className="flex items-center gap-2 mb-2">
                        <input
                        type="text"
                        readOnly
                        value={rule.path}
                        className="bg-background border border-border text-sm py-1 px-2 rounded-[var(--radius)] flex-1 text-zinc-400 cursor-not-allowed"
                        />
                        {/* Delete button */}
                        <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-80 hover:opacity-100"
                        onClick={() => {
                            setRules(rules.filter(r => r.id !== rule.id));
                        }}
                        >
                        <Trash className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                        value={rule.condition}
                        onChange={(e) => {
                            const updatedRules = [...rules];
                            updatedRules[index].condition = e.target.value as Rule["condition"];
                            setRules(updatedRules);
                        }}
                        className="bg-background border border-border text-sm py-1 px-2 rounded-[var(--radius)]"
                        >
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
                        <option value="null">is null</option>
                        <option value="not_null">is not null</option>
                        <option value="chat">chat</option>
                        </select>
                        {/* Only show value input if condition isn't null/not_null/chat */}
                        {!["null", "not_null", "chat"].includes(rule.condition) && (
                        <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => {
                            const updatedRules = [...rules];
                            updatedRules[index].value = e.target.value;
                            setRules(updatedRules);
                            }}
                            className="flex-1 bg-background border border-border text-sm py-1 px-2 rounded-[var(--radius)]"
                        />
                        )}
                    </div>
                    </div>
                ))}
                <div className="flex justify-end mt-4">
                    <Button
                    disabled={!hasChanges}  // Button disabled if no changes
                    onClick={async () => {
                        if (!agentId) {
                        return;
                        }
                        try {
                        const res = await fetch("/api/tools/agent-rules", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                            agentId,
                            rules,
                            }),
                        });
                        if (!res.ok) {
                            throw new Error("Failed to update rules");
                        }
                            setOriginalRules(rules);
                        } catch (error) {
                        console.error("Failed to update rules:", error);
                        }
                    }}
                    >
                    Done
                    </Button>
                </div>
                </div>
            ) : (
                <div className="text-zinc-500 text-center py-8 px-4 bg-background rounded-[var(--radius)] border border-dashed border-border">
                Click + next to response fields to add validation rules
                </div>
            )
            ) : (
            <div className="text-zinc-500 text-center py-8 px-4 bg-background rounded-[var(--radius)] border border-dashed border-border">
                Test the agent to add validation rules
            </div>
            )}
        </CardContent>
        </Card>
    );
}
