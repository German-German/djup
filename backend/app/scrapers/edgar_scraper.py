import os
import time
import logging
import httpx
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin
import io

logger = logging.getLogger(__name__)

# SEC requires a user-agent in the format "Company Name admin@company.com"
SEC_USER_AGENT = os.getenv("SEC_USER_AGENT", "DjupApp contact@djup.com")
HEADERS = {"User-Agent": SEC_USER_AGENT}

def get_filings_list(cik: str, form_type: str = "10-Q", limit: int = 8) -> list[dict]:
    # Left pad cik with zeros if needed (SEC expects 10 digits in some places, but API works with pure number)
    cik_padded = str(cik).zfill(10)
    url = f"https://data.sec.gov/submissions/CIK{cik_padded}.json"
    
    try:
        response = httpx.get(url, headers=HEADERS)
        response.raise_for_status()
        time.sleep(0.15) # Respect rate limits
        data = response.json()
        
        recent = data.get("filings", {}).get("recent", {})
        if not recent:
            return []
            
        forms = recent.get("form", [])
        filing_dates = recent.get("filingDate", [])
        accessions = recent.get("accessionNumber", [])
        primary_docs = recent.get("primaryDocument", [])
        
        results = []
        for i in range(len(forms)):
            if forms[i] == form_type:
                results.append({
                    "cik": cik_padded,
                    "accession": accessions[i],
                    "date": filing_dates[i],
                    "document": primary_docs[i]
                })
                if len(results) >= limit:
                    break
                    
        return results
    except Exception as e:
        logger.error(f"Error fetching filings list for CIK {cik}: {e}")
        return []

def download_filing_html(cik: str, accession: str) -> str | None:
    # Remove zeros for CIK directory
    cik_no_zeros = str(int(cik))
    accession_clean = accession.replace("-", "")
    base_url = f"https://www.sec.gov/Archives/edgar/data/{cik_no_zeros}/{accession_clean}/"
    
    try:
        # Fetch the index page
        index_url = f"{base_url}index.json"
        response = httpx.get(index_url, headers=HEADERS)
        response.raise_for_status()
        time.sleep(0.15)
        index_data = response.json()
        
        # Find 10-Q document
        doc_filename = None
        for file_info in index_data.get("directory", {}).get("item", []):
            name = file_info.get("name", "")
            if name.endswith(".htm") or name.endswith(".html"):
                # Usually there are multiple HTML files. The primary one is often named after the accession or company.
                # A robust way is to just grab the first HTML, or we could pass the primaryDocument from get_filings_list.
                # Since we don't have it here, we will look for '10q' in name or just take the largest HTML.
                # But actually, the SEC index.json doesn't contain the form type mapping directly inside `item`.
                pass
                
        # Better: use the index page HTML if index.json is flaky, but since we didn't pass primaryDocument, 
        # let's assume we can find the primary HTML by just looking for the main filing. 
        # Wait, the prompt says "First fetch the index page to find the correct 10-Q document filename"
        # Let's fetch the html index page and parse it.
        index_html_url = f"{base_url}{accession}-index.html"
        resp = httpx.get(index_html_url, headers=HEADERS)
        resp.raise_for_status()
        time.sleep(0.15)
        soup = BeautifulSoup(resp.text, 'html.parser')
        
        # Find the row where Document type is 10-Q
        tables = soup.find_all('table', class_='tableFile')
        if tables:
            for row in tables[0].find_all('tr'):
                cols = row.find_all('td')
                if len(cols) > 3 and "10-Q" in cols[3].text:
                    link = cols[2].find('a')
                    if link:
                        doc_filename = link.text
                        break
        
        if not doc_filename:
            logger.error(f"Could not find 10-Q filename in index for accession {accession}")
            return None
            
        doc_url = urljoin(base_url, doc_filename)
        doc_resp = httpx.get(doc_url, headers=HEADERS)
        doc_resp.raise_for_status()
        time.sleep(0.15)
        return doc_resp.text
        
    except Exception as e:
        logger.error(f"Error downloading filing HTML for {accession}: {e}")
        return None

def find_investment_tables(html: str) -> list[pd.DataFrame]:
    soup = BeautifulSoup(html, 'html.parser')
    tables = soup.find_all('table')
    
    keywords = ["interest rate", "fair value", "first lien", "maturity date", 
                "par amount", "principal amount", "portfolio company"]
    
    matching_dfs = []
    
    for table in tables:
        text = table.get_text().lower()
        match_count = sum(1 for kw in keywords if kw in text)
        
        if match_count >= 3:
            try:
                # pandas read_html expects a string of the HTML table
                df_list = pd.read_html(io.StringIO(str(table)))
                if df_list:
                    matching_dfs.append(df_list[0])
            except Exception as e:
                logger.warning(f"Failed to parse table to DataFrame: {e}")
                
    return matching_dfs

def fetch_latest_filing(bdc_ticker: str, cik: str, already_processed: list[str]) -> dict | None:
    logger.info(f"Fetching latest filing for {bdc_ticker} (CIK: {cik})")
    
    filings = get_filings_list(cik, form_type="10-Q", limit=8)
    if not filings:
        logger.warning(f"No 10-Q filings found for {bdc_ticker}")
        return None
        
    # Filter out already processed
    unprocessed = [f for f in filings if f['accession'] not in already_processed]
    
    if not unprocessed:
        logger.info(f"All recent filings for {bdc_ticker} have already been processed.")
        return None
        
    latest_filing = unprocessed[0]
    accession = latest_filing['accession']
    
    logger.info(f"Downloading HTML for {bdc_ticker} accession {accession}")
    html_content = download_filing_html(cik, accession)
    
    if not html_content:
        logger.error(f"Failed to download HTML for {accession}")
        return None
        
    latest_filing['html_content'] = html_content
    return latest_filing

def get_company_facts(cik: str) -> dict:
    # Left pad cik to 10 digits
    cik_padded = str(cik).zfill(10)
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik_padded}.json"
    
    try:
        response = httpx.get(url, headers=HEADERS)
        response.raise_for_status()
        time.sleep(0.15)
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching company facts for CIK {cik}: {e}")
        return {}
