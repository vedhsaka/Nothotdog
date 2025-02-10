import { useState, useEffect } from 'react';
import { TestRun } from '@/types/runs';
import { dbService } from '@/services/db';

export function useTestRuns() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    const savedRuns = await dbService.getTestRuns();
    setRuns(savedRuns);
  };

  const addRun = async (newRun: TestRun) => {
    await dbService.createTestRun(newRun);
    setRuns(prev => [newRun, ...prev]);
  };

  const updateRun = async (updatedRun: TestRun) => {
    await dbService.updateTestRun(updatedRun); // Note: In production, this would be updateTestRun
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