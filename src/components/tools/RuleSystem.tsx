import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Rule } from './types';

interface RuleSystemProps {
  response: any;
  rules: Rule[];
  onRuleChange: (rules: Rule[]) => void;
}

export function RuleSystem({ response, rules, onRuleChange }: RuleSystemProps) {
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);

  const addRule = (path: string) => {
    onRuleChange([...rules, { path, condition: '=', value: '' }]);
  };

  const removeRule = (index: number) => {
    onRuleChange(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<Rule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    onRuleChange(newRules);
  };

  const checkRules = (response: any): boolean => {
    return rules.every(rule => {
      const value = getValueByPath(response, rule.path);
      switch (rule.condition) {
        case '=': return value === rule.value;
        case '>': return Number(value) > Number(rule.value);
        case '<': return Number(value) < Number(rule.value);
        case '>=': return Number(value) >= Number(rule.value);
        case '<=': return Number(value) <= Number(rule.value);
        case 'contains': return String(value).includes(rule.value);
        case 'startsWith': return String(value).startsWith(rule.value);
        case 'endsWith': return String(value).endsWith(rule.value);
        default: return false;
      }
    });
  };

  const getValueByPath = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  const renderObject = (obj: any, path: string = '') => {
    return Object.entries(obj).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (value && typeof value === 'object') {
        return (
          <div key={currentPath} className="ml-4">
            <div className="text-zinc-500">{key}:</div>
            {renderObject(value, currentPath)}
          </div>
        );
      }

      return (
        <div
          key={currentPath}
          className="ml-4 flex items-center group"
          onMouseEnter={() => setHoveredPath(currentPath)}
          onMouseLeave={() => setHoveredPath(null)}
        >
          <span className="text-zinc-300">{key}: </span>
          <span className="text-zinc-100 ml-2">{String(value)}</span>
          {hoveredPath === currentPath && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={() => addRule(currentPath)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {rules.length > 0 && (
        <Card className="bg-black/40 border-zinc-800">
          <CardContent className="pt-4 space-y-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="text-sm text-zinc-400">{rule.path}</div>
                <select
                  value={rule.condition}
                  onChange={(e) => updateRule(index, { condition: e.target.value as Rule['condition'] })}
                  className="w-[120px] bg-black/40 border border-zinc-800 rounded-md px-2 py-1 text-sm"
                >
                  <option value="=">=</option>
                  <option value=">">{">"}</option>
                  <option value="<">{"<"}</option>
                  <option value=">=">{">="}</option>
                  <option value="<=">{"<="}</option>
                  <option value="contains">contains</option>
                  <option value="startsWith">starts with</option>
                  <option value="endsWith">ends with</option>
                </select>
                <Input
                  value={rule.value}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                  className="w-[200px]"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(index)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      <div className="relative">
        {renderObject(response)}
        <div className={`absolute top-2 right-2 ${checkRules(response) ? 'text-green-400' : 'text-red-400'}`}>
          {checkRules(response) ? '✓ Rules Pass' : '✗ Rules Fail'}
        </div>
      </div>
    </div>
  );
}