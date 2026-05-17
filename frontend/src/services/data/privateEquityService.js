import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service to manage private equity deals and M&A activities.
 */
export const privateEquityService = {
  /**
   * Fetches latest private equity transaction flow.
   * @returns {Promise<Object>}
   */
  getDeals: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/external/private-equity/deals`);
      return response.data;
    } catch (error) {
      console.error("Private Equity Service Error:", error);
      return {
        deals: [],
        source: 'FactSet / ION PE Data',
        availability: 'premium-required',
        message: 'Premium Deal Flow Subscription Required. Configure FACTSET_API_KEY.'
      };
    }
  }
};
