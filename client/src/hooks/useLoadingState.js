import { useState, useCallback } from 'react';

/**
 * useLoadingState Hook
 * Manages loading states for async operations with automatic error handling
 * 
 * @param {boolean} initialLoading - Initial loading state
 * @returns {Object} - Loading state and handlers
 */
export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  /**
   * Execute async operation with loading state
   */
  const execute = useCallback(async (asyncFn, ...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    setIsLoading,
    setError,
    setData
  };
};

/**
 * useMultipleLoadingStates Hook
 * Manages multiple loading states for different operations
 * 
 * @param {Array} keys - Array of state keys
 * @returns {Object} - Loading states and handlers
 */
export const useMultipleLoadingStates = (keys = []) => {
  const initialState = keys.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

  const [loadingStates, setLoadingStates] = useState(initialState);

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(state => state);

  return {
    loadingStates,
    setLoading,
    isAnyLoading
  };
};

/**
 * useAsyncState Hook
 * Combines loading, data, and error state with async execution
 */
export const useAsyncState = (asyncFn) => {
  const [state, setState] = useState({
    isLoading: false,
    data: null,
    error: null
  });

  const execute = useCallback(async (...args) => {
    setState({ isLoading: true, data: null, error: null });

    try {
      const result = await asyncFn(...args);
      setState({ isLoading: false, data: result, error: null });
      return result;
    } catch (error) {
      setState({ isLoading: false, data: null, error });
      throw error;
    }
  }, [asyncFn]);

  const reset = useCallback(() => {
    setState({ isLoading: false, data: null, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

/**
 * useDebouncedLoading Hook
 * Shows loading state only after a delay to prevent flashing
 * 
 * @param {number} delay - Delay in ms before showing loading (default 200ms)
 */
export const useDebouncedLoading = (delay = 200) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowLoading(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setShowLoading(false);
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading
  };
};

export default useLoadingState;
