import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricsDisplayProps } from '@/types/metrics';

type ResponseTimeProps = Omit<MetricsDisplayProps, 'variant' | 'label'> & {
  time: number;
};

export function ResponseTime({ time, className }: ResponseTimeProps) {
  const getTimeColor = (ms: number): string => {
    if (ms < 300) return 'text-green-400';
    if (ms < 1000) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className={cn("h-4 w-4", getTimeColor(time))} />
      <span className={cn("text-sm", getTimeColor(time))}>
        {time}ms
      </span>
    </div>
  );
} 