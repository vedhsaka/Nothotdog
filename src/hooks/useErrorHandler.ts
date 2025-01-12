import { useState, useCallback } from 'react';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: unknown;
}

export function useErrorHandler() {
  const [error, setError] = useState<ErrorState | null>(null);

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught:', error);

    if (error instanceof Error) {
      setError({
        message: error.message,
        type: 'error',
        details: error.stack
      });
      return;
    }

    setError({
      message: typeof error === 'string' ? error : 'An unexpected error occurred',
      type: 'error',
      details: error
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showWarning = useCallback((message: string, details?: unknown) => {
    setError({ message, type: 'warning', details });
  }, []);

  const showInfo = useCallback((message: string, details?: unknown) => {
    setError({ message, type: 'info', details });
  }, []);

  return { error, handleError, clearError, showWarning, showInfo };
} 