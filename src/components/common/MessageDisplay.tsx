import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageDisplayProps {
  role: 'user' | 'assistant';
  content: string;
  isCorrect?: boolean;
  explanation?: string;
  expectedOutput?: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function MessageDisplay({ 
  role, 
  content, 
  isCorrect, 
  explanation, 
  expectedOutput,
  isExpanded,
  onToggleExpand
}: MessageDisplayProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        "flex gap-3 max-w-[80%]",
        role === 'assistant' ? "ml-auto flex-row-reverse" : ""
      )}>
        <div className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium",
          role === 'user' ? "bg-zinc-700" : "bg-emerald-600"
        )}>
          {role === 'user' ? 'U' : 'A'}
        </div>
        <div className={cn(
          "rounded-lg p-4",
          role === 'user' ? "bg-zinc-800" : "bg-emerald-900/50"
        )}>
          <p className="text-sm">{content}</p>
          {/* {role === 'assistant' && isCorrect !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              {isCorrect ? (
                <Badge variant="default" className="bg-emerald-500/20 text-emerald-400">
                  <Check className="w-3 h-3 mr-1" />
                  Correct
                </Badge>
              ) : (
                <Badge variant="default" className="bg-red-500/20 text-red-400">
                  <X className="w-3 h-3 mr-1" />
                  Incorrect
                </Badge>
              )}
            </div>
          )} */}
          {explanation && (
            <p className="text-sm text-zinc-400 mt-2">{explanation}</p>
          )}
        </div>
      </div>
      
      {expectedOutput && (
        <div className="flex items-center gap-2 ml-11">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleExpand}
          >
            <Eye className="w-3 h-3 mr-1" />
            {isExpanded ? 'Hide Expected' : 'View Expected'}
          </Button>
          {isExpanded && (
            <p className="text-sm text-zinc-400">{expectedOutput}</p>
          )}
        </div>
      )}
    </div>
  );
}