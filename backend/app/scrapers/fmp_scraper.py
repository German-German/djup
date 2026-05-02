import os
import logging
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)

def fetch_bdc_price_data(ticker: str) -> dict:
    api_key = os.getenv("FMP_API_KEY")
    if not api_key:
        logger.error("FMP_API_KEY not found in environment")
        return {}
        
    url = f"https://financialmodelingprep.com/api/v3/quote/{ticker}"
    params = {"apikey": api_key}
    
    try:
        response = httpx.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        if not data:
            logger.warning(f"No price data found for ticker {ticker}")
            return {}
            
        quote = data[0]
        
        return {
            "ticker": ticker,
            "price": quote.get("price"),
            "market_cap": quote.get("marketCap"),
            "pe_ratio": quote.get("pe"),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching price data for {ticker}: {e}")
        return {}
