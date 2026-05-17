import { describe, it, expect, vi } from 'vitest';
import { dataProviders, getProviderStatus } from './dataProviderRegistry.js';
import { secEdgarService } from './secEdgarService.js';
import { fredService } from './fredService.js';
import { marketDataService } from './marketDataService.js';

describe('Data Sourcing Layer Tests', () => {
  describe('Provider Registry', () => {
    it('should select default providers correctly', () => {
      expect(dataProviders.sec).toBe('sec-edgar');
      expect(dataProviders.macro).toBe('fred');
      expect(dataProviders.privateEquity).toBe('premium-provider-required');
    });

    it('should query correct status', () => {
      const secStatus = getProviderStatus('sec');
      expect(secStatus.status).toBe('active');
      expect(secStatus.sourceName).toBe('SEC EDGAR Submissions API');
    });
  });

  describe('SEC EDGAR Service', () => {
    it('should return fallback filing info when CIK is not configured/invalid', async () => {
      const filings = await secEdgarService.getFilings('9999999999');
      expect(filings).toBeInstanceOf(Array);
      expect(filings.length).toBeGreaterThan(0);
      expect(filings[0].cik).toBe('9999999999');
    });
  });

  describe('FRED Service', () => {
    it('should fetch macroeconomic points with fallback', async () => {
      const obs = await fredService.getSeries('SOFR');
      expect(obs).toBeInstanceOf(Array);
      expect(obs[0].value).toBe(5.3);
    });
  });

  describe('Market Data Service', () => {
    it('should resolve fallback market quote for tickers', async () => {
      const quote = await marketDataService.getQuote('BX');
      expect(quote.ticker).toBe('BX');
      expect(quote.price).toBe(15.0);
    });
  });
});
