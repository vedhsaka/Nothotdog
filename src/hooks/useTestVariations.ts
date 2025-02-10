import { useState, useEffect, useCallback } from 'react';
import { SimplifiedTestCases, TestVariation, TestVariations } from '@/types/variations';

export function useTestVariations(testId?: string) {
  const [variations, setVariations] = useState<TestVariations>({});
  const [variationData, setVariationData] = useState<SimplifiedTestCases | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (testId) {
      loadVariation(testId);
    }
  }, [testId]);
  
  const loadVariation = async (testId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tools/test-variations?testId=${testId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setVariationData(data); // data is of type SimplifiedTestCases
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load test variations'));
    } finally {
      setLoading(false);
    }
  };

  const addVariation = async (newVariation: TestVariation) => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools/test-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variation: newVariation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setVariations(prev => ({
        ...prev,
        [newVariation.testId]: [...(prev[newVariation.testId] || []), data.variation]
      }));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add variation'));
    } finally {
      setLoading(false);
    }
  };

  const updateVariation = async (variation: TestVariation) => {
    try {
      setLoading(true);
      await fetch('/api/tools/test-variations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variation }),
      });
      
      setVariations(prev => {
        const testVariations = prev[variation.testId] || [];
        return {
          ...prev,
          [variation.testId]: [...testVariations, variation]
        };
      });
    } catch (err) {
      console.error('Failed to update variation:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteVariation = async (variation: TestVariation) => {
    try {
      setLoading(true);
      const response = await fetch('/api/tools/test-variations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete variation'));
    } finally {
      setLoading(false);
    }
  };
  
  

  return {
    variations,
    loading,
    error,
    addVariation,
    updateVariation,
    variationData,
    deleteVariation
  };
}