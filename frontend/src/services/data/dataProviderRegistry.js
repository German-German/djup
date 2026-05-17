/**
 * Global provider configuration registry for the Djup Terminal.
 * Determines which external/local API sources are used for different categories of financial intelligence.
 */
export const dataProviders = {
  sec: "sec-edgar",
  macro: "fred",
  marketData: import.meta.env.VITE_MARKET_DATA_PROVIDER || "fmp",
  privateEquity: "premium-provider-required",
  news: "sec-filings-first"
};

export const getProviderStatus = (category) => {
  switch (category) {
    case 'sec':
      return { provider: dataProviders.sec, status: 'active', sourceName: 'SEC EDGAR Submissions API' };
    case 'macro':
      return { provider: dataProviders.macro, status: 'active', sourceName: 'FRED St. Louis Fed API' };
    case 'marketData':
      const hasKey = !!(import.meta.env.VITE_FMP_API_KEY || import.meta.env.VITE_POLYGON_API_KEY || import.meta.env.VITE_ALPHA_VANTAGE_API_KEY);
      return { 
        provider: dataProviders.marketData, 
        status: hasKey ? 'active' : 'unconfigured', 
        sourceName: dataProviders.marketData.toUpperCase() + ' API' 
      };
    case 'privateEquity':
      return { provider: dataProviders.privateEquity, status: 'unconfigured', sourceName: 'Premium Provider Required' };
    case 'news':
      return { provider: dataProviders.news, status: 'active', sourceName: 'SEC Filings NLP Engine' };
    default:
      return { provider: 'unknown', status: 'inactive', sourceName: 'N/A' };
  }
};
