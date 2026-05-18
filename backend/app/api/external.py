import os
import httpx
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.scrapers import edgar_scraper, fred_scraper, fmp_scraper
from app.models.database import BDCCompany, BDCSummary, NLPSentiment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/external", tags=["External Data Providers"])

@router.get("/status")
def get_external_status(db: Session = Depends(get_db)):
    """Returns the configuration status and health of all connected data providers."""
    sec_ua = os.getenv("SEC_USER_AGENT")
    fred_key = os.getenv("FRED_API_KEY")
    newsapi_key = os.getenv("NEWSAPI_KEY") or os.getenv("NEWS_API_KEY")
    gnews_key = os.getenv("GNEWS_API_KEY")
    guardian_key = os.getenv("GUARDIAN_API_KEY")

    bdc_count = db.query(BDCCompany).count()
    sentiment_count = db.query(NLPSentiment).count()

    news_provider = (
        "newsapi" if newsapi_key
        else "gnews" if gnews_key
        else "guardian" if guardian_key
        else "none"
    )

    return {
        "sec": {
            "provider": "sec-edgar",
            "category": "Filings & XBRL Facts",
            "status": "active" if sec_ua else "cached",
            "sourceName": "SEC EDGAR Submissions API",
            "details": f"Monitoring {bdc_count} BDC CIKs",
        },
        "macro": {
            "provider": "fred",
            "category": "Macroeconomic Indicators",
            "status": "active" if fred_key else "cached",
            "sourceName": "FRED · St. Louis Fed",
            "details": "Live series: SOFR, UST, HY/IG OAS, CPI",
        },
        "marketData": {
            "provider": "yahoo",
            "category": "Public Equity & ETF Quotes",
            "status": "active",
            "sourceName": "Yahoo Finance v8",
            "details": "Live quotes + 1d/5d/1mo/1y history (no key required)",
        },
        "crypto": {
            "provider": "coingecko",
            "category": "Crypto Spot",
            "status": "active",
            "sourceName": "CoinGecko Public API",
            "details": "USD spot + 24h change + market cap",
        },
        "fx": {
            "provider": "frankfurter",
            "category": "FX",
            "status": "active",
            "sourceName": "Frankfurter / ECB",
            "details": "ECB-sourced foreign exchange",
        },
        "news": {
            "provider": news_provider,
            "category": "Newswire",
            "status": "active" if news_provider != "none" else "unconfigured",
            "sourceName": "NewsAPI → GNews → Guardian",
            "details": f"Active provider: {news_provider}",
        },
        "nlp": {
            "provider": "finbert",
            "category": "NLP Transcripts & Sentiment",
            "status": "active",
            "sourceName": "Djup FinBERT NLP Engine",
            "details": f"Parsed {sentiment_count} earnings call quarters",
        },
    }

@router.get("/sec/filings/{cik}")
def get_sec_filings(cik: str, form_type: str = "10-Q"):
    """Proxy endpoint to fetch filings list for a company CIK directly from SEC EDGAR submissions API."""
    filings = edgar_scraper.get_filings_list(cik, form_type=form_type, limit=8)
    if not filings:
        return []
    
    # Enrich filings list with official SEC source metadata
    return [{
        **f,
        "source": "SEC EDGAR Submissions API",
        "sourceUrl": f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json",
        "fetchedAt": datetime.now().isoformat()
    } for f in filings]

@router.get("/sec/facts/{cik}")
def get_sec_facts(cik: str):
    """Proxy endpoint to fetch structured company facts (XBRL facts) for a company CIK directly from SEC EDGAR."""
    facts = edgar_scraper.get_company_facts(cik)
    if not facts:
        raise HTTPException(status_code=404, detail=f"Company facts not found for CIK {cik} on SEC EDGAR.")
    
    return {
        "cik": cik,
        "facts": facts,
        "source": "SEC EDGAR Company Facts API",
        "sourceUrl": f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik.zfill(10)}.json",
        "fetchedAt": datetime.now().isoformat()
    }

@router.get("/fred/series/{series_id}")
def get_fred_series(series_id: str, start_date: str = "2020-01-01"):
    """Proxy endpoint to fetch observations directly from FRED API."""
    obs = fred_scraper.fetch_fred_series(series_id, start_date=start_date)
    if not obs:
        # Return fallback mock series data to prevent dashboard crashes
        logger.warning(f"FRED API key missing or invalid series {series_id}. Returning mock series data.")
        mock_series = {
            "SOFR": [{"date": "2026-05-01", "value": 5.31}, {"date": "2026-05-15", "value": 5.33}],
            "BAMLH0A0HYM2": [{"date": "2026-05-01", "value": 3.12}, {"date": "2026-05-15", "value": 3.15}],
            "T10Y2Y": [{"date": "2026-05-01", "value": -0.32}, {"date": "2026-05-15", "value": -0.28}]
        }
        return [{
            **item,
            "seriesId": series_id,
            "source": "FRED (Mock Fallback)",
            "fetchedAt": datetime.now().isoformat()
        } for item in mock_series.get(series_id, [{"date": datetime.now().strftime("%Y-%m-%d"), "value": 5.0}])]

    return [{
        **o,
        "seriesId": series_id,
        "source": "FRED St. Louis Fed API",
        "sourceUrl": f"https://api.stlouisfed.org/fred/series/observations?series_id={series_id}",
        "fetchedAt": datetime.now().isoformat()
    } for o in obs]

@router.get("/market/quote/{ticker}")
def get_market_quote(ticker: str, db: Session = Depends(get_db)):
    """
    Legacy route — kept for backward compatibility. Now proxies to the live
    Yahoo Finance integration in /api/markets/quote. Falls back to cached
    BDCSummary stock_price if Yahoo is unreachable.
    """
    from app.api.markets import _yahoo_quote

    ticker_upper = ticker.upper()
    q = _yahoo_quote(ticker_upper)
    if q:
        return q

    summary = (
        db.query(BDCSummary)
        .filter(BDCSummary.bdc_ticker == ticker_upper)
        .order_by(BDCSummary.filing_date.desc())
        .first()
    )
    if summary and summary.stock_price:
        return {
            "ticker": ticker_upper,
            "price": float(summary.stock_price),
            "change": 0.0,
            "changePercent": 0.0,
            "volume": 0,
            "marketCap": float(summary.total_portfolio_fair_value or 0.0),
            "source": "Database cache (Yahoo unreachable)",
            "fetchedAt": datetime.now().isoformat(),
        }

    raise HTTPException(status_code=502, detail=f"Quote unavailable for {ticker_upper}")

@router.get("/private-equity/deals")
def get_private_equity_deals():
    """PE Deal flow endpoint. Returns status code 200 with structured empty array and premium source metadata."""
    return {
        "deals": [],
        "source": "FactSet / ION PE Data",
        "availability": "premium-required",
        "message": "Premium Deal Flow Subscription Required. Configure FACTSET_API_KEY."
    }

@router.get("/nlp/sentiment/{ticker}")
def get_nlp_sentiment(ticker: str, db: Session = Depends(get_db)):
    """Fetch structured NLP sentiments and key term frequencies parsed from filings or earnings calls."""
    ticker_upper = ticker.upper()
    sentiment = db.query(NLPSentiment).filter(NLPSentiment.bdc_ticker == ticker_upper).order_by(NLPSentiment.quarter.desc()).first()
    
    if sentiment:
        return {
            "bdcTicker": ticker_upper,
            "quarter": sentiment.quarter,
            "netSentimentScore": sentiment.net_sentiment_score,
            "keywordCounts": {
                "spread_compression": sentiment.keyword_spread_compression or 0,
                "covenant_lite": sentiment.keyword_covenant_lite or 0,
                "dry_powder": sentiment.keyword_dry_powder or 0,
                "deal_flow": sentiment.keyword_deal_flow or 0,
                "non_accrual": sentiment.keyword_non_accrual or 0,
                "competition": sentiment.keyword_competition or 0
            },
            "source": "Djup FinBERT NLP Engine",
            "fetchedAt": datetime.now().isoformat()
        }
        
    return {
        "bdcTicker": ticker_upper,
        "quarter": "Q1-2026",
        "netSentimentScore": 0.42,
        "keywordCounts": {
            "spread_compression": 2,
            "covenant_lite": 0,
            "dry_powder": 5,
            "deal_flow": 3,
            "non_accrual": 1,
            "competition": 4
        },
        "source": "FinBERT NLP Engine (Mock Default)",
        "fetchedAt": datetime.now().isoformat()
    }
