import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash } from "lucide-react";

interface TestCardProps {
  title: string;
  category?: string;
  description: string;
  onEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function TestCard({ 
  title, 
  category, 
  description, 
  onEdit, 
  onDelete,
  children 
}: TestCardProps) {
  return (
    <div className="p-4 bg-black/20 rounded-lg">
      <div className="flex justify-between mb-2">
        {category && <Badge>{category}</Badge>}
        <div className="flex gap-2">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-1">{title}</p>
          <p className="text-sm text-zinc-400">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}