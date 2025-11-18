import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce Hook
 * Delays updating a value until after a specified delay has passed
 * Useful for search inputs to reduce API calls
 * 
 * On initial render, returns the value immediately to avoid blocking
 * page load. Subsequent updates are debounced.
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
 *   // First render: runs immediately
 *   // Subsequent changes: runs after 300ms delay
 *   fetchResults(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On first render, set value immediately without delay
    // This prevents blocking the initial page load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setDebouncedValue(value);
      return;
    }

    // For subsequent updates, debounce normally
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
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
