'use client';

import { TestRunsDashboard } from '@/components/tools/TestRunsDashboard';
import { Card } from '@/components/ui/card';

export default function RunsPage() {
  return (
    <div className="p-6">
      <Card className="bg-black/40 border-zinc-800">
        <TestRunsDashboard />
      </Card>
    </div>
  );
}