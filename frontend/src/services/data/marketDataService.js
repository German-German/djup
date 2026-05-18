import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Live market quotes via Yahoo Finance (server-proxied) and CoinGecko.
 * The backend handles caching, batching, and fallbacks.
 */
export const marketDataService = {
  getQuote: async (ticker) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/markets/quote/${ticker}`);
      return data;
    } catch (e) {
      console.warn(`marketDataService.getQuote(${ticker}) failed`, e);
      return {
        ticker: ticker.toUpperCase(),
        price: 0,
        change: 0,
        changePercent: 0,
        source: 'unavailable',
      };
    }
  },

  getQuotes: async (tickers) => {
    if (!tickers || tickers.length === 0) return [];
    try {
      const { data } = await axios.get(`${API_BASE_URL}/markets/quotes`, {
        params: { tickers: tickers.join(',') },
      });
      return Array.isArray(data) ? data.filter((q) => !q.error) : [];
    } catch (e) {
      console.warn('marketDataService.getQuotes failed', e);
      return [];
    }
  },

  getHistory: async (ticker, range = '1mo', interval = '1d') => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/markets/history/${ticker}`, {
        params: { range, interval },
      });
      return data;
    } catch (e) {
      console.warn(`marketDataService.getHistory(${ticker}) failed`, e);
      return { ticker, bars: [], source: 'unavailable' };
    }
  },
};

export const cryptoService = {
  getQuotes: async (ids = ['bitcoin', 'ethereum', 'solana']) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/crypto/quotes`, {
        params: { ids: ids.join(',') },
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('cryptoService.getQuotes failed', e);
      return [];
    }
  },
};

export const fxService = {
  getLatest: async (base = 'USD', symbols = ['EUR', 'GBP', 'JPY', 'CHF']) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/fx/latest`, {
        params: { base, symbols: symbols.join(',') },
      });
      return data;
    } catch (e) {
      console.warn('fxService.getLatest failed', e);
      return { base, rates: {}, source: 'unavailable' };
    }
  },
};

export const macroLiveService = {
  getSnapshot: async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/macro/snapshot`);
      return data;
    } catch (e) {
      console.warn('macroLiveService.getSnapshot failed', e);
      return {};
    }
  },
  getOverlay: async (series, months = 18) => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/macro/live`, {
        params: { series: series.join(','), months },
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('macroLiveService.getOverlay failed', e);
      return [];
    }
  },
};
