import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for standardizing async API calls with loading, error, and data state.
 * @param {Function} apiFunc - Async function to call.
 * @param {boolean} immediate - Whether to execute immediately on mount.
 */
export function useApi(apiFunc, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || 'An error occurred');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}

export default useApi;
