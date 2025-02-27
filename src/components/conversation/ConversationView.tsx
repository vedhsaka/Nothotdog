import React from 'react';
import { ScrollArea } from "../ui/scroll-area";
import { ConversationStep } from '@/types/';
import { cn } from '@/lib/utils';

interface ConversationViewProps {
  history: ConversationStep[];
  currentStep?: string;
  metrics?: {
    responseTime: number[];
    validationScores: number[];
    contextRelevance: number[];
  };
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  history,
  currentStep,
  metrics
}) => {
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {history.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "p-4 rounded-[var(--radius)]",
                "transition-all duration-200",
                step.role === "user" ? "bg-blue-50 ml-8" : "bg-gray-50 mr-8",
                currentStep === step.id && "ring-2 ring-blue-500"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  {step.role === "user" ? "User" : "Assistant"}
                </span>
                {metrics && (
                  <div className="flex space-x-2 text-xs text-gray-500">
                    {step.role === "assistant" && metrics.responseTime[Math.floor(index/2)] && (
                      <span>
                        Response: {metrics.responseTime[Math.floor(index/2)]}ms
                      </span>
                    )}
                    {step.role === "assistant" && metrics.validationScores[Math.floor(index/2)] && (
                      <span>
                        Score: {(metrics.validationScores[Math.floor(index/2)] * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none">
                {step.content}
              </div>

              {step.validationPoints && (
                <div className="mt-2 text-xs">
                  <div className="flex flex-wrap gap-2">
                    {step.validationPoints.contains?.map((text, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 rounded">
                        Contains: {text}
                      </span>
                    ))}
                    {step.validationPoints.notContains?.map((text, i) => (
                      <span key={i} className="px-2 py-1 bg-red-100 rounded">
                        Not Contains: {text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {step.branch && (
                <div className="mt-2 border-t pt-2">
                  <div className="text-xs text-gray-500">Branches:</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {step.branch.map((branch, i) => (
                      <div key={i} className="text-xs bg-gray-100 rounded px-2 py-1">
                        {branch.condition} → {branch.nextStep}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {metrics && (
        <div className="border-t p-4 bg-white">
          <div className="text-sm font-medium mb-2">Conversation Metrics</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Response Time</div>
              <div className="text-lg font-medium">
                {(metrics.responseTime.reduce((a, b) => a + b, 0) / metrics.responseTime.length).toFixed(0)}ms
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Avg Validation Score</div>
              <div className="text-lg font-medium">
                {(metrics.validationScores.reduce((a, b) => a + b, 0) / metrics.validationScores.length * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500">Context Relevance</div>
              <div className="text-lg font-medium">
                {(metrics.contextRelevance.reduce((a, b) => a + b, 0) / metrics.contextRelevance.length * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
