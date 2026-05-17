import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service to execute NLP analysis on earnings call transcripts and BDC filings.
 */
export const newsNlpService = {
  /**
   * Fetches sentiment and keyword scans for a company ticker.
   * @param {string} ticker
   * @returns {Promise<NlpSentimentResult>}
   */
  getSentiment: async (ticker) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/external/nlp/sentiment/${ticker}`);
      return response.data;
    } catch (error) {
      console.error(`NLP Service Error for ticker ${ticker}:`, error);
      return {
        bdcTicker: ticker.toUpperCase(),
        quarter: 'N/A',
        netSentimentScore: 0.0,
        keywordCounts: {
          spread_compression: 0,
          covenant_lite: 0,
          dry_powder: 0,
          deal_flow: 0,
          non_accrual: 0,
          competition: 0
        },
        source: 'FinBERT Engine (Fallback)',
        fetchedAt: new Date().toISOString()
      };
    }
  }
};
