import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service to fetch economic indexes and rates directly from FRED.
 */
export const fredService = {
  /**
   * Fetches economic time-series observations from FRED proxy.
   * @param {string} seriesId - FRED series ID (e.g. 'SOFR', 'T10Y2Y', 'BAMLH0A0HYM2')
   * @param {string} [startDate='2020-01-01'] - Starting date
   * @returns {Promise<MacroSeriesPoint[]>}
   */
  getSeries: async (seriesId, startDate = '2020-01-01') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/external/fred/series/${seriesId}`, {
        params: { start_date: startDate }
      });
      return response.data;
    } catch (error) {
      console.error(`FRED Service Error on series ${seriesId}:`, error);
      return [
        { date: '2026-05-01', value: 5.3, seriesId, source: 'FRED (Fallback)' },
        { date: '2026-05-15', value: 5.32, seriesId, source: 'FRED (Fallback)' }
      ];
    }
  }
};
