/**
 * JSDoc definitions for Djup Terminal financial data models.
 * These types serve as the standard schema across the service and component layers.
 */

/**
 * @typedef {Object} BdcProfile
 * @property {string} ticker
 * @property {string} name
 * @property {string} cik
 * @property {string} source
 * @property {string} fetchedAt
 */

/**
 * @typedef {Object} BdcFinancialMetrics
 * @property {string} ticker
 * @property {number} navPerShare
 * @property {number} stockPrice
 * @property {number} navPremiumDiscountPct
 * @property {number} totalPortfolioFairValue
 * @property {number} nonAccrualRatePct
 * @property {number} weightedAvgYield
 * @property {number} firstLienPct
 * @property {number} totalLoanCount
 * @property {string} source
 * @property {string} asOfDate
 * @property {string} fetchedAt
 */

/**
 * @typedef {Object} MarketQuote
 * @property {string} ticker
 * @property {number} price
 * @property {number} change
 * @property {number} changePercent
 * @property {number} volume
 * @property {number} marketCap
 * @property {string} source
 * @property {string} fetchedAt
 */

/**
 * @typedef {Object} HistoricalPricePoint
 * @property {string} date
 * @property {number} close
 * @property {number} volume
 */

/**
 * @typedef {Object} MacroSeriesPoint
 * @property {string} date
 * @property {number} value
 * @property {string} seriesName
 * @property {string} source
 */

/**
 * @typedef {Object} FilingMetadata
 * @property {string} accessionNumber
 * @property {string} bdcTicker
 * @property {string} filingDate
 * @property {string} quarter
 * @property {string} formType
 * @property {string} processingStatus
 * @property {string} [errorMessage]
 */

/**
 * @typedef {Object} PrivateEquityDeal
 * @property {string} id
 * @property {string} companyName
 * @property {string} sector
 * @property {string} dealDate
 * @property {number} dealSizeMm
 * @property {string} sponsor
 * @property {string} dealType
 * @property {string} source
 * @property {string} availability
 */

/**
 * @typedef {Object} NlpSentimentResult
 * @property {string} bdcTicker
 * @property {string} quarter
 * @property {number} netSentimentScore
 * @property {Object} keywordCounts
 * @property {string} source
 */

/**
 * @typedef {Object} DataSourceStatus
 * @property {string} provider
 * @property {string} category
 * @property {string} status - 'active' | 'inactive' | 'cached' | 'rate-limited' | 'unconfigured'
 * @property {string} [lastChecked]
 */
export {};
