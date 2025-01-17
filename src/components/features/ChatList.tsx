import React from 'react';
import { TestChat } from '@/types/chat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

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
            </div>

            <div className="space-y-3">
              {chat.messages.map((message, index) => (
                <div 
                  key={`${chat.id}-${index}`}
                  className={cn(
                    "p-3 rounded-lg",
                    message.role === 'user' 
                      ? "bg-blue-500/20 ml-0 mr-12" 
                      : "bg-zinc-800/40 ml-12 mr-0"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">
                      {message.role}
                    </Badge>
                    {message.metrics && (
                      <div className="flex items-center gap-1 text-xs text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {message.metrics.responseTime}ms
                      </div>
                    )}
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}