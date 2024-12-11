import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-zinc-800 bg-black/40 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            NotHotDog
          </h1>
          <p className="text-zinc-400 mt-2">Test. Evaluate. Analyze.</p>
        </div>
        <Badge variant="outline" className="bg-black/40 text-emerald-400 border-emerald-400/30">
          Open Source Edition
        </Badge>
      </div>
    </header>
  );
}