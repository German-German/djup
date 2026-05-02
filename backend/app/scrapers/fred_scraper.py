import os
import logging
import httpx

logger = logging.getLogger(__name__)

def fetch_fred_series(series_id: str, start_date: str = "2019-01-01") -> list[dict]:
    api_key = os.getenv("FRED_API_KEY")
    if not api_key:
        logger.error("FRED_API_KEY not found in environment")
        return []
        
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": series_id,
        "api_key": api_key,
        "file_type": "json",
        "observation_start": start_date
    }
    
    try:
        response = httpx.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        observations = data.get("observations", [])
        results = []
        
        for obs in observations:
            val_str = obs.get("value")
            if val_str == ".":
                continue
                
            try:
                val = float(val_str)
            except (ValueError, TypeError):
                val = None
                
            results.append({
                "date": obs.get("date"),
                "value": val
            })
            
        return results
    except Exception as e:
        logger.error(f"Error fetching FRED series {series_id}: {e}")
        return []

def fetch_all_macro_series() -> dict:
    series_mapping = {
        "BAMLH0A0HYM2": "hy_spread",
        "SOFR": "sofr",
        "T10Y2Y": "yield_curve",
        "CPIAUCSL": "cpi",
        "BAMLC0A0CM": "ig_spread"
    }
    
    results = {}
    for series_id, nickname in series_mapping.items():
        logger.info(f"Fetching FRED series: {nickname} ({series_id})")
        obs = fetch_fred_series(series_id)
        results[nickname] = obs
        
    return results
