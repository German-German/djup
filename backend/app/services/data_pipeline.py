import logging
import time
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.database import BDCCompany, BDCLoan, BDCSummary, FilingRegistry, MacroIndicator
from app.scrapers import edgar_scraper, fmp_scraper, fred_scraper
from app.parsers import investment_parser

logger = logging.getLogger(__name__)

def ingest_bdc_filing(bdc_ticker: str, cik: str, db: Session) -> dict:
    try:
        # 1. Check filing_registry table for already-processed accession numbers for this ticker
        processed_records = db.query(FilingRegistry.accession_number).filter(
            FilingRegistry.bdc_ticker == bdc_ticker,
            FilingRegistry.processing_status == "success"
        ).all()
        already_processed = [r.accession_number for r in processed_records]

        # 2. Call edgar_scraper.fetch_latest_filing() to get unprocessed filing HTML
        filing_data = edgar_scraper.fetch_latest_filing(bdc_ticker, cik, already_processed)
        
        # 3. If no new filing found, return status
        if not filing_data:
            return {"status": "no_new_filings", "ticker": bdc_ticker}

        accession_number = filing_data['accession']
        filing_date_str = filing_data['date']
        html_content = filing_data.get('html_content')
        
        filing_date = datetime.strptime(filing_date_str, "%Y-%m-%d").date() if isinstance(filing_date_str, str) else filing_date_str

        # 4. Call investment_parser.parse_10q_investments() to get list of loan dicts
        loans = investment_parser.parse_10q_investments(html_content, bdc_ticker)
        
        for loan in loans:
            loan['accession_number'] = accession_number
            loan['filing_date'] = filing_date
            loan['bdc_ticker'] = bdc_ticker
            if 'is_non_accrual' not in loan:
                loan['is_non_accrual'] = False

        # 5. Bulk insert loans into bdc_loans table using SQLAlchemy bulk_insert_mappings
        if loans:
            db.bulk_insert_mappings(BDCLoan, loans)

        # 6. Fetch BDC stock price from FMP scraper
        price_data = fmp_scraper.fetch_bdc_price_data(bdc_ticker)
        stock_price = price_data.get("price", 0.0)

        # 7. Compute and insert summary row into bdc_summary
        total_fair_value = sum(l.get('fair_value', 0) for l in loans)
        if total_fair_value > 0:
            weighted_yield = sum((l.get('interest_rate', 0) * l.get('fair_value', 0)) for l in loans if l.get('loan_type', '').lower() != 'equity') / total_fair_value
            non_accrual_val = sum(l.get('fair_value', 0) for l in loans if l.get('is_non_accrual'))
            non_accrual_rate_pct = (non_accrual_val / total_fair_value) * 100
            
            first_lien_val = sum(l.get('fair_value', 0) for l in loans if l.get('loan_type', '').lower() == 'first_lien')
            first_lien_pct = (first_lien_val / total_fair_value) * 100
        else:
            weighted_yield = 0.0
            non_accrual_rate_pct = 0.0
            first_lien_pct = 0.0

        nav_per_share = 15.0 # This would typically be parsed from the 10-Q as well
        nav_premium_discount_pct = ((stock_price / nav_per_share) - 1) * 100 if nav_per_share > 0 else 0.0

        summary = BDCSummary(
            bdc_ticker=bdc_ticker,
            filing_date=filing_date,
            stock_price=stock_price,
            nav_per_share=nav_per_share,
            nav_premium_discount_pct=nav_premium_discount_pct,
            total_portfolio_fair_value=total_fair_value,
            weighted_avg_yield=weighted_yield,
            non_accrual_rate_pct=non_accrual_rate_pct,
            first_lien_pct=first_lien_pct,
            total_loan_count=len(loans)
        )
        db.add(summary)

        # 8. Mark filing as "success" in filing_registry
        registry = db.query(FilingRegistry).filter_by(accession_number=accession_number).first()
        if not registry:
            registry = FilingRegistry(
                bdc_ticker=bdc_ticker,
                accession_number=accession_number,
                filing_date=filing_date,
            )
            db.add(registry)
        
        registry.processing_status = "success"
        registry.processed_at = datetime.now()

        db.commit()

        # 9. Return success
        return {"status": "success", "loans_inserted": len(loans), "ticker": bdc_ticker}

    except Exception as e:
        db.rollback()
        logger.error(f"Error processing BDC {bdc_ticker}: {e}")
        try:
            # Try to extract accession_number from filing_data if it exists
            # to record the failure against a specific filing
            accession = locals().get('accession_number')
            
            if accession:
                registry = db.query(FilingRegistry).filter_by(accession_number=accession).first()
                if not registry:
                    registry = FilingRegistry(
                        bdc_ticker=bdc_ticker,
                        accession_number=accession,
                        filing_date=locals().get('filing_date'),
                    )
                    db.add(registry)
                
                registry.processing_status = "failed"
                registry.error_message = str(e)
                registry.processed_at = datetime.now()
                db.commit()
            else:
                # Generic failure record if we didn't even get to the filing data
                pass
        except Exception as inner_e:
            db.rollback()
            logger.error(f"Failed to save error to registry: {inner_e}")
            
        return {"status": "failed", "ticker": bdc_ticker, "error": str(e)}

def ingest_all_bdcs(db: Session) -> list[dict]:
    bdcs = db.query(BDCCompany).all()
    results = []
    for bdc in bdcs:
        res = ingest_bdc_filing(bdc.ticker, bdc.cik, db)
        results.append(res)
        time.sleep(1)
    return results

def ingest_macro_data(db: Session) -> dict:
    macro_data = fred_scraper.fetch_all_macro_series()
    upserted_count = 0
    for series_name, obs_list in macro_data.items():
        # Insert or update on conflict of date+series_id
        for obs in obs_list:
            if obs['value'] is None:
                continue
            
            obs_date = datetime.strptime(obs['date'], "%Y-%m-%d").date()
            existing = db.query(MacroIndicator).filter_by(date=obs_date, series_id=series_name).first()
            if existing:
                if existing.value != obs['value']:
                    existing.value = obs['value']
                    upserted_count += 1
            else:
                new_ind = MacroIndicator(
                    date=obs_date,
                    series_id=series_name, # Storing series_name as series_id for consistency with scraper
                    series_name=series_name,
                    value=obs['value']
                )
                db.add(new_ind)
                upserted_count += 1
    
    db.commit()
    return {"status": "success", "rows_upserted": upserted_count}

def run_full_refresh(db: Session) -> dict:
    start_time = datetime.now()
    
    bdc_results = ingest_all_bdcs(db)
    macro_result = ingest_macro_data(db)
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    logger.info(f"Full refresh completed in {duration} seconds.")
    
    return {
        "status": "success",
        "duration_seconds": duration,
        "bdc_results": bdc_results,
        "macro_result": macro_result
    }
