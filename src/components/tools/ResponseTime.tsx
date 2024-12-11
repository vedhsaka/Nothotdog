import React from 'react';
import { Clock } from 'lucide-react';

interface ResponseTimeProps {
  time: number;
}

export function ResponseTime({ time }: ResponseTimeProps) {
  const getTimeColor = (ms: number) => {
    if (ms < 300) return 'text-green-400';
    if (ms < 1000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className={`h-4 w-4 ${getTimeColor(time)}`} />
      <span className={`text-sm ${getTimeColor(time)}`}>
        {time}ms
      </span>
    </div>
  );
}