import pytest
import pandas as pd
from app.scrapers.edgar_scraper import get_filings_list, download_filing_html, find_investment_tables, fetch_latest_filing

@pytest.fixture
def mock_sec_filings_json():
    return {
        "filings": {
            "recent": {
                "form": ["10-Q", "8-K", "10-K", "10-Q"],
                "filingDate": ["2024-08-01", "2024-07-15", "2024-02-28", "2024-05-01"],
                "accessionNumber": ["0001-24-001", "0001-24-002", "0001-24-003", "0001-24-004"],
                "primaryDocument": ["10q.htm", "8k.htm", "10k.htm", "10q2.htm"]
            }
        }
    }

def test_get_filings_list(httpx_mock, mock_sec_filings_json):
    cik = "12345"
    httpx_mock.add_response(
        url="https://data.sec.gov/submissions/CIK0000012345.json",
        json=mock_sec_filings_json
    )
    
    results = get_filings_list(cik, form_type="10-Q", limit=8)
    
    assert len(results) == 2
    assert results[0]["accession"] == "0001-24-001"
    assert results[1]["accession"] == "0001-24-004"
    assert results[0]["date"] == "2024-08-01"

def test_download_filing_html(httpx_mock):
    cik = "12345"
    accession = "0001-24-001"
    
    # Mock index.json
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/index.json",
        json={"directory": {"item": [{"name": "10q.htm"}]}}
    )
    
    # Mock index.html
    mock_index_html = """
    <html>
        <body>
            <table class="tableFile">
                <tr>
                    <td></td><td></td>
                    <td><a href="10q.htm">10q.htm</a></td>
                    <td>10-Q</td>
                </tr>
            </table>
        </body>
    </html>
    """
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/0001-24-001-index.html",
        text=mock_index_html
    )
    
    # Mock document HTML
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/10q.htm",
        text="<html><body>Actual Filing Content</body></html>"
    )
    
    html = download_filing_html(cik, accession)
    assert html == "<html><body>Actual Filing Content</body></html>"

def test_find_investment_tables():
    html_content = """
    <html>
        <body>
            <table>
                <tr>
                    <th>Portfolio Company</th>
                    <th>Interest Rate</th>
                    <th>Fair Value</th>
                </tr>
                <tr>
                    <td>Acme Corp</td>
                    <td>8.5%</td>
                    <td>10.0</td>
                </tr>
            </table>
            <table>
                <tr>
                    <th>Some other table</th>
                    <th>Does not match</th>
                </tr>
            </table>
        </body>
    </html>
    """
    
    dfs = find_investment_tables(html_content)
    
    assert len(dfs) == 1
    assert "Portfolio Company" in dfs[0].columns
    assert len(dfs[0]) == 1

def test_fetch_latest_filing(httpx_mock, mock_sec_filings_json):
    cik = "12345"
    ticker = "TEST"
    
    # Mock filings list
    httpx_mock.add_response(
        url="https://data.sec.gov/submissions/CIK0000012345.json",
        json=mock_sec_filings_json
    )
    
    # Mock index.html
    mock_index_html = """
    <html>
        <body>
            <table class="tableFile">
                <tr>
                    <td></td><td></td>
                    <td><a href="10q.htm">10q.htm</a></td>
                    <td>10-Q</td>
                </tr>
            </table>
        </body>
    </html>
    """
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/0001-24-001-index.html",
        text=mock_index_html
    )
    
    # Mock index.json
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/index.json",
        json={}
    )
    
    # Mock document HTML
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124001/10q.htm",
        text="<html><body>Content</body></html>"
    )
    
    # Test with no already_processed
    result = fetch_latest_filing(ticker, cik, already_processed=[])
    
    assert result is not None
    assert result["accession"] == "0001-24-001"
    assert result["html_content"] == "<html><body>Content</body></html>"
    
    # Add mock again for the second call
    httpx_mock.add_response(
        url="https://data.sec.gov/submissions/CIK0000012345.json",
        json=mock_sec_filings_json
    )
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124004/index.json",
        json={}
    )
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124004/0001-24-004-index.html",
        text=mock_index_html
    )
    httpx_mock.add_response(
        url="https://www.sec.gov/Archives/edgar/data/12345/000124004/10q.htm",
        text="<html><body>Content 2</body></html>"
    )
    
    # Test with already_processed containing the latest
    result_skip = fetch_latest_filing(ticker, cik, already_processed=["0001-24-001"])
    assert result_skip["accession"] == "0001-24-004"
