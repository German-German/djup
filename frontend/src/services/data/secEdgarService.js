import axios from 'axios';
import { getProviderStatus } from './dataProviderRegistry.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Service to fetch official SEC EDGAR filing list and parsed XBRL company facts.
 */
export const secEdgarService = {
  /**
   * Fetches latest company submissions/filings from the SEC EDGAR proxy endpoint.
   * @param {string} cik - Company central index key
   * @param {string} [formType='10-Q'] - Form type (e.g. 10-K, 10-Q, 8-K)
   * @returns {Promise<FilingMetadata[]>}
   */
  getFilings: async (cik, formType = '10-Q') => {
    try {
      const response = await axios.get(`${API_BASE_URL}/external/sec/filings/${cik}`, {
        params: { form_type: formType }
      });
      return response.data;
    } catch (error) {
      console.error(`SEC Service Error fetching filings list for CIK ${cik}:`, error);
      // Return local cache/mock fallback to keep client operational
      return [
        {
          cik: cik.padStart(10, '0'),
          accession: '0001234567-26-000045',
          date: '2026-05-15',
          document: 'form10q.htm',
          source: 'SEC EDGAR (Mock Fallback)',
          fetchedAt: new Date().toISOString()
        }
      ];
    }
  },

  /**
   * Fetches parsed company facts (XBRL facts) directly from SEC EDGAR.
   * @param {string} cik - Company central index key
   * @returns {Promise<Object>} Company facts JSON object
   */
  getCompanyFacts: async (cik) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/external/sec/facts/${cik}`);
      return response.data;
    } catch (error) {
      console.error(`SEC Service Error fetching facts for CIK ${cik}:`, error);
      return {
        cik,
        facts: {
          EntityName: { label: "Entity Name", description: "Company name", units: { text: [{ val: "BDC INC" }] } }
        },
        source: 'SEC EDGAR (Mock Fallback)',
        fetchedAt: new Date().toISOString()
      };
    }
  }
};
