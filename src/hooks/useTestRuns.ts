import { useState, useEffect } from 'react';
import { TestRun } from '@/types/runs';

export function useTestRuns() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    const res = await fetch('/api/tools/test-runs');
    const savedRuns = await res.json();
    setRuns(savedRuns);    
  };

  const addRun = async (newRun: TestRun) => {
    await fetch('/api/tools/test-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRun)
    });
    setRuns(prev => [newRun, ...prev]);    
  };

  const updateRun = async (updatedRun: TestRun) => {
    await fetch('/api/tools/test-runs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRun)
    });
    setRuns(prev => {
      const index = prev.findIndex(run => run.id === updatedRun.id);
      if (index === -1) return prev;
      
      const newRuns = [...prev];
      newRuns[index] = updatedRun;
      return newRuns;
    });

    if (selectedRun?.id === updatedRun.id) {
      setSelectedRun(updatedRun);
    }
  };

  return {
    runs,
    selectedRun,
    setSelectedRun,
    addRun,
    updateRun
  };
}