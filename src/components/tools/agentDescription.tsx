import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Check } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Import Button component

interface AgentDescriptionProps {
  agentDescription: string;
  userDescription: string;
  onAgentDescriptionChange: (value: string) => void;
  onUserDescriptionChange: (value: string) => void;
}

export default function AgentDescription({
  agentDescription,
  userDescription,
  onAgentDescriptionChange,
  onUserDescriptionChange
}: AgentDescriptionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isSectionFilled = agentDescription.trim().length > 0 && userDescription.trim().length > 0;

  return (
    <div className="rounded-lg border bg-black/40 border-zinc-800 mb-4">
      <div 
        className="flex justify-between items-center p-6 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              Agent Description
              {isCompleted && (
                <span className="text-xs font-semibold bg-green-500 text-white px-2 py-1 rounded-full">
                  Completed
                </span>
              )}
            </h3>
            <p className="text-sm text-zinc-400">Define agent and user characteristics</p>
          </div>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-zinc-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </div>
      
      {!isCollapsed && (
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-zinc-400">Agent Description</Label>
              <Textarea
                placeholder="Describe the agent's personality, behavior, and knowledge domain in detail..."
                value={agentDescription}
                onChange={(e) => onAgentDescriptionChange(e.target.value)}
                className="mt-1.5 bg-black/40 border-zinc-800"
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Ideal User Profile</Label>
              <Textarea
                placeholder="Describe characteristics of an ideal user interacting with this agent..."
                value={userDescription}
                onChange={(e) => onUserDescriptionChange(e.target.value)}
                className="mt-1.5 bg-black/40 border-zinc-800"
              />
            </div>
          </div>
          
          {/* Next Button */}
          {!isCompleted && (
            <Button
              onClick={() => setIsCompleted(true)}
              disabled={!isSectionFilled}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white w-full"
            >
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
