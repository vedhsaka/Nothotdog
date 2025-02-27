// AgentDescription.tsx
import React from 'react';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown } from 'lucide-react'; // Add this import

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

  return (
    <div className="rounded-[var(--radius)] border bg-background border-border mb-6">
      <div 
        className="flex justify-between items-center p-6 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div>
          <h3 className="text-lg font-medium">Agent Description</h3>
          <p className="text-sm text-zinc-400">Define agent and user characteristics</p>
        </div>
        <ChevronDown 
          className={`w-5 h-5 text-zinc-400 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
        />
      </div>
      
      {!isCollapsed && (
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-zinc-400">Agent Description</Label>
              <Textarea
                placeholder="Describe the agent's personality, behavior, and knowledge domain in detail"
                value={agentDescription}
                onChange={(e) => onAgentDescriptionChange(e.target.value)}
                className="mt-1.5 bg-background border-border border h-32 "
              />
            </div>
            <div>
              <Label className="text-sm text-zinc-400">Ideal User Profile</Label>
              <Textarea
                placeholder="Describe characteristics of an ideal user interacting with this agent..."
                value={userDescription}
                onChange={(e) => onUserDescriptionChange(e.target.value)}
                className="mt-1.5 bg-background border-border border h-32 "
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}