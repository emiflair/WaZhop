import { useState, useCallback } from 'react';

/**
 * useOptimistic Hook
 * Manages optimistic UI updates with rollback on error
 * 
 * @param {Array} initialData - Initial data array
 * @param {Function} apiCall - Async function that performs the actual API call
 * @returns {Object} - State and handlers for optimistic updates
 */
export const useOptimistic = (initialData = []) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Add item optimistically
   */
  const optimisticAdd = useCallback(async (item, apiCall) => {
    // Generate temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = { ...item, id: tempId, _id: tempId, isOptimistic: true };

    // Add immediately to UI
    setData(prev => [optimisticItem, ...prev]);
    setIsLoading(true);
    setError(null);

    try {
      // Make actual API call
      const result = await apiCall(item);
      
      // Replace temporary item with real one
      setData(prev => 
        prev.map(i => i.id === tempId || i._id === tempId ? result : i)
      );
      
      return result;
    } catch (err) {
      // Rollback on error
      setData(prev => prev.filter(i => i.id !== tempId && i._id !== tempId));
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update item optimistically
   */
  const optimisticUpdate = useCallback(async (id, updates, apiCall) => {
    // Store original item for rollback
    const originalItem = data.find(item => item.id === id || item._id === id);
    
    if (!originalItem) {
      throw new Error('Item not found');
    }

    // Update immediately in UI
    setData(prev => 
      prev.map(item => 
        item.id === id || item._id === id 
          ? { ...item, ...updates, isOptimistic: true }
          : item
      )
    );
    setIsLoading(true);
    setError(null);

    try {
      // Make actual API call
      const result = await apiCall(id, updates);
      
      // Update with real data
      setData(prev => 
        prev.map(item => 
          item.id === id || item._id === id ? result : item
        )
      );
      
      return result;
    } catch (err) {
      // Rollback on error
      setData(prev => 
        prev.map(item => 
          item.id === id || item._id === id ? originalItem : item
        )
      );
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  /**
   * Delete item optimistically
   */
  const optimisticDelete = useCallback(async (id, apiCall) => {
    // Store original item for rollback
    const originalItem = data.find(item => item.id === id || item._id === id);
    
    if (!originalItem) {
      throw new Error('Item not found');
    }

    // Store original index for restoration
    const originalIndex = data.findIndex(item => item.id === id || item._id === id);

    // Remove immediately from UI
    setData(prev => prev.filter(item => item.id !== id && item._id !== id));
    setIsLoading(true);
    setError(null);

    try {
      // Make actual API call
      await apiCall(id);
      return true;
    } catch (err) {
      // Rollback on error - restore at original position
      setData(prev => {
        const newData = [...prev];
        newData.splice(originalIndex, 0, originalItem);
        return newData;
      });
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [data]);

  /**
   * Reset data
   */
  const resetData = useCallback((newData) => {
    setData(newData);
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    optimisticAdd,
    optimisticUpdate,
    optimisticDelete,
    resetData,
    setData
  };
};

/**
 * useOptimisticAction Hook
 * Simpler version for single actions without data management
 * 
 * @param {Function} action - Async action to perform
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const useOptimisticAction = (action, onSuccess, onError) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);

    // Execute optimistic update immediately
    if (onSuccess) {
      onSuccess();
    }

    try {
      // Perform actual action
      const result = await action(...args);
      return result;
    } catch (err) {
      // Rollback on error
      if (onError) {
        onError(err);
      }
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [action, onSuccess, onError]);

  return {
    execute,
    isLoading,
    error
  };
};

export default useOptimistic;
