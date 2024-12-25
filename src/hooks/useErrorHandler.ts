import { useState, useCallback } from 'react';
import { ApiError } from '@/services/api/config';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: unknown;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught:', error);

    if (error instanceof ApiError) {
      setError({
        message: error.message,
        type: 'error',
        details: error.data
      });
      return;
    }

    if (error instanceof Error) {
      setError({
        message: error.message,
        type: 'error',
        details: error.stack
      });
      return;
    }

    setError({
      message: 'An unexpected error occurred',
      type: 'error',
      details: error
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showWarning = useCallback((message: string, details?: unknown) => {
    setError({
      message,
      type: 'warning',
      details
    });
  }, []);

  const showInfo = useCallback((message: string, details?: unknown) => {
    setError({
      message,
      type: 'info',
      details
    });
  }, []);

  return {
    error,
    handleError,
    clearError,
    showWarning,
    showInfo
  };
} 