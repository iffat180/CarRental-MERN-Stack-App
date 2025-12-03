import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for owner data fetching with loading and error states
 * @param {Function} fetchFunction - The async function to fetch data
 * @returns {Object} - { data, isLoading, error, fetchData, setData }
 */
export const useOwnerData = (fetchFunction) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFunction(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction]);

  return { data, isLoading, error, fetchData, setData };
};

