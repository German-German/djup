"""
Live market data endpoints — Yahoo Finance, CoinGecko, Frankfurter, FRED.

No API keys required for the core endpoints. NewsAPI / GNews / Guardian
fall back gracefully and require keys via .env.
"""
from __future__ import annotations

import logging
import os
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Live Markets"])

USER_AGENT = "Djup-Terminal/1.4 (research; contact=ops@djup.local)"
HTTP_TIMEOUT = 12.0

# Tiny in-process cache to avoid hammering upstream endpoints
_CACHE: Dict[str, tuple[float, Any]] = {}


def _cache_get(key: str, ttl: float):
    item = _CACHE.get(key)
    if not item:
        return None
    ts, val = item
    if (time.time() - ts) > ttl:
        return None
    return val


def _cache_set(key: str, value: Any):
    _CACHE[key] = (time.time(), value)


# ---------------------------------------------------------------------------
# Yahoo Finance — equities, ETFs, BDC tickers. No key required.
# ---------------------------------------------------------------------------

YAHOO_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"


def _yahoo_quote(symbol: str) -> Optional[Dict[str, Any]]:
    cache_key = f"yh:{symbol.upper()}"
    cached = _cache_get(cache_key, ttl=30)
    if cached is not None:
        return cached

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(YAHOO_QUOTE_URL.format(symbol=symbol), params={"interval": "1d", "range": "5d"})
            r.raise_for_status()
            payload = r.json()
    except Exception as e:
        logger.warning(f"Yahoo quote failed for {symbol}: {e}")
        return None

    try:
        result = payload["chart"]["result"][0]
        meta = result["meta"]
        price = float(meta.get("regularMarketPrice") or 0.0)
        prev_close = float(meta.get("chartPreviousClose") or meta.get("previousClose") or price)
        change = price - prev_close
        change_pct = (change / prev_close * 100.0) if prev_close else 0.0
        out = {
            "ticker": symbol.upper(),
            "price": round(price, 4),
            "change": round(change, 4),
            "changePercent": round(change_pct, 4),
            "volume": int(meta.get("regularMarketVolume") or 0),
            "marketCap": None,
            "currency": meta.get("currency", "USD"),
            "exchange": meta.get("exchangeName"),
            "source": "Yahoo Finance",
            "fetchedAt": datetime.utcnow().isoformat() + "Z",
        }
        _cache_set(cache_key, out)
        return out
    except (KeyError, IndexError, TypeError) as e:
        logger.warning(f"Yahoo parse failed for {symbol}: {e}")
        return None


@router.get("/markets/quote/{ticker}")
def get_market_quote(ticker: str):
    """Live equity / ETF / BDC quote via Yahoo Finance."""
    q = _yahoo_quote(ticker)
    if not q:
        raise HTTPException(status_code=502, detail=f"Quote unavailable for {ticker}")
    return q


@router.get("/markets/quotes")
def get_market_quotes_batch(tickers: str = Query(..., description="Comma-separated symbols, e.g. ARCC,MAIN,SPY")):
    """Batch quote endpoint. Failed lookups are returned with `error` field."""
    out = []
    for sym in [t.strip().upper() for t in tickers.split(",") if t.strip()]:
        q = _yahoo_quote(sym)
        if q:
            out.append(q)
        else:
            out.append({"ticker": sym, "error": "unavailable"})
    return out


@router.get("/markets/history/{ticker}")
def get_market_history(ticker: str, range: str = "1mo", interval: str = "1d"):
    """Historical OHLCV via Yahoo Finance. Range: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max."""
    cache_key = f"yh-h:{ticker.upper()}:{range}:{interval}"
    cached = _cache_get(cache_key, ttl=180)
    if cached is not None:
        return cached

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(YAHOO_QUOTE_URL.format(symbol=ticker), params={"interval": interval, "range": range})
            r.raise_for_status()
            payload = r.json()
        result = payload["chart"]["result"][0]
        ts = result.get("timestamp", []) or []
        ind = result["indicators"]["quote"][0]
        closes = ind.get("close", [])
        bars = []
        for i, t in enumerate(ts):
            close = closes[i] if i < len(closes) else None
            if close is None:
                continue
            bars.append({
                "date": datetime.utcfromtimestamp(t).strftime("%Y-%m-%d"),
                "close": round(float(close), 4),
            })
        out = {"ticker": ticker.upper(), "range": range, "interval": interval, "bars": bars, "source": "Yahoo Finance"}
        _cache_set(cache_key, out)
        return out
    except Exception as e:
        logger.warning(f"Yahoo history failed for {ticker}: {e}")
        raise HTTPException(status_code=502, detail=f"History unavailable for {ticker}")


# ---------------------------------------------------------------------------
# CoinGecko — crypto. No key required for /simple/price.
# ---------------------------------------------------------------------------

COINGECKO_BASE = "https://api.coingecko.com/api/v3"


@router.get("/crypto/quotes")
def get_crypto_quotes(ids: str = Query("bitcoin,ethereum,solana,ripple,cardano", description="CoinGecko ids")):
    """Spot prices + 24h change for crypto via CoinGecko public API."""
    cache_key = f"cg:{ids}"
    cached = _cache_get(cache_key, ttl=60)
    if cached is not None:
        return cached

    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(
                f"{COINGECKO_BASE}/simple/price",
                params={
                    "ids": ids,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                    "include_market_cap": "true",
                },
            )
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning(f"CoinGecko failed: {e}")
        raise HTTPException(status_code=502, detail="CoinGecko unavailable")

    out = []
    for cid, vals in data.items():
        out.append({
            "id": cid,
            "symbol": cid[:4].upper(),
            "price": vals.get("usd"),
            "changePercent": vals.get("usd_24h_change"),
            "volume24h": vals.get("usd_24h_vol"),
            "marketCap": vals.get("usd_market_cap"),
            "source": "CoinGecko",
            "fetchedAt": datetime.utcnow().isoformat() + "Z",
        })
    _cache_set(cache_key, out)
    return out


# ---------------------------------------------------------------------------
# Frankfurter — FX rates. No key required.
# ---------------------------------------------------------------------------

@router.get("/fx/latest")
def get_fx_rates(base: str = "USD", symbols: str = "EUR,GBP,JPY,CHF,CAD,AUD"):
    """Latest FX rates via Frankfurter (free, ECB-sourced)."""
    cache_key = f"fx:{base}:{symbols}"
    cached = _cache_get(cache_key, ttl=300)
    if cached is not None:
        return cached
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}, follow_redirects=True) as client:
            r = client.get(
                "https://api.frankfurter.app/latest",
                params={"base": base, "symbols": symbols},
            )
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.warning(f"Frankfurter failed: {e}")
        raise HTTPException(status_code=502, detail="FX provider unavailable")

    out = {
        "base": data.get("base", base),
        "date": data.get("date"),
        "rates": data.get("rates", {}),
        "source": "Frankfurter / ECB",
        "fetchedAt": datetime.utcnow().isoformat() + "Z",
    }
    _cache_set(cache_key, out)
    return out


# ---------------------------------------------------------------------------
# FRED — current macro series, pulled live (replaces stale seed data).
# ---------------------------------------------------------------------------

FRED_BASE = "https://api.stlouisfed.org/fred/series/observations"

FRED_SERIES = {
    "hy_spread": "BAMLH0A0HYM2",        # HY OAS
    "ig_spread": "BAMLC0A0CM",          # IG OAS
    "sofr": "SOFR",                     # Secured Overnight Financing Rate
    "yield_curve": "T10Y2Y",            # 10Y - 2Y
    "treasury_10y": "DGS10",
    "treasury_2y": "DGS2",
    "fed_funds": "DFF",
    "cpi": "CPIAUCSL",
    "unemployment": "UNRATE",
}


def _fetch_fred(series_id: str, observation_start: str) -> List[Dict[str, Any]]:
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        return []
    cache_key = f"fred:{series_id}:{observation_start}"
    cached = _cache_get(cache_key, ttl=3600)
    if cached is not None:
        return cached
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(
                FRED_BASE,
                params={
                    "series_id": series_id,
                    "api_key": api_key,
                    "file_type": "json",
                    "observation_start": observation_start,
                    "sort_order": "asc",
                },
            )
            r.raise_for_status()
            obs = r.json().get("observations", [])
        rows = []
        for o in obs:
            v = o.get("value")
            if v in (None, ".", ""):
                continue
            try:
                rows.append({"date": o.get("date"), "value": float(v)})
            except (TypeError, ValueError):
                continue
        _cache_set(cache_key, rows)
        return rows
    except Exception as e:
        logger.warning(f"FRED {series_id} failed: {e}")
        return []


@router.get("/macro/live")
def get_macro_live(
    series: str = Query("hy_spread,ig_spread,sofr,yield_curve"),
    months: int = Query(18, ge=1, le=120),
):
    """
    Live macro overlay sourced directly from FRED at request time.
    Returns the same shape as /api/macro/overlay so charts can drop in.
    """
    requested = [s.strip() for s in series.split(",") if s.strip()]
    start = (datetime.utcnow() - timedelta(days=months * 31)).strftime("%Y-%m-%d")

    series_map: Dict[str, Dict[str, float]] = {}
    for nickname in requested:
        fred_id = FRED_SERIES.get(nickname)
        if not fred_id:
            continue
        for row in _fetch_fred(fred_id, start):
            d = row["date"]
            series_map.setdefault(d, {})[nickname] = row["value"]

    if not series_map:
        return []

    out = [{"date": d, "values": v} for d, v in sorted(series_map.items())]
    return out


@router.get("/macro/snapshot")
def get_macro_snapshot():
    """Single-point snapshot of headline macro values + change vs 30d ago."""
    start = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%d")
    snapshot: Dict[str, Dict[str, Optional[float]]] = {}

    for nickname, fred_id in FRED_SERIES.items():
        rows = _fetch_fred(fred_id, start)
        if not rows:
            snapshot[nickname] = {"value": None, "change": None, "asOf": None}
            continue
        latest = rows[-1]
        prior = rows[max(0, len(rows) - 22)]  # ~30d ago in business days
        change = latest["value"] - prior["value"]
        snapshot[nickname] = {
            "value": round(latest["value"], 4),
            "change": round(change, 4),
            "asOf": latest["date"],
        }
    snapshot["_source"] = "FRED / St. Louis Fed"
    snapshot["_fetchedAt"] = datetime.utcnow().isoformat() + "Z"
    return snapshot


# ---------------------------------------------------------------------------
# News — NewsAPI.org → GNews → Guardian fallback chain.
# ---------------------------------------------------------------------------

def _try_newsapi() -> Optional[List[Dict[str, Any]]]:
    key = os.getenv("NEWSAPI_KEY") or os.getenv("NEWS_API_KEY")
    if not key:
        return None
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(
                "https://newsapi.org/v2/top-headlines",
                params={"category": "business", "language": "en", "pageSize": 30, "apiKey": key},
            )
            r.raise_for_status()
            data = r.json()
        return [
            {
                "title": a.get("title"),
                "url": a.get("url"),
                "source": (a.get("source") or {}).get("name") or "NewsAPI",
                "publishedAt": a.get("publishedAt"),
                "description": a.get("description"),
            }
            for a in data.get("articles", [])
            if a.get("title") and a.get("url")
        ]
    except Exception as e:
        logger.warning(f"NewsAPI failed: {e}")
        return None


def _try_gnews() -> Optional[List[Dict[str, Any]]]:
    key = os.getenv("GNEWS_API_KEY")
    if not key:
        return None
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(
                "https://gnews.io/api/v4/top-headlines",
                params={"category": "business", "lang": "en", "max": 25, "apikey": key},
            )
            r.raise_for_status()
            data = r.json()
        return [
            {
                "title": a.get("title"),
                "url": a.get("url"),
                "source": (a.get("source") or {}).get("name") or "GNews",
                "publishedAt": a.get("publishedAt"),
                "description": a.get("description"),
            }
            for a in data.get("articles", [])
            if a.get("title") and a.get("url")
        ]
    except Exception as e:
        logger.warning(f"GNews failed: {e}")
        return None


def _try_guardian() -> Optional[List[Dict[str, Any]]]:
    key = os.getenv("GUARDIAN_API_KEY", "test")  # Guardian allows 'test' for low-volume use
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            r = client.get(
                "https://content.guardianapis.com/search",
                params={
                    "section": "business",
                    "order-by": "newest",
                    "show-fields": "trailText",
                    "page-size": 25,
                    "api-key": key,
                },
            )
            r.raise_for_status()
            data = r.json().get("response", {})
        items = []
        for a in data.get("results", []):
            items.append({
                "title": a.get("webTitle"),
                "url": a.get("webUrl"),
                "source": "The Guardian",
                "publishedAt": a.get("webPublicationDate"),
                "description": (a.get("fields") or {}).get("trailText"),
            })
        return items if items else None
    except Exception as e:
        logger.warning(f"Guardian failed: {e}")
        return None


@router.get("/news/latest")
def get_news_latest(category: str = Query("business")):
    """
    Latest business / markets / finance headlines. Auto-fallback:
    NewsAPI.org → GNews → The Guardian. The route always returns 200 with
    `source` indicating which upstream was used.
    """
    cache_key = f"news:{category}"
    cached = _cache_get(cache_key, ttl=300)  # 5-minute cache
    if cached is not None:
        return cached

    for fetcher, label in [(_try_newsapi, "newsapi"), (_try_gnews, "gnews"), (_try_guardian, "guardian")]:
        items = fetcher()
        if items:
            out = {
                "provider": label,
                "fetchedAt": datetime.utcnow().isoformat() + "Z",
                "items": items[:25],
            }
            _cache_set(cache_key, out)
            return out

    return {"provider": "none", "fetchedAt": datetime.utcnow().isoformat() + "Z", "items": []}
