import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-border bg-background sticky top-0 z-30 px-4 py-3">
      <div className="flex justify-between items-center max-w-screen-2xl mx-auto">
        <div>
        <h1 className="text-2xl font-bold text-orange-500">
          NotHotDog
        </h1>
          <p className="text-sm text-muted-foreground">Agent Testing Framework</p>
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 border-blue-500/30 text-blue-400 dark:border-blue-400/30">
          Developer Beta
        </Badge>
      </div>
    </header>
  );
}