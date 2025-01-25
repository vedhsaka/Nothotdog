import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MetricsDisplayProps } from '@/types/props';

export function MetricsBadge({ label, value, variant = 'neutral', className }: MetricsDisplayProps) {
  const variantClasses = {
    success: 'bg-green-500/10',
    error: 'bg-red-500/10',
    neutral: 'bg-zinc-500/10'
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(variantClasses[variant], className)}
    >
      {value} {label}
    </Badge>
  );
} 