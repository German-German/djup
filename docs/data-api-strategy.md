# Djup Terminal - Data API Strategy & Provider Registry Report

This document outlines the institutional data integration architecture for the Djup Terminal. It details how the platform combines official public APIs (SEC EDGAR, FRED) with configured premium providers (FMP, EODHD, Polygon, FactSet) under a secure, server-sided abstraction layer to prevent credential leaks and ensure data consistency.

---

## 🏛️ Data Strategy Overview

Djup Terminal adheres to a hierarchical, credential-safe data-sourcing model:
1. **Official / Free Tier**: Official Federal Reserve (FRED) API for macroeconomic indices, and the SEC EDGAR company facts/submissions API for core BDC filings and structured XBRL statements.
2. **Configurable Market/NLP Tier**: Paid or developer-tier commercial providers (Financial Modeling Prep, Polygon.io, Alpha Vantage) abstracting stock metrics, index quotes, and corporate events.
3. **Institutional Private Equity Tier**: Empty-state fallback models for high-value datasets (FactSet, ION Private Equity) with clean, modular interface contracts, ensuring premium buyers can unlock coverage by entering keys.

---

## 📊 Provider Strategy Table

| Category | Recommended Provider | Authentication | Env Variable | Status in Djup |
| :--- | :--- | :--- | :--- | :--- |
| **SEC / Filings** | **SEC EDGAR API** | User-Agent Header | `SEC_USER_AGENT` | **Active (Free / Official)** |
| **Macroeconomic** | **FRED API** | Query API Key | `FRED_API_KEY` | **Active (Free / Official)** |
| **Market Data** | **Financial Modeling Prep (FMP) / Polygon** | Query API Key | `FMP_API_KEY` / `POLYGON_API_KEY` | **Active (Configurable)** |
| **Private Credit / BDCs**| **Djup Ingestion Service (derived from SEC)** | SQLite/PostgreSQL cached data | N/A | **Active (Proprietary)** |
| **Private Equity / Deals**| **FactSet / ION PE Data** | API Token / Client Secret | `FACTSET_API_KEY` | **Interface Ready / Premium Empty State** |
| **News & NLP** | **GNews / SEC Filing NLP Scan** | Query API Key | `GNEWS_API_KEY` | **Active (NLP Keyword Matching)** |

---

## 🛠️ Architecture & Normalization Specifications

To avoid exposing high-value paid credentials to the browser, all paid data requests are handled by the **FastAPI Backend Service Layer**. The frontend React application utilizes the **DataProviderRegistry** and modular service components to consume uniform, type-safe structures.

### Shared Types (`src/types/financialData.js`)

To ensure clean pair-programming and modular frontends, all data returned by frontend services is mapped to one of the following schemas:

* **`BdcProfile`**: Company details, CIK, and ticker mappings.
* **`BdcFinancialMetrics`**: NAV per share, NII, debt-to-equity, non-accrual rates, yield tranches, and originations/repayments.
* **`MarketQuote`**: Real-time stock prices, volume, market cap, and daily changes.
* **`MacroSeriesPoint`**: Normalised economic time series data.
* **`FilingMetadata`**: Filing dates, forms, accession numbers, and SEC submission references.
* **`PrivateEquityDeal`**: Transaction listings, valuation multiples, and sponsors.
* **`DataSourceStatus`**: Diagnostic health tracking of individual data providers.
