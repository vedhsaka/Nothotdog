import React from 'react';
import { Button } from "@/components/ui/button";
import { TestRun } from '@/types/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Play } from 'lucide-react';
import { useTestRuns } from '@/hooks/useTestRuns';
import { useTestExecution } from '@/hooks/useTestExecution';
import { formatTimestamp, getStatusColor } from '@/utils/test';
import { storageService } from '@/services/storage/localStorage';
import { MetricsBadge } from '@/components/common/MetricsBadge';
import { ChatList } from './ChatList';

export function TestRunsDashboard() {
  const { runs, selectedRun, setSelectedRun } = useTestRuns();
  const { executeTest, isExecuting } = useTestExecution();
  const savedTests = storageService.getSavedTests();

  if (selectedRun) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setSelectedRun(null)}>
              ← Back to Runs
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MetricsBadge 
              label="Passed" 
              value={selectedRun.metrics.passed}
              variant="success"
            />
            <MetricsBadge 
              label="Failed" 
              value={selectedRun.metrics.failed}
              variant="error"
            />
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Run #{selectedRun.name}</h2>
          <p className="text-sm text-zinc-400">All conversations in this test run</p>
        </div>

        <ChatList chats={selectedRun.chats} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Test Runs</h2>
          <p className="text-sm text-zinc-400">View and manage your test runs</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isExecuting}>
              <Play className="mr-2 h-4 w-4" />
              {isExecuting ? 'Running...' : 'Run Test'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {savedTests.map((test) => (
              <DropdownMenuItem 
                key={test.id}
                onClick={() => executeTest(test.id)}
              >
                {test.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2">
        {runs.map((run) => (
          <div 
            key={run.id} 
            className="flex items-center p-4 bg-black/20 border border-zinc-800 rounded-lg cursor-pointer hover:bg-black/30"
            onClick={() => setSelectedRun(run)}
          >
            <div className="w-[30%] flex items-center gap-2">
              <span className="font-medium">{run.name}</span>
              <span className="text-zinc-400 text-sm">
                {formatTimestamp(run.timestamp)}
              </span>
            </div>
            
            <div className="w-[50%] flex items-center gap-4">
              <MetricsBadge 
                label="Tests" 
                value={run.metrics.total}
                variant="neutral"
              />
              <div className="flex items-center gap-4">
                <MetricsBadge 
                  label="Passed" 
                  value={run.metrics.passed}
                  variant="success"
                />
                <MetricsBadge 
                  label="Failed" 
                  value={run.metrics.failed}
                  variant="error"
                />
              </div>
            </div>

            <div className="w-[20%] flex items-center justify-end gap-2">
              <MetricsBadge 
                label={run.status} 
                value={run.metrics.total}
                variant={run.status === 'completed' ? 'success' : run.status === 'failed' ? 'error' : 'neutral'}
                className={getStatusColor(run.status)}
              />
              <span className="text-zinc-400">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 