import { useState, useEffect } from 'react';
import { TestVariation, TestVariations } from '@/types/variations';
import { storageService } from '@/services/storage/localStorage';

export function useTestVariations(testId?: string) {
  const [variations, setVariations] = useState<TestVariations>({});
  const [selectedVariation, setSelectedVariation] = useState<TestVariation | null>(null);

  useEffect(() => {
    const savedVariations = storageService.getTestVariations();
    setVariations(savedVariations);

    if (testId && savedVariations[testId]?.length > 0) {
      setSelectedVariation(savedVariations[testId][savedVariations[testId].length - 1]);
    }
  }, [testId]);

  const addVariation = (newVariation: TestVariation) => {
    setVariations(prev => {
      const testVariations = [...(prev[newVariation.testId] || []), newVariation];
      const newVariations = {
        ...prev,
        [newVariation.testId]: testVariations
      };
      storageService.setTestVariations(newVariations);
      return newVariations;
    });

    setSelectedVariation(newVariation);
  };

  const updateVariation = (updatedVariation: TestVariation) => {
    setVariations(prev => {
      const testVariations = prev[updatedVariation.testId] || [];
      const index = testVariations.findIndex(v => v.id === updatedVariation.id);
      
      if (index === -1) return prev;
      
      const newTestVariations = [...testVariations];
      newTestVariations[index] = updatedVariation;
      
      const newVariations = {
        ...prev,
        [updatedVariation.testId]: newTestVariations
      };
      
      storageService.setTestVariations(newVariations);
      return newVariations;
    });

    if (selectedVariation?.id === updatedVariation.id) {
      setSelectedVariation(updatedVariation);
    }
  };

  const getLatestVariation = (testId: string): TestVariation | undefined => {
    const testVariations = variations[testId] || [];
    return testVariations[testVariations.length - 1];
  };

  return {
    variations,
    selectedVariation,
    setSelectedVariation,
    addVariation,
    updateVariation,
    getLatestVariation
  };
} 