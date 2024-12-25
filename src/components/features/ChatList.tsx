import React from 'react';
import { TestChat } from '@/types/chat';
import { MetricsBadge } from '@/components/common/MetricsBadge';

interface ChatListProps {
  chats: TestChat[];
}

export function ChatList({ chats }: ChatListProps) {
  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div 
          key={chat.id} 
          className="flex items-center p-4 bg-black/20 border border-zinc-800 rounded-lg"
        >
          <div className="w-[60%] truncate">
            <h3 className="font-medium truncate">{chat.name}</h3>
            <p className="text-sm text-zinc-400">
              {chat.messages.length} messages
            </p>
          </div>

          <div className="w-[40%] flex items-center justify-end gap-4">
            <MetricsBadge 
              label="Correct" 
              value={chat.metrics.correct}
              variant="success"
            />
            <MetricsBadge 
              label="Incorrect" 
              value={chat.metrics.incorrect}
              variant="error"
            />
            <span className="text-zinc-400">→</span>
          </div>
        </div>
      ))}
    </div>
  );
} 