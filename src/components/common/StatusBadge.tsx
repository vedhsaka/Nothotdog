import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 'completed' | 'running' | 'failed' | 'pending';

interface StatusBadgeProps {
  status: StatusType;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      variant={status === 'completed' ? 'default' : 'secondary'}
      className={cn(
        status === 'running' && 'bg-yellow-500/20 text-yellow-400',
        status === 'failed' && 'bg-red-500/20 text-red-400',
        status === 'pending' && 'bg-zinc-500/20 text-zinc-400'
      )}
    >
      {status}
    </Badge>
  );
}