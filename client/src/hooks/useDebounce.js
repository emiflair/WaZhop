import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Delays updating a value until after a specified delay has passed
 * Useful for search inputs to reduce API calls
 * 
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {*} - The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // API call here
 *     fetchResults(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    // This ensures only the latest value triggers the update
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 * Returns a debounced version of a callback function
 * Useful for event handlers that should only fire after user stops typing
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300ms)
 * @returns {Function} - The debounced function
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback((value) => {
 *   fetchResults(value);
 * }, 300);
 * 
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 */
export function useDebouncedCallback(callback, delay = 300) {
  const [timeoutId, setTimeoutId] = useState(null);

  return (...args) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}

export default useDebounce;
