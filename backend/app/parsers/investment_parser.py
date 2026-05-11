import logging

logger = logging.getLogger(__name__)

def parse_10q_investments(html_content: str, bdc_ticker: str) -> list[dict]:
    """
    Parses 10-Q HTML content and extracts investment data into a list of loan dictionaries.
    """
    logger.info(f"Parsing 10-Q investments for {bdc_ticker}")
    # In a real implementation, this would use edgar_scraper.find_investment_tables
    # and map the DataFrames to dictionaries matching the BDCLoan schema.
    # For now, returning an empty list as a placeholder.
    return []
