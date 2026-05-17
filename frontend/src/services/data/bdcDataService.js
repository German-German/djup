import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service to manage BDC financial metrics and manager matrix summaries.
 */
export const bdcDataService = {
  /**
   * Fetches manager comparison scorecard matrix.
   * @param {string} [quarter]
   * @returns {Promise<BdcFinancialMetrics[]>}
   */
  getMatrix: async (quarter = null) => {
    try {
      const params = quarter ? { quarter } : {};
      const response = await axios.get(`${API_BASE_URL}/managers/matrix`, { params });
      return response.data.map(item => ({
        ...item,
        source: 'SEC EDGAR / Djup Ingestion Engine',
        fetchedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error("BDC Data Service Error (matrix):", error);
      return [];
    }
  },

  /**
   * Fetches a full financial deep dive for a single BDC manager.
   * @param {string} ticker
   * @returns {Promise<Object>}
   */
  getDeepDive: async (ticker) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/managers/deep-dive/${ticker}`);
      return {
        ...response.data,
        source: 'SEC EDGAR Company facts',
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`BDC Data Service Error (deep-dive for ${ticker}):`, error);
      throw error;
    }
  }
};
