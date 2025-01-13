import React from 'react';
import { TestChat } from '@/types/chat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChatListProps {
  chats: TestChat[];
}

export function ChatList({ chats }: ChatListProps) {
  return (
    <div className="space-y-4">
      {chats.map((chat) => (
        <Card 
          key={chat.id} 
          className={cn(
            "border",
            chat.status === 'passed' && "border-green-600/20",
            chat.status === 'failed' && "border-red-600/20",
            chat.status === 'running' && "border-blue-600/20"
          )}
        >
          <CardContent className="pt-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">{chat.scenario}</h3>
                <Badge 
                  className={cn(
                    chat.status === 'passed' && "bg-green-500/20 text-green-200",
                    chat.status === 'failed' && "bg-red-500/20 text-red-200",
                    chat.status === 'running' && "bg-blue-500/20 text-blue-200"
                  )}
                >
                  {chat.status}
                </Badge>
              </div>
              {chat.metrics.validationDetails && (
                <Badge variant="outline" className="text-zinc-400">
                  {Object.keys(chat.metrics.validationDetails).length} validation issues
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {chat.messages.map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg",
                    message.role === 'user' 
                      ? "bg-zinc-800/40 ml-0 mr-12" 
                      : "bg-zinc-900/40 ml-12 mr-0"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {message.role}
                    </Badge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>

            {chat.error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-200">{chat.error}</p>
              </div>
            )}

            {chat.metrics.validationDetails && (
              <div className="mt-4 space-y-2">
                {chat.metrics.validationDetails.containsFailures && chat.metrics.validationDetails.containsFailures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400">Missing Expected Phrases:</h4>
                    <ul className="mt-1 space-y-1">
                      {chat.metrics.validationDetails.containsFailures.map((phrase, i) => (
                        <li key={i} className="text-sm text-red-200">• {phrase}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {chat.metrics.validationDetails.notContainsFailures && chat.metrics.validationDetails.notContainsFailures.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400">Found Forbidden Phrases:</h4>
                    <ul className="mt-1 space-y-1">
                      {chat.metrics.validationDetails.notContainsFailures.map((phrase, i) => (
                        <li key={i} className="text-sm text-red-200">• {phrase}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 