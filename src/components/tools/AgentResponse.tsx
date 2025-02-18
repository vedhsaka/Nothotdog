"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ResponseTime } from "@/components/tools/ResponseTime";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Rule } from "@/services/agents/claude/types";

interface Props {
  manualResponse: string;
  responseTime: number;
}

export default function AgentResponse({ manualResponse, responseTime }: Props) {

const [rules, setRules] = useState<Rule[]>([]);

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
            <div className="bg-black/20 rounded-lg font-mono">
                {(() => {
                try {
                    const parsed = JSON.parse(manualResponse);
                    const formatted = JSON.stringify(parsed, null, 2);
                    let indentLevel = 0;

                    return formatted.split('\n').map((line, index) => {
                    const openBraces = (line.match(/{/g) || []).length;
                    const closeBraces = (line.match(/}/g) || []).length;
                    indentLevel += openBraces - closeBraces;

                    const fieldMatch = line.match(/^\s*"([^"]+)":/);
                    if (fieldMatch) {
                        const [, fieldName] = fieldMatch;
                        const fullPath = getJsonPath(parsed, fieldName, line);
                        const value = getValueFromPath(parsed, fullPath);
                        const displayValue = line.split(':')[1].trim();

                        return (
                        <div
                            key={index}
                            className="group relative px-4 py-1 hover:bg-zinc-800/50 border-l-2 border-transparent hover:border-emerald-500 transition-all duration-150"
                        >
                            <div className="flex items-center gap-2">
                            <span className="text-zinc-400 select-none">{' '.repeat(indentLevel * 2)}</span>
                            <span className="text-emerald-500 group-hover:text-emerald-400">{`"${fieldName}"`}</span>
                            <span className="text-zinc-400">:</span>
                            <span className="text-zinc-300 group-hover:text-white">{displayValue}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                                onClick={() => {
                                const cleanValue = displayValue.replace(/[",]/g, '').trim();
                                setRules(prev => [
                                    ...prev,
                                    {
                                    id: crypto.randomUUID(),
                                    path: fullPath,
                                    condition: typeof value === 'number' ? '=' : 'contains',
                                    value: cleanValue,
                                    isValid: false,
                                    },
                                ]);
                                }}
                            >
                                <Plus className="h-3 w-3" />
                            </Button>
                            </div>
                        </div>
                        );
                    }

                    return (
                        <div key={index} className="px-4 py-1 text-zinc-300">
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
    return paths[0] || key;
  }
  
  function getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  