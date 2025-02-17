import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Check } from 'lucide-react'; // Add Check import

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
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const isSectionComplete = {
    agent: () => agentDescription.trim().length > 0,
    user: () => userDescription.trim().length > 0,
    all: () => agentDescription.trim().length > 0 && userDescription.trim().length > 0
  };

  return (
    <div className="rounded-lg border bg-black/40 border-zinc-800 mb-4">
      <div 
        className="flex justify-between items-center p-6 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div>
            <h3 className="text-lg font-medium">Agent Description</h3>
            <p className="text-sm text-zinc-400">Define agent and user characteristics</p>
          </div>
          {isSectionComplete.all() && (
            <Check className="w-4 h-4 text-green-500" />
          )}
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-zinc-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </div>
      
      {!isCollapsed && (
        <div className="p-6 pt-0 space-y-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-zinc-400">Agent Description</Label>
                {isSectionComplete.agent() && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
              <Textarea
                placeholder="Describe the agent's personality, behavior, and knowledge domain in detail..."
                value={agentDescription}
                onChange={(e) => onAgentDescriptionChange(e.target.value)}
                className="mt-1.5 bg-black/40 border-zinc-800"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-zinc-400">Ideal User Profile</Label>
                {isSectionComplete.user() && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
              <Textarea
                placeholder="Describe characteristics of an ideal user interacting with this agent..."
                value={userDescription}
                onChange={(e) => onUserDescriptionChange(e.target.value)}
                className="mt-1.5 bg-black/40 border-zinc-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}