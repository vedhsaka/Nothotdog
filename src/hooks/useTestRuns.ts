import { useState, useEffect } from 'react';
import { TestRun } from '@/types/runs';
import { storageService } from '@/services/storage/localStorage';

export function useTestRuns() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  useEffect(() => {
    const savedRuns = storageService.getTestRuns() as TestRun[];
    setRuns(savedRuns);
  }, []);

  const addRun = (newRun: TestRun) => {
    setRuns(prev => [newRun, ...prev]);
    storageService.setTestRuns([newRun, ...runs]);
  };

  const updateRun = (updatedRun: TestRun) => {
    setRuns(prev => {
      const index = prev.findIndex(run => run.id === updatedRun.id);
      if (index === -1) return prev;
      
      const newRuns = [...prev];
      newRuns[index] = updatedRun;
      storageService.setTestRuns(newRuns);
      
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