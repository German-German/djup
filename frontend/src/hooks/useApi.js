import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useDashboardStore from '../store/dashboardStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const useApi = (endpoint, initialFetch = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const selectedQuarter = useDashboardStore(state => state.selectedQuarter);
  const selectedBDCs = useDashboardStore(state => state.selectedBDCs);
  const setGlobalLoading = useDashboardStore(state => state.setLoading);
  const setGlobalError = useDashboardStore(state => state.setError);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setGlobalLoading(true);
    setError(null);
    setGlobalError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (selectedQuarter) {
        params.append('quarter', selectedQuarter);
      }
      
      if (selectedBDCs && selectedBDCs.length > 0) {
        params.append('bdc_tickers', selectedBDCs.join(','));
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const response = await axios.get(url, { params });
      
      setData(response.data);
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      const errorMessage = err.response?.data?.detail || err.message || 'An error occurred fetching data';
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }, [endpoint, selectedQuarter, selectedBDCs, setGlobalLoading, setGlobalError]);

  useEffect(() => {
    if (initialFetch) {
      fetchData();
    }
  }, [fetchData, initialFetch]);

  return { data, loading, error, refetch: fetchData };
};

export default useApi;
